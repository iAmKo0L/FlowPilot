package com.vdt.flowpilot.bpmn.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessInstanceDto {
    private String id;
    private String definitionId;
    private boolean ended;
    private boolean suspended;
}
