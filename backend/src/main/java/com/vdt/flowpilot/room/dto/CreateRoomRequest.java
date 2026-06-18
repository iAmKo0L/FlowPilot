package com.vdt.flowpilot.room.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRoomRequest {
    @NotBlank(message = "Room code is required")
    private String roomCode;

    @NotBlank(message = "Room name is required")
    private String roomName;

    private String location;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    @NotBlank(message = "Status is required")
    private String status; // ACTIVE, INACTIVE, MAINTENANCE

    private String description;

    private Set<Long> equipmentIds;
}
