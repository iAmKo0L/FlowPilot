package com.vdt.flowpilot.workflow.controller;

import com.vdt.flowpilot.common.response.ApiResponse;
import com.vdt.flowpilot.workflow.dto.*;
import com.vdt.flowpilot.workflow.service.WorkflowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/workflows")
@Tag(name = "Admin Workflow", description = "Endpoints for administrators to manage business workflows and BPMN process deployments")
@SecurityRequirement(name = "bearerAuth")
public class WorkflowController {

    private final WorkflowService workflowService;

    public WorkflowController(WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'REQUESTER', 'APPROVER', 'MONITOR')")
    @Operation(summary = "Get All Workflows", description = "Retrieves a list of all configured workflow definitions")
    public ResponseEntity<ApiResponse<List<WorkflowDefinitionDto>>> getAllWorkflows() {
        List<WorkflowDefinitionDto> response = workflowService.getAllWorkflows();
        return ResponseEntity.ok(ApiResponse.success("All workflows retrieved", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get Workflow by ID", description = "Retrieves workflow definition details by ID")
    public ResponseEntity<ApiResponse<WorkflowDefinitionDto>> getWorkflowById(@PathVariable Long id) {
        WorkflowDefinitionDto response = workflowService.getWorkflowById(id);
        return ResponseEntity.ok(ApiResponse.success("Workflow retrieved", response));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create Workflow", description = "Creates a new workflow definition draft")
    public ResponseEntity<ApiResponse<WorkflowDefinitionDto>> createWorkflow(@Valid @RequestBody CreateWorkflowRequest request) {
        WorkflowDefinitionDto response = workflowService.createWorkflow(request);
        return ResponseEntity.ok(ApiResponse.success("Workflow created successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update Workflow", description = "Updates an existing workflow definition")
    public ResponseEntity<ApiResponse<WorkflowDefinitionDto>> updateWorkflow(@PathVariable Long id, @Valid @RequestBody CreateWorkflowRequest request) {
        WorkflowDefinitionDto response = workflowService.updateWorkflow(id, request);
        return ResponseEntity.ok(ApiResponse.success("Workflow updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete Workflow", description = "Removes a workflow definition")
    public ResponseEntity<ApiResponse<Void>> deleteWorkflow(@PathVariable Long id) {
        workflowService.deleteWorkflow(id);
        return ResponseEntity.ok(ApiResponse.success("Workflow deleted successfully", null));
    }

    @PostMapping("/{id}/steps")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Add Step to Workflow", description = "Appends a new step configuration to the workflow")
    public ResponseEntity<ApiResponse<WorkflowDefinitionDto>> addStep(@PathVariable Long id, @Valid @RequestBody CreateStepRequest request) {
        WorkflowDefinitionDto response = workflowService.addStep(id, request);
        return ResponseEntity.ok(ApiResponse.success("Step added successfully", response));
    }

    @PutMapping("/{id}/steps/{stepId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update Workflow Step", description = "Updates an existing step configuration in the workflow")
    public ResponseEntity<ApiResponse<WorkflowDefinitionDto>> updateStep(@PathVariable Long id, @PathVariable Long stepId, @Valid @RequestBody CreateStepRequest request) {
        WorkflowDefinitionDto response = workflowService.updateStep(id, stepId, request);
        return ResponseEntity.ok(ApiResponse.success("Step updated successfully", response));
    }

    @DeleteMapping("/{id}/steps/{stepId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete Workflow Step", description = "Removes a step configuration from the workflow")
    public ResponseEntity<ApiResponse<WorkflowDefinitionDto>> deleteStep(@PathVariable Long id, @PathVariable Long stepId) {
        WorkflowDefinitionDto response = workflowService.deleteStep(id, stepId);
        return ResponseEntity.ok(ApiResponse.success("Step deleted successfully", response));
    }

    @GetMapping("/{id}/bpmn-preview")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Preview BPMN XML", description = "Generates and returns the BPMN 2.0 XML representation of the workflow steps")
    public ResponseEntity<ApiResponse<String>> previewBpmnXml(@PathVariable Long id) {
        String response = workflowService.previewBpmnXml(id);
        return ResponseEntity.ok(ApiResponse.success("BPMN XML preview generated", response));
    }

    @PostMapping("/{id}/deploy")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deploy Workflow to BPMN Engine", description = "Generates the BPMN XML and deploys the process to the Camunda BPMN engine")
    public ResponseEntity<ApiResponse<WorkflowDefinitionDto>> deployWorkflow(@PathVariable Long id) {
        WorkflowDefinitionDto response = workflowService.deployWorkflow(id);
        return ResponseEntity.ok(ApiResponse.success("Workflow deployed successfully to Camunda", response));
    }

}
