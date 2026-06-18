package com.vdt.flowpilot.workflow.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateWorkflowRequest {
    @NotBlank(message = "Code is required")
    private String code;
    @NotBlank(message = "Name is required")
    private String name;
    private String description;
    private String bpmnProcessKey;
}
