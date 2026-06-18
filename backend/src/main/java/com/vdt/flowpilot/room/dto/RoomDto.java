package com.vdt.flowpilot.room.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomDto {
    private Long id;
    private String roomCode;
    private String roomName;
    private String location;
    private Integer capacity;
    private String status;
    private String description;
    private Set<EquipmentDto> equipments;
}
