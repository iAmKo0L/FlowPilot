package com.vdt.flowpilot.bpmn.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StartProcessResult {
    private String id;
    private String definitionId;
}
