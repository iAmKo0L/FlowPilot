package com.vdt.flowpilot.task.dto;

import lombok.Data;
import java.util.Map;

@Data
public class CompleteTaskRequest {
    private String comment;
    private Map<String, Object> variables;
}
