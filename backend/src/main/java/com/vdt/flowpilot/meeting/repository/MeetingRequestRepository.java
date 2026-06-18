package com.vdt.flowpilot.meeting.repository;

import com.vdt.flowpilot.meeting.entity.MeetingRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MeetingRequestRepository extends JpaRepository<MeetingRequest, Long> {
    Optional<MeetingRequest> findByProcessInstanceId(String processInstanceId);
    Optional<MeetingRequest> findByRequestCode(String requestCode);
    List<MeetingRequest> findByCreatedByOrderByCreatedAtDesc(String username);
    List<MeetingRequest> findByStatusAndHoldUntilBefore(String status, LocalDateTime cutoff);
    long countByStatus(String status);

    @Query("SELECT mr FROM MeetingRequest mr WHERE mr.room.id = :roomId " +
           "AND (mr.status = 'CONFIRMED' OR (mr.status = 'PENDING_APPROVAL' AND mr.holdUntil IS NOT NULL AND mr.holdUntil > :now)) " +
           "AND mr.startTime < :endTime AND mr.endTime > :startTime " +
           "AND (:excludeId IS NULL OR mr.id != :excludeId)")
    List<MeetingRequest> findConflictingRequests(
            @Param("roomId") Long roomId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("excludeId") Long excludeId,
            @Param("now") LocalDateTime now
    );
}
