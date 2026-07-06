package com.vdt.flowpilot.workflow.controller;

import com.vdt.flowpilot.common.response.ApiResponse;
import com.vdt.flowpilot.workflow.dto.WorkflowDefinitionDto;
import com.vdt.flowpilot.workflow.service.WorkflowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workflows")
@Tag(name = "User Workflow", description = "Endpoints for general users to view and interact with workflows")
@SecurityRequirement(name = "bearerAuth")
public class WorkflowUserController {

    private final WorkflowService workflowService;

    public WorkflowUserController(WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @GetMapping("/available")
    @PreAuthorize("hasAnyRole('REQUESTER', 'ADMIN', 'APPROVER', 'MONITOR')")
    @Operation(summary = "Get Available Workflows", description = "Retrieves a list of all active (deployed) workflows")
    public ResponseEntity<ApiResponse<List<WorkflowDefinitionDto>>> getAvailableWorkflows() {
        List<WorkflowDefinitionDto> response = workflowService.getAvailableWorkflows();
        return ResponseEntity.ok(ApiResponse.success("Available workflows retrieved", response));
    }

}
