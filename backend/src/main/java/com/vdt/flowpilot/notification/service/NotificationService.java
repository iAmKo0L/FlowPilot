package com.vdt.flowpilot.notification.service;

import com.vdt.flowpilot.auth.dto.UserDto;
import com.vdt.flowpilot.auth.service.AuthService;
import com.vdt.flowpilot.notification.dto.NotificationDto;
import com.vdt.flowpilot.notification.entity.Notification;
import com.vdt.flowpilot.notification.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final AuthService authService;

    public NotificationService(NotificationRepository notificationRepository, AuthService authService) {
        this.notificationRepository = notificationRepository;
        this.authService = authService;
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getMyNotifications() {
        UserDto currentUser = authService.getCurrentUser();
        List<Notification> list = notificationRepository.findByRecipientUsernameOrderByCreatedAtDesc(currentUser.getUsername());
        return list.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getMeetingNotifications(Long meetingId) {
        List<Notification> list = notificationRepository.findByMeetingRequestIdOrderByCreatedAtDesc(meetingId);
        return list.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    private NotificationDto mapToDto(Notification notification) {
        return NotificationDto.builder()
                .id(notification.getId())
                .meetingRequestId(notification.getMeetingRequest() != null ? notification.getMeetingRequest().getId() : null)
                .recipientUsername(notification.getRecipientUsername())
                .recipientEmail(notification.getRecipientEmail())
                .recipientType(notification.getRecipientType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType())
                .status(notification.getStatus())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
