package com.vdt.flowpilot.process.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessHistoryDto {
    private Long id;
    private String action;
    private String actor;
    private String taskName;
    private String comment;
    private String oldStatus;
    private String newStatus;
    private LocalDateTime createdAt;
}
