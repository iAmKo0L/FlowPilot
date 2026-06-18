package com.vdt.flowpilot.meeting.dto;

import com.vdt.flowpilot.room.dto.EquipmentDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeetingRequestDto {
    private Long id;
    private String requestCode;
    private Long workflowId;
    private String workflowName;
    private Long roomId;
    private String roomName;
    private String roomCode;
    private String title;
    private String meetingContent;
    private String meetingType; // ONLINE, OFFLINE, HYBRID
    private String onlineMeetingLink;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String priority; // LOW, MEDIUM, HIGH
    private String status; // DRAFT, VALIDATION_FAILED, etc.
    private LocalDateTime holdUntil;
    private String processInstanceId;
    private String createdBy;
    private String approvedBy;
    private String approverComment;
    private Set<EquipmentDto> equipments;
    private List<MeetingAttendeeDto> attendees;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
