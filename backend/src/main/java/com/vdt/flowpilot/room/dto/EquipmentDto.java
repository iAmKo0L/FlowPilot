package com.vdt.flowpilot.room.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentDto {
    private Long id;
    private String equipmentCode;
    private String equipmentName;
    private String status;
    private String description;
}
