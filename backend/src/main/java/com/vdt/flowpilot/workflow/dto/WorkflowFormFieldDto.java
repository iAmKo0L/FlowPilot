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
public class WorkflowFormFieldDto {
    private Long id;
    private String fieldKey;
    private String fieldLabel;
    private String fieldType; // TEXT, NUMBER, DATE, BOOLEAN, SELECT, TEXTAREA
    private boolean required;
    private String optionsJson;
    private String defaultValue;
    private String validationJson;
    private Integer orderIndex;
    private boolean sensitive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
