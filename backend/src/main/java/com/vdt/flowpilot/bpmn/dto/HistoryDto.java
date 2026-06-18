package com.vdt.flowpilot.bpmn.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoryDto {
    private String id;
    private String activityId;
    private String activityName;
    private String activityType;
    private Date startTime;
    private Date endTime;
    private String assignee;
}
