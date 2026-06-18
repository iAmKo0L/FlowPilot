package com.vdt.flowpilot.notification.controller;

import com.vdt.flowpilot.common.response.ApiResponse;
import com.vdt.flowpilot.notification.dto.NotificationDto;
import com.vdt.flowpilot.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping
@Tag(name = "Notifications", description = "Endpoints for viewing user and meeting notification alerts")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/api/notifications/my")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get My Notifications", description = "Retrieves all notifications sent to the currently logged in user")
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getMyNotifications() {
        List<NotificationDto> response = notificationService.getMyNotifications();
        return ResponseEntity.ok(ApiResponse.success("Thông báo của tôi đã được tải", response));
    }

    @GetMapping("/api/meetings/{id}/notifications")
    @PreAuthorize("hasAnyRole('ADMIN', 'APPROVER')")
    @Operation(summary = "Get Meeting Notifications", description = "Retrieves notifications dispatched under a specific meeting request")
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getMeetingNotifications(@PathVariable Long id) {
        List<NotificationDto> response = notificationService.getMeetingNotifications(id);
        return ResponseEntity.ok(ApiResponse.success("Thông báo của cuộc họp đã được tải", response));
    }
}
