package com.vdt.flowpilot.process.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "process_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_request_id", nullable = false)
    private com.vdt.flowpilot.meeting.entity.MeetingRequest meetingRequest;

    @Column(nullable = false)
    private String action; // e.g. CREATED, VALIDATED, ROOM_HELD, etc.

    @Column(nullable = false)
    private String actor;

    @Column(name = "task_name")
    private String taskName;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "old_status")
    private String oldStatus;

    @Column(name = "new_status")
    private String newStatus;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
