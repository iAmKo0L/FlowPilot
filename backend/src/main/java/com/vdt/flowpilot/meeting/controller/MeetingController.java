package com.vdt.flowpilot.meeting.controller;

import com.vdt.flowpilot.common.response.ApiResponse;
import com.vdt.flowpilot.meeting.dto.CreateMeetingRequestDto;
import com.vdt.flowpilot.meeting.dto.MeetingRequestDto;
import com.vdt.flowpilot.meeting.service.MeetingService;
import com.vdt.flowpilot.process.dto.ProcessHistoryDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meetings")
@PreAuthorize("hasAnyRole('REQUESTER', 'ADMIN', 'APPROVER')")
@Tag(name = "Meeting Scheduling Flow", description = "Endpoints for submitting and managing meeting room schedules")
@SecurityRequirement(name = "bearerAuth")
public class MeetingController {

    private final MeetingService meetingService;

    public MeetingController(MeetingService meetingService) {
        this.meetingService = meetingService;
    }

    @PostMapping
    @Operation(summary = "Submit Meeting Draft", description = "Creates a new meeting request in DRAFT status and validates constraints")
    public ResponseEntity<ApiResponse<MeetingRequestDto>> createMeeting(@Valid @RequestBody CreateMeetingRequestDto requestDto) {
        MeetingRequestDto response = meetingService.createMeeting(requestDto);
        return ResponseEntity.ok(ApiResponse.success("Yêu cầu tạo lịch họp đã được lưu nháp thành công", response));
    }

    @GetMapping("/my")
    @Operation(summary = "My Meeting Requests", description = "Retrieves all meeting requests submitted by the logged-in user")
    public ResponseEntity<ApiResponse<List<MeetingRequestDto>>> getMyMeetings() {
        List<MeetingRequestDto> response = meetingService.getMyMeetings();
        return ResponseEntity.ok(ApiResponse.success("Danh sách cuộc họp của tôi đã được tải", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Meeting Detail", description = "Retrieves the full details of a specific meeting request by ID")
    public ResponseEntity<ApiResponse<MeetingRequestDto>> getMeetingById(@PathVariable Long id) {
        MeetingRequestDto response = meetingService.getMeetingById(id);
        return ResponseEntity.ok(ApiResponse.success("Chi tiết cuộc họp đã được tải thành công", response));
    }

    @PostMapping("/{id}/start")
    @Operation(summary = "Start Approval Process", description = "Initiates the room hold and BPMN process instance for approval")
    public ResponseEntity<ApiResponse<MeetingRequestDto>> startProcess(@PathVariable Long id) {
        MeetingRequestDto response = meetingService.startProcess(id);
        return ResponseEntity.ok(ApiResponse.success("Quy trình phê duyệt lịch họp đã được khởi chạy thành công", response));
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Get Meeting History Timeline", description = "Gets the step-by-step history log for a meeting request")
    public ResponseEntity<ApiResponse<List<ProcessHistoryDto>>> getMeetingHistory(@PathVariable Long id) {
        List<ProcessHistoryDto> response = meetingService.getMeetingHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Lịch sử xử lý yêu cầu họp đã được tải", response));
    }
}
