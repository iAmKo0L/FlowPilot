package com.vdt.flowpilot.notification.repository;

import com.vdt.flowpilot.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientUsernameOrderByCreatedAtDesc(String username);
    List<Notification> findByMeetingRequestIdOrderByCreatedAtDesc(Long meetingRequestId);
    boolean existsByMeetingRequestIdAndType(Long meetingRequestId, String type);
    Optional<Notification> findFirstByMeetingRequestIdAndTypeAndRecipientEmailOrderByCreatedAtDesc(Long meetingRequestId, String type, String recipientEmail);
    Optional<Notification> findFirstByMeetingRequestIdAndTypeAndRecipientUsernameOrderByCreatedAtDesc(Long meetingRequestId, String type, String recipientUsername);
}
