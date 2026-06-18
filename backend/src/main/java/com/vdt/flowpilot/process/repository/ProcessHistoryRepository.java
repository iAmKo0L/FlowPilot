package com.vdt.flowpilot.process.repository;

import com.vdt.flowpilot.process.entity.ProcessHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProcessHistoryRepository extends JpaRepository<ProcessHistory, Long> {
    List<ProcessHistory> findByMeetingRequestIdOrderByCreatedAtAsc(Long meetingRequestId);
}
