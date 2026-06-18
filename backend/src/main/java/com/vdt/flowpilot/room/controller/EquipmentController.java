package com.vdt.flowpilot.room.controller;

import com.vdt.flowpilot.common.response.ApiResponse;
import com.vdt.flowpilot.room.dto.CreateEquipmentRequest;
import com.vdt.flowpilot.room.dto.EquipmentDto;
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
@Tag(name = "Equipment", description = "Endpoints for viewing and managing meeting equipment")
@SecurityRequirement(name = "bearerAuth")
public class EquipmentController {

    private final RoomService roomService;

    public EquipmentController(RoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping("/api/equipment")
    @PreAuthorize("hasAnyRole('REQUESTER', 'ADMIN', 'APPROVER')")
    @Operation(summary = "Get All Equipment", description = "Retrieves all equipment in the system")
    public ResponseEntity<ApiResponse<List<EquipmentDto>>> getAllEquipment() {
        List<EquipmentDto> response = roomService.getAllEquipment();
        return ResponseEntity.ok(ApiResponse.success("Đã tải danh sách thiết bị", response));
    }

    @GetMapping("/api/equipment/{id}")
    @PreAuthorize("hasAnyRole('REQUESTER', 'ADMIN', 'APPROVER')")
    @Operation(summary = "Get Equipment Detail", description = "Retrieves details of specific equipment by ID")
    public ResponseEntity<ApiResponse<EquipmentDto>> getEquipmentById(@PathVariable Long id) {
        EquipmentDto response = roomService.getEquipmentById(id);
        return ResponseEntity.ok(ApiResponse.success("Đã tải chi tiết thiết bị", response));
    }

    @PostMapping("/api/admin/equipment")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create Equipment", description = "Creates a new equipment item")
    public ResponseEntity<ApiResponse<EquipmentDto>> createEquipment(@Valid @RequestBody CreateEquipmentRequest request) {
        EquipmentDto response = roomService.createEquipment(request);
        return ResponseEntity.ok(ApiResponse.success("Đã tạo thiết bị", response));
    }

    @PutMapping("/api/admin/equipment/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update Equipment", description = "Updates an existing equipment item")
    public ResponseEntity<ApiResponse<EquipmentDto>> updateEquipment(@PathVariable Long id, @Valid @RequestBody CreateEquipmentRequest request) {
        EquipmentDto response = roomService.updateEquipment(id, request);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật thiết bị", response));
    }

    @DeleteMapping("/api/admin/equipment/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete Equipment", description = "Deletes an equipment item")
    public ResponseEntity<ApiResponse<Void>> deleteEquipment(@PathVariable Long id) {
        roomService.deleteEquipment(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa thiết bị", null));
    }
}
