package com.vdt.flowpilot.meeting.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vdt.flowpilot.auth.dto.UserDto;
import com.vdt.flowpilot.auth.entity.User;
import com.vdt.flowpilot.auth.repository.UserRepository;
import com.vdt.flowpilot.auth.service.AuthService;
import com.vdt.flowpilot.bpmn.adapter.BpmnAdapter;
import com.vdt.flowpilot.bpmn.dto.HistoryDto;
import com.vdt.flowpilot.bpmn.dto.ProcessInstanceDto;
import com.vdt.flowpilot.bpmn.dto.StartProcessResult;
import com.vdt.flowpilot.bpmn.dto.BpmnTaskDto;
import com.vdt.flowpilot.common.exception.BusinessException;
import com.vdt.flowpilot.common.exception.ResourceNotFoundException;
import com.vdt.flowpilot.meeting.dto.*;
import com.vdt.flowpilot.meeting.entity.MeetingAttendee;
import com.vdt.flowpilot.meeting.entity.MeetingRequest;
import com.vdt.flowpilot.meeting.repository.MeetingAttendeeRepository;
import com.vdt.flowpilot.meeting.repository.MeetingRequestRepository;
import com.vdt.flowpilot.notification.entity.Notification;
import com.vdt.flowpilot.notification.repository.NotificationRepository;
import com.vdt.flowpilot.notification.service.EmailService;
import com.vdt.flowpilot.process.dto.ProcessHistoryDto;
import com.vdt.flowpilot.process.entity.ProcessHistory;
import com.vdt.flowpilot.process.entity.ProcessTaskSnapshot;
import com.vdt.flowpilot.process.repository.ProcessHistoryRepository;
import com.vdt.flowpilot.process.repository.ProcessTaskSnapshotRepository;
import com.vdt.flowpilot.room.dto.EquipmentDto;
import com.vdt.flowpilot.room.entity.Equipment;
import com.vdt.flowpilot.room.entity.MeetingRoom;
import com.vdt.flowpilot.room.repository.EquipmentRepository;
import com.vdt.flowpilot.room.repository.MeetingRoomRepository;
import com.vdt.flowpilot.workflow.entity.WorkflowDefinition;
import com.vdt.flowpilot.workflow.entity.WorkflowStep;
import com.vdt.flowpilot.workflow.repository.WorkflowDefinitionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MeetingService {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private final MeetingRequestRepository meetingRepository;
    private final MeetingAttendeeRepository attendeeRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final MeetingRoomRepository roomRepository;
    private final EquipmentRepository equipmentRepository;
    private final WorkflowDefinitionRepository workflowRepository;
    private final ProcessHistoryRepository historyRepository;
    private final ProcessTaskSnapshotRepository taskSnapshotRepository;
    private final UserRepository userRepository;
    private final BpmnAdapter bpmnAdapter;
    private final AuthService authService;
    private final ObjectMapper objectMapper;

    @Value("${app.meeting-hold.duration-minutes:15}")
    private long holdDurationMinutes;

    public MeetingService(MeetingRequestRepository meetingRepository,
                          MeetingAttendeeRepository attendeeRepository,
                          NotificationRepository notificationRepository,
                          EmailService emailService,
                          MeetingRoomRepository roomRepository,
                          EquipmentRepository equipmentRepository,
                          WorkflowDefinitionRepository workflowRepository,
                          ProcessHistoryRepository historyRepository,
                          ProcessTaskSnapshotRepository taskSnapshotRepository,
                          UserRepository userRepository,
                          BpmnAdapter bpmnAdapter,
                          AuthService authService,
                          ObjectMapper objectMapper) {
        this.meetingRepository = meetingRepository;
        this.attendeeRepository = attendeeRepository;
        this.notificationRepository = notificationRepository;
        this.emailService = emailService;
        this.roomRepository = roomRepository;
        this.equipmentRepository = equipmentRepository;
        this.workflowRepository = workflowRepository;
        this.historyRepository = historyRepository;
        this.taskSnapshotRepository = taskSnapshotRepository;
        this.userRepository = userRepository;
        this.bpmnAdapter = bpmnAdapter;
        this.authService = authService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public MeetingRequestDto createMeeting(CreateMeetingRequestDto dto) {
        // BR-01: start_time < end_time
        if (!dto.getStartTime().isBefore(dto.getEndTime())) {
            throw new BusinessException("Thời gian bắt đầu phải trước thời gian kết thúc");
        }

        // BR-02 & BR-03: Offline/hybrid must have a room, online might not
        boolean isOnline = "ONLINE".equalsIgnoreCase(dto.getMeetingType());
        if (!isOnline && dto.getRoomId() == null) {
            throw new BusinessException("Cuộc họp offline/hybrid phải có phòng họp, họp online có thể không cần phòng");
        }

        MeetingRoom room = null;
        if (dto.getRoomId() != null) {
            room = roomRepository.findById(dto.getRoomId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng họp với id: " + dto.getRoomId()));

            // BR-04: Room must be ACTIVE
            if (!"ACTIVE".equalsIgnoreCase(room.getStatus())) {
                throw new BusinessException("Phòng họp đang ở trạng thái không hoạt động hoặc bảo trì: " + room.getRoomName());
            }

            validateRoomCapacity(room, dto.getAttendees() != null ? dto.getAttendees().size() : 0);

            // BR-05 & BR-06: Check reservation conflicts
            List<MeetingRequest> conflicts = meetingRepository.findConflictingRequests(
                    dto.getRoomId(), dto.getStartTime(), dto.getEndTime(), null, LocalDateTime.now()
            );
            if (!conflicts.isEmpty()) {
                throw new BusinessException("Phòng họp đang bị trùng lịch với cuộc họp khác trong khoảng thời gian này");
            }

            // BR-07: Selected equipments must belong to the room
            if (dto.getEquipmentIds() != null && !dto.getEquipmentIds().isEmpty()) {
                Set<Long> roomEqIds = room.getEquipments().stream().map(Equipment::getId).collect(Collectors.toSet());
                for (Long eqId : dto.getEquipmentIds()) {
                    if (!roomEqIds.contains(eqId)) {
                        Equipment eq = equipmentRepository.findById(eqId).orElseThrow();
                        throw new BusinessException("Thiết bị " + eq.getEquipmentName() + " không thuộc phòng họp được chọn");
                    }
                }
            }
        }

        // BR-08: Check duplicate attendee emails
        Set<String> attendeeEmails = new HashSet<>();
        for (CreateMeetingRequestDto.AttendeeInput input : dto.getAttendees()) {
            if (!attendeeEmails.add(input.getEmail().toLowerCase().trim())) {
                throw new BusinessException("Email người tham gia bị trùng: " + input.getEmail());
            }
        }

        WorkflowDefinition workflow = resolveWorkflow(dto.getWorkflowId());

        UserDto currentUser = authService.getCurrentUser();

        // Generate Request Code
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = meetingRepository.count() + 1;
        String requestCode = String.format("MTG-%s-%04d", dateStr, count);

        // Fetch selected equipments
        Set<Equipment> equipments = new HashSet<>();
        if (dto.getEquipmentIds() != null) {
            equipments.addAll(equipmentRepository.findAllById(dto.getEquipmentIds()));
        }

        MeetingRequest request = MeetingRequest.builder()
                .requestCode(requestCode)
                .workflow(workflow)
                .room(room)
                .title(dto.getTitle())
                .meetingContent(dto.getMeetingContent())
                .meetingType(dto.getMeetingType())
                .onlineMeetingLink(dto.getOnlineMeetingLink())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .priority(dto.getPriority())
                .status("DRAFT")
                .createdBy(currentUser.getUsername())
                .equipments(equipments)
                .build();

        request = meetingRepository.save(request);

        // Map and resolve attendees
        List<MeetingAttendee> attendees = new ArrayList<>();
        for (CreateMeetingRequestDto.AttendeeInput input : dto.getAttendees()) {
            String email = input.getEmail().toLowerCase().trim();
            Optional<User> userOpt = userRepository.findByEmail(email);

            String attendeeType = userOpt.isPresent() ? "INTERNAL" : "GUEST"; // BR-09 & BR-10
            String token = "GUEST".equals(attendeeType) ? UUID.randomUUID().toString() : null; // BR-11

            MeetingAttendee attendee = MeetingAttendee.builder()
                    .meetingRequest(request)
                    .user(userOpt.orElse(null))
                    .attendeeName(input.getName() != null ? input.getName() : (userOpt.isPresent() ? userOpt.get().getFullName() : null))
                    .attendeeEmail(email)
                    .attendeeType(attendeeType)
                    .responseStatus("PENDING")
                    .responseToken(token)
                    .build();

            attendees.add(attendeeRepository.save(attendee));
        }

        request.setAttendees(attendees);
        request = meetingRepository.save(request);

        // Record History
        historyRepository.save(ProcessHistory.builder()
                .meetingRequest(request)
                .action("CREATED")
                .actor(currentUser.getUsername())
                .comment("Tạo mới yêu cầu lịch họp")
                .newStatus("DRAFT")
                .build());

        return mapToDto(request);
    }

    @Transactional
    public MeetingRequestDto startProcess(Long id) {
        MeetingRequest request = meetingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu lịch họp với id: " + id));

        if (!"DRAFT".equals(request.getStatus())) {
            throw new BusinessException("Quy trình chưa được khởi tạo trong trạng thái DRAFT");
        }

        WorkflowDefinition workflow = request.getWorkflow();
        if (!"DEPLOYED".equals(workflow.getStatus())) {
            throw new BusinessException("Quy trình '" + workflow.getName() + "' chưa được Admin deploy lên BPMN engine");
        }

        UserDto currentUser = authService.getCurrentUser();
        String processKey = workflow.getBpmnProcessKey() != null ? workflow.getBpmnProcessKey() : workflow.getCode();

        // BR-05 & BR-06 check again right before starting/holding room
        if (request.getRoom() != null) {
            validateRoomCapacity(request.getRoom(), request.getAttendees() != null ? request.getAttendees().size() : 0);

            List<MeetingRequest> conflicts = meetingRepository.findConflictingRequests(
                    request.getRoom().getId(), request.getStartTime(), request.getEndTime(), request.getId(), LocalDateTime.now()
            );
            if (!conflicts.isEmpty()) {
                request.setStatus("VALIDATION_FAILED");
                meetingRepository.save(request);

                historyRepository.save(ProcessHistory.builder()
                        .meetingRequest(request)
                        .action("VALIDATION_FAILED")
                        .actor("system")
                        .comment("Không thể gửi phê duyệt: Phòng họp đã bị trùng lịch đặt.")
                        .oldStatus("DRAFT")
                        .newStatus("VALIDATION_FAILED")
                        .build());

                throw new BusinessException("Phòng họp đang bị trùng lịch với cuộc họp khác trong khoảng thời gian này. Trạng thái chuyển thành VALIDATION_FAILED");
            }
        }

        // Setup process variables
        Map<String, Object> variables = new HashMap<>();
        variables.put("meetingRequestId", request.getId());
        variables.put("requestCode", request.getRequestCode());
        variables.put("requesterUsername", request.getCreatedBy());
        variables.put("startTime", request.getStartTime().toString());
        variables.put("endTime", request.getEndTime().toString());
        variables.put("roomId", request.getRoom() != null ? request.getRoom().getId() : null);
        variables.put("hasConflict", false); // Frontend already validated and we double-checked
        addConfiguredConditionDefaults(workflow, variables);

        try {
            StartProcessResult result = bpmnAdapter.startProcess(processKey, variables);

            request.setProcessInstanceId(result.getId());
            request.setStatus("PENDING_APPROVAL");
            request.setHoldUntil(LocalDateTime.now().plusMinutes(holdDurationMinutes)); // temporary room hold
            request = meetingRepository.save(request);

            // Record History
            historyRepository.save(ProcessHistory.builder()
                    .meetingRequest(request)
                    .action("ROOM_HELD")
                    .actor("system")
                    .comment("Tạm giữ phòng họp thành công")
                    .oldStatus("DRAFT")
                    .newStatus("PENDING_APPROVAL")
                    .build());

            historyRepository.save(ProcessHistory.builder()
                    .meetingRequest(request)
                    .action("APPROVAL_REQUESTED")
                    .actor(currentUser.getUsername())
                    .comment("Khởi chạy quy trình phê duyệt trên BPMN engine")
                    .oldStatus("PENDING_APPROVAL")
                    .newStatus("PENDING_APPROVAL")
                    .build());

            // Proactively sync task state immediately to load into snapshot
            syncTasksForMeeting(request);

            // Send notification to Approver
            List<User> approvers = userRepository.findAll().stream()
                    .filter(u -> u.getRoles().stream().anyMatch(r -> "APPROVER".equals(r.getCode())))
                    .collect(Collectors.toList());

            for (User app : approvers) {
                notificationRepository.save(Notification.builder()
                        .meetingRequest(request)
                        .recipientUsername(app.getUsername())
                        .recipientEmail(app.getEmail())
                        .recipientType("INTERNAL")
                        .title("Yêu cầu phê duyệt lịch họp")
                        .message("Yêu cầu lịch họp " + request.getRequestCode() + " cần được phê duyệt.")
                        .type("APPROVAL_REQUEST")
                        .status("SENT")
                        .build());
            }

        } catch (Exception e) {
            request.setStatus("FAILED");
            meetingRepository.save(request);
            throw new BusinessException("Lỗi khi kết nối với BPMN engine: " + e.getMessage());
        }

        return mapToDto(request);
    }

    @Transactional
    public List<MeetingRequestDto> getMyMeetings() {
        UserDto currentUser = authService.getCurrentUser();
        List<MeetingRequest> meetings = meetingRepository.findByCreatedByOrderByCreatedAtDesc(currentUser.getUsername());
        meetings.forEach(this::syncTasksForMeeting);
        return meetings.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public MeetingRequestDto getMeetingById(Long id) {
        MeetingRequest meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu lịch họp với id: " + id));
        syncTasksForMeeting(meeting);
        return mapToDto(meeting);
    }

    @Transactional(readOnly = true)
    public List<MeetingAttendeeDto> getAttendees(Long meetingId) {
        return attendeeRepository.findByMeetingRequestId(meetingId).stream()
                .map(this::mapToAttendeeDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public java.util.List<com.vdt.flowpilot.process.dto.ProcessHistoryDto> getMeetingHistory(Long id) {
        meetingRepository.findById(id).ifPresent(this::syncTasksForMeeting);
        return historyRepository.findByMeetingRequestIdOrderByCreatedAtAsc(id).stream()
                .map(h -> com.vdt.flowpilot.process.dto.ProcessHistoryDto.builder()
                        .id(h.getId())
                        .action(h.getAction())
                        .actor(h.getActor())
                        .taskName(h.getTaskName())
                        .comment(h.getComment())
                        .oldStatus(h.getOldStatus())
                        .newStatus(h.getNewStatus())
                        .createdAt(h.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }


    @Transactional
    public void syncTasksForMeeting(MeetingRequest meeting) {
        if (meeting.getProcessInstanceId() == null || !"PENDING_APPROVAL".equals(meeting.getStatus())) {
            return;
        }

        try {
            List<BpmnTaskDto> engineTasks = getCandidateGroups(meeting).stream()
                    .flatMap(group -> bpmnAdapter.getTasksByCandidateGroup(group).stream())
                    .collect(Collectors.toMap(BpmnTaskDto::getId, task -> task, (left, right) -> left, LinkedHashMap::new))
                    .values()
                    .stream()
                    .collect(Collectors.toList());

            List<BpmnTaskDto> meetingTasks = engineTasks.stream()
                    .filter(t -> meeting.getProcessInstanceId().equals(t.getProcessInstanceId()))
                    .collect(Collectors.toList());

            if (meetingTasks.isEmpty()) {
                ProcessInstanceDto pi = bpmnAdapter.getProcessInstance(meeting.getProcessInstanceId());
                if (pi.isEnded()) {
                    List<HistoryDto> history = bpmnAdapter.getHistory(meeting.getProcessInstanceId());
                    boolean rejected = history.stream().anyMatch(h -> isRejectedActivity(h.getActivityId(), h.getActivityName()));
                    String newStatus = rejected ? "REJECTED" : "CONFIRMED";

                    String oldStatus = meeting.getStatus();
                    meeting.setStatus(newStatus);
                    meetingRepository.save(meeting);

                    List<ProcessTaskSnapshot> snapshots = taskSnapshotRepository.findByMeetingRequestId(meeting.getId());
                    for (ProcessTaskSnapshot snapshot : snapshots) {
                        if (!"COMPLETED".equals(snapshot.getStatus())) {
                            snapshot.setStatus("COMPLETED");
                            snapshot.setCompletedAt(LocalDateTime.now());
                            taskSnapshotRepository.save(snapshot);
                        }
                    }

                    historyRepository.save(ProcessHistory.builder()
                            .meetingRequest(meeting)
                            .action(rejected ? "REJECTED" : "MEETING_CONFIRMED")
                            .actor("system")
                            .comment(rejected ? "Quy trình kết thúc: Cuộc họp bị từ chối" : "Quy trình kết thúc: Cuộc họp được xác nhận thành công")
                            .oldStatus(oldStatus)
                            .newStatus(newStatus)
                            .build());

                    if (!rejected) {
                        sendMeetingConfirmedNotifications(meeting);
                    }
                }
            } else {
                for (BpmnTaskDto task : meetingTasks) {
                    Optional<ProcessTaskSnapshot> optSnapshot = taskSnapshotRepository.findByTaskId(task.getId());
                    if (optSnapshot.isEmpty()) {
                        ProcessTaskSnapshot snapshot = ProcessTaskSnapshot.builder()
                                .meetingRequest(meeting)
                                .taskId(task.getId())
                                .taskName(task.getName())
                                .taskKey(task.getTaskDefinitionKey())
                                .assignee(task.getAssignee())
                                .candidateGroup(findCandidateGroup(meeting, task.getTaskDefinitionKey()))
                                .status(task.getAssignee() != null ? "CLAIMED" : "CREATED")
                                .build();
                        taskSnapshotRepository.save(snapshot);
                    } else {
                        ProcessTaskSnapshot snapshot = optSnapshot.get();
                        snapshot.setAssignee(task.getAssignee());
                        snapshot.setStatus(task.getAssignee() != null ? "CLAIMED" : "CREATED");
                        taskSnapshotRepository.save(snapshot);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Graceful sync bypass for meeting: " + e.getMessage());
        }
    }

    private WorkflowDefinition resolveWorkflow(Long workflowId) {
        if (workflowId != null) {
            return workflowRepository.findById(workflowId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy workflow với id: " + workflowId));
        }
        return workflowRepository.findByCode("MEETING_SCHEDULING_WORKFLOW")
                .orElseThrow(() -> new ResourceNotFoundException("Chưa cấu hình workflow mặc định cho đặt lịch họp"));
    }

    private void validateRoomCapacity(MeetingRoom room, int attendeeCount) {
        if (room.getCapacity() != null && attendeeCount > room.getCapacity()) {
            throw new BusinessException("Phòng " + room.getRoomName() + " chỉ có sức chứa tối đa "
                    + room.getCapacity() + " người tham gia, nhưng yêu cầu hiện tại là " + attendeeCount + " người");
        }
    }

    private void addConfiguredConditionDefaults(WorkflowDefinition workflow, Map<String, Object> variables) {
        for (WorkflowStep step : workflow.getSteps()) {
            if (!"CONDITION".equalsIgnoreCase(step.getStepType())) {
                continue;
            }

            Map<String, Object> config = readStepConfig(step);
            Object variableObj = config.get("variable");
            if (!(variableObj instanceof String variable) || variable.isBlank()) {
                continue;
            }

            String normalizedVariable = variable.trim();
            if (variables.containsKey(normalizedVariable) || "approved".equals(normalizedVariable)) {
                continue;
            }

            variables.put(normalizedVariable, config.getOrDefault("defaultValue", true));
        }
    }

    private Map<String, Object> readStepConfig(WorkflowStep step) {
        if (step.getConfigJson() == null || step.getConfigJson().isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(step.getConfigJson(), MAP_TYPE);
        } catch (Exception e) {
            throw new BusinessException("configJson của bước điều kiện không hợp lệ " + step.getStepKey() + ": " + e.getMessage());
        }
    }

    public List<String> getCandidateGroups(MeetingRequest meeting) {
        return meeting.getWorkflow().getSteps().stream()
                .filter(step -> step.getAssigneeRole() != null && !step.getAssigneeRole().isBlank())
                .map(step -> step.getAssigneeRole().trim().toUpperCase())
                .distinct()
                .collect(Collectors.toList());
    }

    public String findCandidateGroup(MeetingRequest meeting, String taskDefinitionKey) {
        if (taskDefinitionKey == null) {
            return null;
        }
        String normalizedKey = taskDefinitionKey.startsWith("step_") ? taskDefinitionKey.substring(5) : taskDefinitionKey;
        return meeting.getWorkflow().getSteps().stream()
                .filter(step -> normalizedKey.equals(step.getStepKey()))
                .map(step -> step.getAssigneeRole() != null ? step.getAssigneeRole().trim().toUpperCase() : null)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
    }

    private boolean isRejectedActivity(String activityId, String activityName) {
        String id = activityId != null ? activityId.toLowerCase() : "";
        String name = activityName != null ? activityName.toLowerCase() : "";
        return id.contains("reject") || id.contains("rejected") || id.contains("tuchoi") || id.contains("tu_choi")
                || name.contains("reject") || name.contains("decline") || name.contains("tu choi");
    }

    private void sendMeetingConfirmedNotifications(MeetingRequest request) {
        if (notificationRepository.existsByMeetingRequestIdAndType(request.getId(), "INVITATION")) {
            return;
        }

        notificationRepository.save(Notification.builder()
                .meetingRequest(request)
                .recipientUsername(request.getCreatedBy())
                .recipientType("INTERNAL")
                .title("Yêu cầu họp đã được duyệt")
                .message("Yêu cầu họp " + request.getRequestCode() + " đã được duyệt.")
                .type("APPROVED")
                .status("SENT")
                .build());

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String timeStr = request.getStartTime().format(formatter) + " - " + request.getEndTime().format(formatter);
        String roomStr = request.getRoom() != null ? request.getRoom().getRoomName() : "Họp online";

        for (MeetingAttendee attendee : request.getAttendees()) {
            Notification notification = Notification.builder()
                    .meetingRequest(request)
                    .recipientEmail(attendee.getAttendeeEmail())
                    .recipientType(attendee.getAttendeeType())
                    .title("Lời mời họp")
                    .message("Bạn đã được mời tham gia '" + request.getTitle() + "' vào " + timeStr + " tại " + roomStr + ". Vui lòng đăng ký hoặc từ chối.")
                    .type("INVITATION")
                    .status("SENT")
                    .build();

            if ("INTERNAL".equals(attendee.getAttendeeType()) && attendee.getUser() != null) {
                notification.setRecipientUsername(attendee.getUser().getUsername());
            }

            notification = notificationRepository.save(notification);

            if ("GUEST".equals(attendee.getAttendeeType())) {
                boolean emailSent = emailService.sendGuestInvitation(request, attendee);
                notification.setStatus(emailSent ? "EMAIL_SENT" : "EMAIL_NOT_SENT");
                notificationRepository.save(notification);
            }
        }
    }

    // =========================================================================
    // MAPPING HELPERS
    // =========================================================================

    public MeetingRequestDto mapToDto(MeetingRequest request) {
        Set<EquipmentDto> eqDtos = request.getEquipments().stream()
                .map(eq -> EquipmentDto.builder()
                        .id(eq.getId())
                        .equipmentCode(eq.getEquipmentCode())
                        .equipmentName(eq.getEquipmentName())
                        .status(eq.getStatus())
                        .description(eq.getDescription())
                        .build())
                .collect(Collectors.toSet());

        List<MeetingAttendeeDto> attendeeDtos = request.getAttendees().stream()
                .map(this::mapToAttendeeDto)
                .collect(Collectors.toList());

        return MeetingRequestDto.builder()
                .id(request.getId())
                .requestCode(request.getRequestCode())
                .workflowId(request.getWorkflow().getId())
                .workflowName(request.getWorkflow().getName())
                .roomId(request.getRoom() != null ? request.getRoom().getId() : null)
                .roomName(request.getRoom() != null ? request.getRoom().getRoomName() : null)
                .roomCode(request.getRoom() != null ? request.getRoom().getRoomCode() : null)
                .title(request.getTitle())
                .meetingContent(request.getMeetingContent())
                .meetingType(request.getMeetingType())
                .onlineMeetingLink(request.getOnlineMeetingLink())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .priority(request.getPriority())
                .status(request.getStatus())
                .holdUntil(request.getHoldUntil())
                .processInstanceId(request.getProcessInstanceId())
                .createdBy(request.getCreatedBy())
                .approvedBy(request.getApprovedBy())
                .approverComment(request.getApproverComment())
                .equipments(eqDtos)
                .attendees(attendeeDtos)
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .build();
    }

    public MeetingAttendeeDto mapToAttendeeDto(MeetingAttendee attendee) {
        return MeetingAttendeeDto.builder()
                .id(attendee.getId())
                .userId(attendee.getUser() != null ? attendee.getUser().getId() : null)
                .attendeeName(attendee.getAttendeeName())
                .attendeeEmail(attendee.getAttendeeEmail())
                .attendeeType(attendee.getAttendeeType())
                .responseStatus(attendee.getResponseStatus())
                .responseToken(attendee.getResponseToken())
                .respondedAt(attendee.getRespondedAt())
                .build();
    }

    @Transactional
    public List<MeetingRequestDto> getAllMeetingsForMonitor() {
        List<MeetingRequest> meetings = meetingRepository.findAll();
        meetings.forEach(this::syncTasksForMeeting);
        return meetings.stream()
                .sorted((r1, r2) -> r2.getCreatedAt().compareTo(r1.getCreatedAt()))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public com.vdt.flowpilot.process.dto.DashboardStatsDto getDashboardStats() {
        return com.vdt.flowpilot.process.dto.DashboardStatsDto.builder()
                .totalRequests(meetingRepository.count())
                .runningProcesses(meetingRepository.countByStatus("PENDING_APPROVAL"))
                .approvedRequests(meetingRepository.countByStatus("CONFIRMED"))
                .rejectedRequests(meetingRepository.countByStatus("REJECTED"))
                .completedRequests(meetingRepository.countByStatus("CONFIRMED"))
                .failedRequests(meetingRepository.countByStatus("FAILED") + meetingRepository.countByStatus("VALIDATION_FAILED"))
                .build();
    }
}
