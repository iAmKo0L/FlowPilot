package com.vdt.flowpilot.task.service;

import com.vdt.flowpilot.auth.dto.UserDto;
import com.vdt.flowpilot.auth.service.AuthService;
import com.vdt.flowpilot.bpmn.adapter.BpmnAdapter;
import com.vdt.flowpilot.bpmn.dto.BpmnTaskDto;
import com.vdt.flowpilot.common.exception.BusinessException;
import com.vdt.flowpilot.common.exception.ResourceNotFoundException;
import com.vdt.flowpilot.meeting.dto.MeetingRequestDto;
import com.vdt.flowpilot.meeting.entity.MeetingAttendee;
import com.vdt.flowpilot.meeting.entity.MeetingRequest;
import com.vdt.flowpilot.meeting.repository.MeetingRequestRepository;
import com.vdt.flowpilot.meeting.service.MeetingService;
import com.vdt.flowpilot.notification.entity.Notification;
import com.vdt.flowpilot.notification.repository.NotificationRepository;
import com.vdt.flowpilot.process.entity.ProcessHistory;
import com.vdt.flowpilot.process.entity.ProcessTaskSnapshot;
import com.vdt.flowpilot.process.repository.ProcessHistoryRepository;
import com.vdt.flowpilot.process.repository.ProcessTaskSnapshotRepository;
import com.vdt.flowpilot.task.dto.CompleteTaskRequest;
import com.vdt.flowpilot.task.dto.TaskDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MeetingTaskService {

    private final MeetingRequestRepository meetingRepository;
    private final ProcessTaskSnapshotRepository taskSnapshotRepository;
    private final ProcessHistoryRepository historyRepository;
    private final NotificationRepository notificationRepository;
    private final BpmnAdapter bpmnAdapter;
    private final AuthService authService;
    private final MeetingService meetingService;

    public MeetingTaskService(MeetingRequestRepository meetingRepository,
                              ProcessTaskSnapshotRepository taskSnapshotRepository,
                              ProcessHistoryRepository historyRepository,
                              NotificationRepository notificationRepository,
                              BpmnAdapter bpmnAdapter,
                              AuthService authService,
                              MeetingService meetingService) {
        this.meetingRepository = meetingRepository;
        this.taskSnapshotRepository = taskSnapshotRepository;
        this.historyRepository = historyRepository;
        this.notificationRepository = notificationRepository;
        this.bpmnAdapter = bpmnAdapter;
        this.authService = authService;
        this.meetingService = meetingService;
    }

    @Transactional
    public List<TaskDto> getMyTasks() {
        UserDto currentUser = authService.getCurrentUser();
        String username = currentUser.getUsername();
        List<String> roles = currentUser.getRoles();

        List<BpmnTaskDto> rawTasks = new ArrayList<>();

        if (roles.contains("ADMIN")) {
            meetingRepository.findAll().stream()
                    .flatMap(meeting -> meetingService.getCandidateGroups(meeting).stream())
                    .distinct()
                    .forEach(group -> rawTasks.addAll(bpmnAdapter.getTasksByCandidateGroup(group)));
            rawTasks.addAll(bpmnAdapter.getTasksByAssignee(username));
        } else {
            roles.forEach(role -> rawTasks.addAll(bpmnAdapter.getTasksByCandidateGroup(role)));
            rawTasks.addAll(bpmnAdapter.getTasksByAssignee(username));
        }

        Map<String, BpmnTaskDto> taskMap = new LinkedHashMap<>();
        for (BpmnTaskDto task : rawTasks) {
            taskMap.put(task.getId(), task);
        }

        List<TaskDto> response = new ArrayList<>();
        for (BpmnTaskDto task : taskMap.values()) {
            Optional<MeetingRequest> reqOpt = meetingRepository.findByProcessInstanceId(task.getProcessInstanceId());
            if (reqOpt.isPresent()) {
                MeetingRequest req = reqOpt.get();
                if (!"PENDING_APPROVAL".equals(req.getStatus())) {
                    continue;
                }
                meetingService.syncTasksForMeeting(req);

                response.add(TaskDto.builder()
                        .id(task.getId())
                        .name(task.getName())
                        .taskDefinitionKey(task.getTaskDefinitionKey())
                        .assignee(task.getAssignee())
                        .candidateGroup(task.getAssignee() != null ? null : meetingService.findCandidateGroup(req, task.getTaskDefinitionKey()))
                        .requestId(req.getId())
                        .requestCode(req.getRequestCode())
                        .requestTitle(req.getTitle())
                        .content(req.getMeetingContent())
                        .status(task.getAssignee() != null ? "CLAIMED" : "CREATED")
                        .createdAt(task.getCreated() != null ? LocalDateTime.ofInstant(task.getCreated().toInstant(), ZoneId.systemDefault()) : LocalDateTime.now())
                        .build());
            }
        }
        return response;
    }

    @Transactional
    public TaskDto getTaskById(String taskId) {
        List<TaskDto> myTasks = getMyTasks();
        return myTasks.stream()
                .filter(t -> t.getId().equals(taskId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy task hoặc bạn không có quyền truy cập: " + taskId));
    }

    @Transactional
    public void claimTask(String taskId) {
        UserDto currentUser = authService.getCurrentUser();
        bpmnAdapter.claimTask(taskId, currentUser.getUsername());

        Optional<ProcessTaskSnapshot> snapshotOpt = taskSnapshotRepository.findByTaskId(taskId);
        if (snapshotOpt.isPresent()) {
            ProcessTaskSnapshot snapshot = snapshotOpt.get();
            snapshot.setAssignee(currentUser.getUsername());
            snapshot.setStatus("CLAIMED");
            taskSnapshotRepository.save(snapshot);

            historyRepository.save(ProcessHistory.builder()
                    .meetingRequest(snapshot.getMeetingRequest())
                    .action("CLAIMED")
                    .actor(currentUser.getUsername())
                    .taskName(snapshot.getTaskName())
                    .comment("Đã nhận xử lý phê duyệt lịch họp")
                    .oldStatus("CREATED")
                    .newStatus("CLAIMED")
                    .build());
        }
    }

    @Transactional
    public void completeTask(String taskId, CompleteTaskRequest requestDto) {
        UserDto currentUser = authService.getCurrentUser();
        ProcessTaskSnapshot snapshot = taskSnapshotRepository.findByTaskId(taskId)
                .orElseGet(() -> {
                    getMyTasks();
                    return taskSnapshotRepository.findByTaskId(taskId)
                            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy snapshot của task với id: " + taskId));
                });

        MeetingRequest request = snapshot.getMeetingRequest();
        Map<String, Object> variables = new HashMap<>();
        if (requestDto != null && requestDto.getVariables() != null) {
            variables.putAll(requestDto.getVariables());
        }
        if (requestDto != null && requestDto.getComment() != null) {
            variables.put("comment", requestDto.getComment());
            variables.put("approverComment", requestDto.getComment());
        }

        if (snapshot.getAssignee() == null) {
            bpmnAdapter.claimTask(taskId, currentUser.getUsername());
            snapshot.setAssignee(currentUser.getUsername());
        }

        bpmnAdapter.completeTask(taskId, variables);

        snapshot.setStatus("COMPLETED");
        snapshot.setCompletedAt(LocalDateTime.now());
        taskSnapshotRepository.save(snapshot);

        historyRepository.save(ProcessHistory.builder()
                .meetingRequest(request)
                .action(Boolean.FALSE.equals(variables.get("approved")) ? "REJECTED_STEP" : "TASK_COMPLETED")
                .actor(currentUser.getUsername())
                .taskName(snapshot.getTaskName())
                .comment(requestDto != null ? requestDto.getComment() : null)
                .oldStatus(request.getStatus())
                .newStatus(request.getStatus())
                .build());

        meetingService.syncTasksForMeeting(request);
    }

    @Transactional
    public void approveTask(String taskId, String comment) {
        CompleteTaskRequest request = new CompleteTaskRequest();
        request.setComment(comment);
        request.setVariables(Map.of("approved", true));
        completeTask(taskId, request);
    }

    @Transactional
    public void rejectTask(String taskId, String comment) {
        CompleteTaskRequest request = new CompleteTaskRequest();
        request.setComment(comment);
        request.setVariables(Map.of("approved", false));
        completeTask(taskId, request);
    }
}
