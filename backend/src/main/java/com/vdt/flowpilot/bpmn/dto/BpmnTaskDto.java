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
public class BpmnTaskDto {
    private String id;
    private String name;
    private String taskDefinitionKey;
    private String assignee;
    private String processInstanceId;
    private Date created;
}
