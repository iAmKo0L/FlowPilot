package com.vdt.flowpilot.meeting.entity;

import com.vdt.flowpilot.room.entity.Equipment;
import com.vdt.flowpilot.room.entity.MeetingRoom;
import com.vdt.flowpilot.workflow.entity.WorkflowDefinition;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "meeting_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeetingRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_code", nullable = false, unique = true)
    private String requestCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_id", nullable = false)
    private WorkflowDefinition workflow;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = true)
    private MeetingRoom room;

    @Column(nullable = false)
    private String title;

    @Column(name = "meeting_content", nullable = false, columnDefinition = "TEXT")
    private String meetingContent;

    @Column(name = "meeting_type", nullable = false)
    private String meetingType; // ONLINE, OFFLINE, HYBRID

    @Column(name = "online_meeting_link", length = 500)
    private String onlineMeetingLink;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(nullable = false)
    private String priority; // LOW, MEDIUM, HIGH

    @Column(nullable = false)
    private String status; // DRAFT, VALIDATION_FAILED, PENDING_APPROVAL, REJECTED, CONFIRMED, CANCELLED, FAILED

    @Column(name = "hold_until")
    private LocalDateTime holdUntil;

    @Column(name = "process_instance_id")
    private String processInstanceId;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "approver_comment", columnDefinition = "TEXT")
    private String approverComment;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "meeting_request_equipment",
            joinColumns = @JoinColumn(name = "meeting_request_id"),
            inverseJoinColumns = @JoinColumn(name = "equipment_id")
    )
    @Builder.Default
    private Set<Equipment> equipments = new HashSet<>();

    @OneToMany(mappedBy = "meetingRequest", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<MeetingAttendee> attendees = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
