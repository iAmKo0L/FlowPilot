package com.vdt.flowpilot.room.service;

import com.vdt.flowpilot.common.exception.BusinessException;
import com.vdt.flowpilot.common.exception.ResourceNotFoundException;
import com.vdt.flowpilot.room.dto.*;
import com.vdt.flowpilot.room.entity.Equipment;
import com.vdt.flowpilot.room.entity.MeetingRoom;
import com.vdt.flowpilot.room.repository.EquipmentRepository;
import com.vdt.flowpilot.room.repository.MeetingRoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RoomService {

    private final MeetingRoomRepository roomRepository;
    private final EquipmentRepository equipmentRepository;

    public RoomService(MeetingRoomRepository roomRepository, EquipmentRepository equipmentRepository) {
        this.roomRepository = roomRepository;
        this.equipmentRepository = equipmentRepository;
    }

    // =========================================================================
    // MEETING ROOM SERVICES
    // =========================================================================

    @Transactional(readOnly = true)
    public List<RoomDto> getAllRooms() {
        return roomRepository.findAll().stream()
                .map(this::mapToRoomDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RoomDto getRoomById(Long id) {
        MeetingRoom room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng họp với id " + id));
        return mapToRoomDto(room);
    }

    @Transactional
    public RoomDto createRoom(CreateRoomRequest request) {
        if (roomRepository.findByRoomCode(request.getRoomCode()).isPresent()) {
            throw new BusinessException("Mã phòng đã tồn tại: " + request.getRoomCode());
        }

        Set<Equipment> equipments = new HashSet<>();
        if (request.getEquipmentIds() != null) {
            for (Long eqId : request.getEquipmentIds()) {
                Equipment eq = equipmentRepository.findById(eqId)
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thiết bị với id " + eqId));
                equipments.add(eq);
            }
        }

        MeetingRoom room = MeetingRoom.builder()
                .roomCode(request.getRoomCode())
                .roomName(request.getRoomName())
                .location(request.getLocation())
                .capacity(request.getCapacity())
                .status(request.getStatus())
                .description(request.getDescription())
                .equipments(equipments)
                .build();

        room = roomRepository.save(room);
        return mapToRoomDto(room);
    }

    @Transactional
    public RoomDto updateRoom(Long id, CreateRoomRequest request) {
        MeetingRoom room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng họp với id " + id));

        roomRepository.findByRoomCode(request.getRoomCode()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new BusinessException("Mã phòng đã tồn tại: " + request.getRoomCode());
            }
        });

        Set<Equipment> equipments = new HashSet<>();
        if (request.getEquipmentIds() != null) {
            for (Long eqId : request.getEquipmentIds()) {
                Equipment eq = equipmentRepository.findById(eqId)
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thiết bị với id " + eqId));
                equipments.add(eq);
            }
        }

        room.setRoomCode(request.getRoomCode());
        room.setRoomName(request.getRoomName());
        room.setLocation(request.getLocation());
        room.setCapacity(request.getCapacity());
        room.setStatus(request.getStatus());
        room.setDescription(request.getDescription());
        room.setEquipments(equipments);

        room = roomRepository.save(room);
        return mapToRoomDto(room);
    }

    @Transactional
    public void deleteRoom(Long id) {
        if (!roomRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy phòng họp với id " + id);
        }
        roomRepository.deleteById(id);
    }

    // =========================================================================
    // EQUIPMENT SERVICES
    // =========================================================================

    @Transactional(readOnly = true)
    public List<EquipmentDto> getAllEquipment() {
        return equipmentRepository.findAll().stream()
                .map(this::mapToEquipmentDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EquipmentDto getEquipmentById(Long id) {
        Equipment eq = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thiết bị với id " + id));
        return mapToEquipmentDto(eq);
    }

    @Transactional
    public EquipmentDto createEquipment(CreateEquipmentRequest request) {
        if (equipmentRepository.findByEquipmentCode(request.getEquipmentCode()).isPresent()) {
            throw new BusinessException("Mã thiết bị đã tồn tại: " + request.getEquipmentCode());
        }

        Equipment eq = Equipment.builder()
                .equipmentCode(request.getEquipmentCode())
                .equipmentName(request.getEquipmentName())
                .status(request.getStatus())
                .description(request.getDescription())
                .build();

        eq = equipmentRepository.save(eq);
        return mapToEquipmentDto(eq);
    }

    @Transactional
    public EquipmentDto updateEquipment(Long id, CreateEquipmentRequest request) {
        Equipment eq = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thiết bị với id " + id));

        equipmentRepository.findByEquipmentCode(request.getEquipmentCode()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new BusinessException("Mã thiết bị đã tồn tại: " + request.getEquipmentCode());
            }
        });

        eq.setEquipmentCode(request.getEquipmentCode());
        eq.setEquipmentName(request.getEquipmentName());
        eq.setStatus(request.getStatus());
        eq.setDescription(request.getDescription());

        eq = equipmentRepository.save(eq);
        return mapToEquipmentDto(eq);
    }

    @Transactional
    public void deleteEquipment(Long id) {
        if (!equipmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy thiết bị với id " + id);
        }
        equipmentRepository.deleteById(id);
    }

    // =========================================================================
    // MAPPING HELPERS
    // =========================================================================

    private RoomDto mapToRoomDto(MeetingRoom room) {
        Set<EquipmentDto> eqDtos = room.getEquipments().stream()
                .map(this::mapToEquipmentDto)
                .collect(Collectors.toSet());

        return RoomDto.builder()
                .id(room.getId())
                .roomCode(room.getRoomCode())
                .roomName(room.getRoomName())
                .location(room.getLocation())
                .capacity(room.getCapacity())
                .status(room.getStatus())
                .description(room.getDescription())
                .equipments(eqDtos)
                .build();
    }

    private EquipmentDto mapToEquipmentDto(Equipment eq) {
        return EquipmentDto.builder()
                .id(eq.getId())
                .equipmentCode(eq.getEquipmentCode())
                .equipmentName(eq.getEquipmentName())
                .status(eq.getStatus())
                .description(eq.getDescription())
                .build();
    }
}
