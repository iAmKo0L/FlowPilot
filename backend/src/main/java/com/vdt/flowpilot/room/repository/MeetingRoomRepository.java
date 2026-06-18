package com.vdt.flowpilot.room.repository;

import com.vdt.flowpilot.room.entity.MeetingRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MeetingRoomRepository extends JpaRepository<MeetingRoom, Long> {
    Optional<MeetingRoom> findByRoomCode(String roomCode);
}
