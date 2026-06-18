package com.vdt.flowpilot.task.controller;

import com.vdt.flowpilot.common.response.ApiResponse;
import com.vdt.flowpilot.task.dto.CompleteTaskRequest;
import com.vdt.flowpilot.task.dto.TaskDto;
import com.vdt.flowpilot.task.service.MeetingTaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meeting-tasks")
@PreAuthorize("hasAnyRole('REQUESTER', 'APPROVER', 'ADMIN')")
@Tag(name = "Meeting Tasks Inbox", description = "Endpoints for approvers to review, claim, approve, or reject meeting requests")
@SecurityRequirement(name = "bearerAuth")
public class MeetingTaskController {

    private final MeetingTaskService taskService;

    public MeetingTaskController(MeetingTaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping("/my")
    @Operation(summary = "My Approval Tasks", description = "Retrieves active meeting approval tasks assigned to the user or candidate groups they belong to")
    public ResponseEntity<ApiResponse<List<TaskDto>>> getMyTasks() {
        List<TaskDto> response = taskService.getMyTasks();
        return ResponseEntity.ok(ApiResponse.success("Há»™p thÆ° cĂ´ng viá»‡c phĂª duyá»‡t Ä‘Ă£ Ä‘Æ°á»£c táº£i", response));
    }

    @GetMapping("/{taskId}")
    @Operation(summary = "Get Task Detail", description = "Retrieves specific meeting task details by ID")
    public ResponseEntity<ApiResponse<TaskDto>> getTaskById(@PathVariable String taskId) {
        TaskDto response = taskService.getTaskById(taskId);
        return ResponseEntity.ok(ApiResponse.success("Chi tiáº¿t cĂ´ng viá»‡c phĂª duyá»‡t Ä‘Ă£ Ä‘Æ°á»£c táº£i", response));
    }

    @PostMapping("/{taskId}/claim")
    @Operation(summary = "Claim Meeting Task", description = "Claims a meeting task for the current user")
    public ResponseEntity<ApiResponse<Void>> claimTask(@PathVariable String taskId) {
        taskService.claimTask(taskId);
        return ResponseEntity.ok(ApiResponse.success("ÄĂ£ nháº­n xá»­ lĂ½ cĂ´ng viá»‡c thĂ nh cĂ´ng", null));
    }

    @PostMapping("/{taskId}/complete")
    @Operation(summary = "Complete Workflow Task", description = "Completes a dynamic workflow task with submitted variables and comment")
    public ResponseEntity<ApiResponse<Void>> completeTask(@PathVariable String taskId,
                                                          @RequestBody(required = false) CompleteTaskRequest request) {
        taskService.completeTask(taskId, request);
        return ResponseEntity.ok(ApiResponse.success("Task completed successfully", null));
    }
    @PostMapping("/{taskId}/approve")
    @Operation(summary = "Approve Meeting Task", description = "Approves the meeting scheduling request, moves workflow forward, and confirms room reserve")
    public ResponseEntity<ApiResponse<Void>> approveTask(@PathVariable String taskId,
                                                         @RequestParam(required = false) String comment) {
        taskService.approveTask(taskId, comment);
        return ResponseEntity.ok(ApiResponse.success("ÄĂ£ phĂª duyá»‡t lá»‹ch há»p thĂ nh cĂ´ng", null));
    }

    @PostMapping("/{taskId}/reject")
    @Operation(summary = "Reject Meeting Task", description = "Rejects the meeting scheduling request and cancels the room reservation hold")
    public ResponseEntity<ApiResponse<Void>> rejectTask(@PathVariable String taskId,
                                                        @RequestParam(required = false) String comment) {
        taskService.rejectTask(taskId, comment);
        return ResponseEntity.ok(ApiResponse.success("ÄĂ£ tá»« chá»‘i lá»‹ch há»p thĂ nh cĂ´ng", null));
    }
}

