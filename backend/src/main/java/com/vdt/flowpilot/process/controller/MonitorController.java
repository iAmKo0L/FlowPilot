package com.vdt.flowpilot.process.controller;

import com.vdt.flowpilot.common.response.ApiResponse;
import com.vdt.flowpilot.meeting.dto.MeetingRequestDto;
import com.vdt.flowpilot.meeting.service.MeetingService;
import com.vdt.flowpilot.process.dto.DashboardStatsDto;
import com.vdt.flowpilot.process.dto.ProcessHistoryDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/monitor")
@Tag(name = "Admin Monitor Console", description = "Endpoints for administrators to track and monitor meeting requests")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class MonitorController {

    private final MeetingService meetingService;

    public MonitorController(MeetingService meetingService) {
        this.meetingService = meetingService;
    }

    @GetMapping("/meetings")
    @Operation(summary = "Monitor All Meetings", description = "Retrieves all meeting requests in the system with full statuses")
    public ResponseEntity<ApiResponse<List<MeetingRequestDto>>> getAllMeetings() {
        List<MeetingRequestDto> response = meetingService.getAllMeetingsForMonitor();
        return ResponseEntity.ok(ApiResponse.success("Tải danh sách giám sát các cuộc họp thành công", response));
    }

    @GetMapping("/meetings/{id}/history")
    @Operation(summary = "Get Meeting Process History", description = "Retrieves audit log timeline for a specific meeting schedule")
    public ResponseEntity<ApiResponse<List<ProcessHistoryDto>>> getMeetingHistory(@PathVariable Long id) {
        List<ProcessHistoryDto> response = meetingService.getMeetingHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Tải lịch sử giám sát cuộc họp thành công", response));
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Monitor Dashboard Stats", description = "Aggregates meeting counts grouped by scheduling state")
    public ResponseEntity<ApiResponse<DashboardStatsDto>> getDashboardStats() {
        DashboardStatsDto response = meetingService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success("Tải số liệu thống kê dashboard thành công", response));
    }
}
