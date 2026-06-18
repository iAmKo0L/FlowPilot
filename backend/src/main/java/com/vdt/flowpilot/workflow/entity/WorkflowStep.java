package com.vdt.flowpilot.workflow.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "workflow_steps")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowStep {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_id", nullable = false)
    @JsonIgnore
    private WorkflowDefinition workflow;

    @Column(name = "step_key", nullable = false)
    private String stepKey;

    @Column(name = "step_name", nullable = false)
    private String stepName;

    @Column(name = "step_type", nullable = false)
    private String stepType; // START, USER_TASK, CONDITION, APPROVE, END

    @Column(name = "assignee_role")
    private String assigneeRole;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    @Column(name = "config_json", columnDefinition = "TEXT")
    private String configJson; // JSON configuration (e.g. conditional criteria)

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
