package com.vdt.flowpilot.meeting.controller;

import com.vdt.flowpilot.common.response.ApiResponse;
import com.vdt.flowpilot.meeting.dto.AttendeeResponseDto;
import com.vdt.flowpilot.meeting.dto.MeetingAttendeeDto;
import com.vdt.flowpilot.meeting.service.AttendeeService;
import com.vdt.flowpilot.meeting.service.MeetingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@Tag(name = "Meeting Attendee Responses", description = "Endpoints for attendees to respond with invitation status")
public class AttendeeResponseController {

    private final AttendeeService attendeeService;
    private final MeetingService meetingService;

    public AttendeeResponseController(AttendeeService attendeeService, MeetingService meetingService) {
        this.attendeeService = attendeeService;
        this.meetingService = meetingService;
    }

    @GetMapping("/api/meetings/{id}/attendees")
    @Operation(summary = "Get Attendees List", description = "Retrieves all resolved participants and their current status for a meeting")
    public ResponseEntity<ApiResponse<List<MeetingAttendeeDto>>> getAttendees(@PathVariable Long id) {
        List<MeetingAttendeeDto> response = meetingService.getAttendees(id);
        return ResponseEntity.ok(ApiResponse.success("Attendees retrieved successfully", response));
    }

    @PostMapping("/api/meetings/{id}/attendees/{attendeeId}/response")
    @Operation(summary = "Respond internally", description = "Submit response status as authenticated internal user")
    public ResponseEntity<ApiResponse<Void>> respondInternally(@PathVariable Long id,
                                                               @PathVariable Long attendeeId,
                                                               @Valid @RequestBody AttendeeResponseDto responseDto) {
        attendeeService.respondAttendeeInternal(id, attendeeId, responseDto);
        return ResponseEntity.ok(ApiResponse.success("Phản hồi thư mời họp thành công", null));
    }

    @PostMapping("/api/public/attendee-response/{token}")
    @Operation(summary = "Respond externally (Public)", description = "Submit response status as a guest participant using email token")
    public ResponseEntity<ApiResponse<Void>> respondExternally(@PathVariable String token,
                                                               @Valid @RequestBody AttendeeResponseDto responseDto) {
        attendeeService.respondAttendeeGuest(token, responseDto);
        return ResponseEntity.ok(ApiResponse.success("Khách mời phản hồi thư mời họp thành công", null));
    }

    @GetMapping("/api/meetings/{id}/attendee-responses")
    @Operation(summary = "Get Response Counts Summary", description = "Aggregates response statuses (ACCEPTED, DECLINED, TENTATIVE, PENDING)")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getAttendeeResponsesSummary(@PathVariable Long id) {
        List<MeetingAttendeeDto> attendees = meetingService.getAttendees(id);
        Map<String, Long> summary = new HashMap<>();
        summary.put("PENDING", 0L);
        summary.put("ACCEPTED", 0L);
        summary.put("DECLINED", 0L);
        summary.put("TENTATIVE", 0L);

        for (MeetingAttendeeDto att : attendees) {
            String status = att.getResponseStatus() != null ? att.getResponseStatus().toUpperCase() : "PENDING";
            summary.put(status, summary.getOrDefault(status, 0L) + 1);
        }

        return ResponseEntity.ok(ApiResponse.success("Thống kê phản hồi thư mời họp", summary));
    }
}
