package com.vdt.flowpilot.room.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateEquipmentRequest {
    @NotBlank(message = "Equipment code is required")
    private String equipmentCode;

    @NotBlank(message = "Equipment name is required")
    private String equipmentName;

    @NotBlank(message = "Status is required")
    private String status; // ACTIVE, INACTIVE, MAINTENANCE

    private String description;
}
