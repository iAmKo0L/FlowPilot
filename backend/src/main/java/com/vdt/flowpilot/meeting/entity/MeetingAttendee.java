package com.vdt.flowpilot.meeting.entity;

import com.vdt.flowpilot.auth.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "meeting_attendees",
        uniqueConstraints = @UniqueConstraint(columnNames = {"meeting_request_id", "attendee_email"})
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeetingAttendee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_request_id", nullable = false)
    private MeetingRequest meetingRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    private User user;

    @Column(name = "attendee_name")
    private String attendeeName;

    @Column(name = "attendee_email", nullable = false)
    private String attendeeEmail;

    @Column(name = "attendee_type", nullable = false)
    private String attendeeType; // INTERNAL, GUEST

    @Column(name = "response_status", nullable = false)
    private String responseStatus; // PENDING, ACCEPTED, DECLINED, TENTATIVE

    @Column(name = "response_token")
    private String responseToken;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
