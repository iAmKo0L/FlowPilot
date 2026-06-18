package com.vdt.flowpilot.task.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskDto {
    private String id;
    private String name;
    private String taskDefinitionKey;
    private String assignee;
    private String candidateGroup;
    private Long requestId;
    private String requestCode;
    private String requestTitle;
    private String applicantName;
    private BigDecimal amount;
    private String content;
    private String status;
    private LocalDateTime createdAt;
}
