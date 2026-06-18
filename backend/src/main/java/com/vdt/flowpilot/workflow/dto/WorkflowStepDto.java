package com.vdt.flowpilot.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowStepDto {
    private Long id;
    private String stepKey;
    private String stepName;
    private String stepType;
    private String assigneeRole;
    private Integer orderIndex;
    private String configJson;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
