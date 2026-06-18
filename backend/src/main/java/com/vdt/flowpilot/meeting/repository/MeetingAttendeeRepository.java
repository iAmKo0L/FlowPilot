package com.vdt.flowpilot.meeting.repository;

import com.vdt.flowpilot.meeting.entity.MeetingAttendee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MeetingAttendeeRepository extends JpaRepository<MeetingAttendee, Long> {
    Optional<MeetingAttendee> findByResponseToken(String responseToken);
    Optional<MeetingAttendee> findByMeetingRequestIdAndAttendeeEmail(Long meetingRequestId, String email);
    List<MeetingAttendee> findByMeetingRequestId(Long meetingRequestId);
}
