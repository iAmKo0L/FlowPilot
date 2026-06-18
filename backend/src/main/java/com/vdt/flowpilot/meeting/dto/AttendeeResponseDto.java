package com.vdt.flowpilot.meeting.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendeeResponseDto {
    @NotBlank(message = "Response status is required")
    private String responseStatus; // ACCEPTED, DECLINED, TENTATIVE
}
