package com.vdt.flowpilot.meeting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeetingAttendeeDto {
    private Long id;
    private Long userId;
    private String attendeeName;
    private String attendeeEmail;
    private String attendeeType; // INTERNAL, GUEST
    private String responseStatus; // PENDING, ACCEPTED, DECLINED, TENTATIVE
    private String responseToken;
    private LocalDateTime respondedAt;
}
