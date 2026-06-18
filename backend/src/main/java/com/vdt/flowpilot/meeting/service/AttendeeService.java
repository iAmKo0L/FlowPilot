package com.vdt.flowpilot.meeting.service;

import com.vdt.flowpilot.auth.dto.UserDto;
import com.vdt.flowpilot.auth.service.AuthService;
import com.vdt.flowpilot.common.exception.BusinessException;
import com.vdt.flowpilot.common.exception.ResourceNotFoundException;
import com.vdt.flowpilot.meeting.dto.AttendeeResponseDto;
import com.vdt.flowpilot.meeting.entity.MeetingAttendee;
import com.vdt.flowpilot.meeting.repository.MeetingAttendeeRepository;
import com.vdt.flowpilot.notification.entity.Notification;
import com.vdt.flowpilot.notification.repository.NotificationRepository;
import com.vdt.flowpilot.process.entity.ProcessHistory;
import com.vdt.flowpilot.process.repository.ProcessHistoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AttendeeService {

    private final MeetingAttendeeRepository attendeeRepository;
    private final ProcessHistoryRepository historyRepository;
    private final NotificationRepository notificationRepository;
    private final AuthService authService;

    public AttendeeService(MeetingAttendeeRepository attendeeRepository,
                           ProcessHistoryRepository historyRepository,
                           NotificationRepository notificationRepository,
                           AuthService authService) {
        this.attendeeRepository = attendeeRepository;
        this.historyRepository = historyRepository;
        this.notificationRepository = notificationRepository;
        this.authService = authService;
    }

    @Transactional
    public void respondAttendeeInternal(Long meetingId, Long attendeeId, AttendeeResponseDto dto) {
        UserDto currentUser = authService.getCurrentUser();
        MeetingAttendee attendee = attendeeRepository.findById(attendeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người tham dự với id: " + attendeeId));

        if (!attendee.getMeetingRequest().getId().equals(meetingId)) {
            throw new BusinessException("Người tham dự không thuộc cuộc họp này");
        }

        // Validate current user owns the email
        if (!attendee.getAttendeeEmail().equalsIgnoreCase(currentUser.getEmail())) {
            throw new BusinessException("Bạn không có quyền phản hồi lời mời họp thay cho người khác");
        }

        String oldStatus = attendee.getResponseStatus();
        attendee.setResponseStatus(dto.getResponseStatus());
        attendee.setRespondedAt(LocalDateTime.now());
        attendeeRepository.save(attendee);
        updateInvitationNotification(attendee, currentUser.getUsername(), dto.getResponseStatus());

        historyRepository.save(ProcessHistory.builder()
                .meetingRequest(attendee.getMeetingRequest())
                .action("ATTENDEE_RESPONDED")
                .actor(currentUser.getUsername())
                .comment(String.format("Người tham gia nội bộ %s (%s) phản hồi: %s",
                        attendee.getAttendeeName() != null ? attendee.getAttendeeName() : currentUser.getFullName(),
                        attendee.getAttendeeEmail(), dto.getResponseStatus()))
                .build());
    }

    @Transactional
    public void respondAttendeeGuest(String token, AttendeeResponseDto dto) {
        MeetingAttendee attendee = attendeeRepository.findByResponseToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Token phản hồi không tồn tại hoặc đã hết hạn"));

        attendee.setResponseStatus(dto.getResponseStatus());
        attendee.setRespondedAt(LocalDateTime.now());
        attendeeRepository.save(attendee);
        updateInvitationNotification(attendee, null, dto.getResponseStatus());

        historyRepository.save(ProcessHistory.builder()
                .meetingRequest(attendee.getMeetingRequest())
                .action("ATTENDEE_RESPONDED")
                .actor(attendee.getAttendeeEmail())
                .comment(String.format("Khách mời ngoài %s (%s) phản hồi: %s",
                        attendee.getAttendeeName() != null ? attendee.getAttendeeName() : "Guest",
                        attendee.getAttendeeEmail(), dto.getResponseStatus()))
                .build());
    }

    private void updateInvitationNotification(MeetingAttendee attendee, String username, String responseStatus) {
        Long meetingId = attendee.getMeetingRequest().getId();
        Notification notification = null;

        if (username != null) {
            notification = notificationRepository
                    .findFirstByMeetingRequestIdAndTypeAndRecipientUsernameOrderByCreatedAtDesc(meetingId, "INVITATION", username)
                    .orElse(null);
        }
        if (notification == null) {
            notification = notificationRepository
                    .findFirstByMeetingRequestIdAndTypeAndRecipientEmailOrderByCreatedAtDesc(meetingId, "INVITATION", attendee.getAttendeeEmail())
                    .orElse(null);
        }

        if (notification != null) {
            notification.setStatus(responseStatus);
            notificationRepository.save(notification);
        }
    }
}
