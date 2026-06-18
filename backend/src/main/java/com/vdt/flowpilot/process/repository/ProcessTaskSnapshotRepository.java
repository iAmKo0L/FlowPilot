package com.vdt.flowpilot.process.repository;

import com.vdt.flowpilot.process.entity.ProcessTaskSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProcessTaskSnapshotRepository extends JpaRepository<ProcessTaskSnapshot, Long> {
    List<ProcessTaskSnapshot> findByMeetingRequestId(Long meetingRequestId);
    Optional<ProcessTaskSnapshot> findByTaskId(String taskId);
    Optional<ProcessTaskSnapshot> findByMeetingRequestIdAndStatus(Long meetingRequestId, String status);
}
