package com.vdt.flowpilot.room.controller;

import com.vdt.flowpilot.common.response.ApiResponse;
import com.vdt.flowpilot.room.dto.CreateRoomRequest;
import com.vdt.flowpilot.room.dto.RoomDto;
import com.vdt.flowpilot.room.service.RoomService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping
@Tag(name = "Rooms", description = "Endpoints for viewing and managing meeting rooms")
@SecurityRequirement(name = "bearerAuth")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping("/api/rooms")
    @PreAuthorize("hasAnyRole('REQUESTER', 'ADMIN', 'APPROVER')")
    @Operation(summary = "Get All Rooms", description = "Retrieves all meeting rooms in the system")
    public ResponseEntity<ApiResponse<List<RoomDto>>> getAllRooms() {
        List<RoomDto> response = roomService.getAllRooms();
        return ResponseEntity.ok(ApiResponse.success("Đã tải danh sách phòng họp", response));
    }

    @GetMapping("/api/rooms/{id}")
    @PreAuthorize("hasAnyRole('REQUESTER', 'ADMIN', 'APPROVER')")
    @Operation(summary = "Get Room Detail", description = "Retrieves details of a specific room by ID")
    public ResponseEntity<ApiResponse<RoomDto>> getRoomById(@PathVariable Long id) {
        RoomDto response = roomService.getRoomById(id);
        return ResponseEntity.ok(ApiResponse.success("Đã tải chi tiết phòng họp", response));
    }

    @PostMapping("/api/admin/rooms")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create Room", description = "Creates a new meeting room")
    public ResponseEntity<ApiResponse<RoomDto>> createRoom(@Valid @RequestBody CreateRoomRequest request) {
        RoomDto response = roomService.createRoom(request);
        return ResponseEntity.ok(ApiResponse.success("Đã tạo phòng họp", response));
    }

    @PutMapping("/api/admin/rooms/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update Room", description = "Updates an existing meeting room")
    public ResponseEntity<ApiResponse<RoomDto>> updateRoom(@PathVariable Long id, @Valid @RequestBody CreateRoomRequest request) {
        RoomDto response = roomService.updateRoom(id, request);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật phòng họp", response));
    }

    @DeleteMapping("/api/admin/rooms/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete Room", description = "Deletes a meeting room")
    public ResponseEntity<ApiResponse<Void>> deleteRoom(@PathVariable Long id) {
        roomService.deleteRoom(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa phòng họp", null));
    }
}
