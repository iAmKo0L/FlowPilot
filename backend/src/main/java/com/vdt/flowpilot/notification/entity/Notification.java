package com.vdt.flowpilot.notification.entity;

import com.vdt.flowpilot.meeting.entity.MeetingRequest;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_request_id", nullable = true)
    private MeetingRequest meetingRequest;

    @Column(name = "recipient_username", length = 100)
    private String recipientUsername;

    @Column(name = "recipient_email")
    private String recipientEmail;

    @Column(name = "recipient_type", nullable = false)
    private String recipientType; // INTERNAL, GUEST

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false)
    private String type; // APPROVAL_REQUEST, APPROVED, REJECTED, INVITATION, INFO

    @Column(nullable = false)
    private String status; // SENT, FAILED, PENDING

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
