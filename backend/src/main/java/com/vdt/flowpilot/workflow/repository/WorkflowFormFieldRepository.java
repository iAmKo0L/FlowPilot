package com.vdt.flowpilot.workflow.repository;

import com.vdt.flowpilot.workflow.entity.WorkflowFormField;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkflowFormFieldRepository extends JpaRepository<WorkflowFormField, Long> {
    List<WorkflowFormField> findByWorkflowIdOrderByOrderIndexAsc(Long workflowId);
}
