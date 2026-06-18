package com.vdt.flowpilot.workflow.repository;

import com.vdt.flowpilot.workflow.entity.WorkflowStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkflowStepRepository extends JpaRepository<WorkflowStep, Long> {
    List<WorkflowStep> findByWorkflowIdOrderByOrderIndexAsc(Long workflowId);
}
