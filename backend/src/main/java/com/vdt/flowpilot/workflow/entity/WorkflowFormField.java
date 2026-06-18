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
@Table(name = "workflow_form_fields")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowFormField {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_id", nullable = false)
    @JsonIgnore
    private WorkflowDefinition workflow;

    @Column(name = "field_key", nullable = false)
    private String fieldKey;

    @Column(name = "field_label", nullable = false)
    private String fieldLabel;

    @Column(name = "field_type", nullable = false)
    private String fieldType; // TEXT, NUMBER, DATE, BOOLEAN, SELECT, TEXTAREA

    @Column(nullable = false)
    private boolean required;

    @Column(name = "options_json", columnDefinition = "TEXT")
    private String optionsJson; // For SELECT fields, holds options comma-separated or JSON list

    @Column(name = "default_value")
    private String defaultValue;

    @Column(name = "validation_json", columnDefinition = "TEXT")
    private String validationJson;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    @Column(nullable = false)
    private boolean sensitive; // Flag to indicate if field value needs encryption

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
