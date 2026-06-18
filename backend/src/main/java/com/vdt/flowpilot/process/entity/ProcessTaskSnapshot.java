package com.vdt.flowpilot.process.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "process_task_snapshots")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessTaskSnapshot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_request_id", nullable = false)
    private com.vdt.flowpilot.meeting.entity.MeetingRequest meetingRequest;

    @Column(name = "task_id")
    private String taskId;

    @Column(name = "task_name")
    private String taskName;

    @Column(name = "task_key")
    private String taskKey;

    private String assignee;

    @Column(name = "candidate_group")
    private String candidateGroup;

    @Column(nullable = false)
    @Builder.Default
    private String status = "CREATED"; // CREATED, CLAIMED, COMPLETED

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
