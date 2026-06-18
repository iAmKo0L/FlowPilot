package com.vdt.flowpilot.workflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateStepRequest {
    @NotBlank(message = "Step key is required")
    private String stepKey;
    @NotBlank(message = "Step name is required")
    private String stepName;
    @NotBlank(message = "Step type is required")
    private String stepType;
    private String assigneeRole;
    @NotNull(message = "Order index is required")
    private Integer orderIndex;
    private String configJson;
}
