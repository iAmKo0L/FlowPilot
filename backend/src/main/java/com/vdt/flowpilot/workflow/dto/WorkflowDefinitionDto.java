package com.vdt.flowpilot.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowDefinitionDto {
    private Long id;
    private String code;
    private String name;
    private String description;
    private Integer version;
    private String status;
    private String bpmnProcessKey;
    private String deploymentId;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<WorkflowStepDto> steps;
    private List<WorkflowFormFieldDto> formFields;
}
