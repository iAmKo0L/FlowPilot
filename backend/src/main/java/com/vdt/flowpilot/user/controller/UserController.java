package com.vdt.flowpilot.user.controller;

import com.vdt.flowpilot.auth.dto.UserDto;
import com.vdt.flowpilot.auth.entity.User;
import com.vdt.flowpilot.auth.repository.UserRepository;
import com.vdt.flowpilot.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@Tag(name = "User Management & Directory", description = "Endpoints for searching users and resolving attendees")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("isAuthenticated()")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/users/search")
    @Operation(summary = "Search Users", description = "Search users by username, fullName or email")
    public ResponseEntity<ApiResponse<List<UserDto>>> searchUsers(@RequestParam(required = false, defaultValue = "") String keyword) {
        List<User> list = userRepository.searchUsers(keyword.trim());
        List<UserDto> response = list.stream().map(u -> UserDto.builder()
                .id(u.getId())
                .username(u.getUsername())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .roles(u.getRoles().stream().map(r -> r.getCode()).collect(Collectors.toList()))
                .build()
        ).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success("Tìm thấy danh sách tài khoản", response));
    }

    @PostMapping("/attendees/resolve")
    @Operation(summary = "Resolve Attendees Type", description = "Checks lists of emails and marks them as INTERNAL or GUEST")
    public ResponseEntity<ApiResponse<List<AttendeeResolveResult>>> resolveAttendees(@RequestBody List<String> emails) {
        List<AttendeeResolveResult> results = new ArrayList<>();
        for (String email : emails) {
            String cleanEmail = email.toLowerCase().trim();
            Optional<User> userOpt = userRepository.findByEmail(cleanEmail);
            if (userOpt.isPresent()) {
                User u = userOpt.get();
                results.add(AttendeeResolveResult.builder()
                        .email(cleanEmail)
                        .type("INTERNAL")
                        .userId(u.getId())
                        .name(u.getFullName())
                        .build());
            } else {
                results.add(AttendeeResolveResult.builder()
                        .email(cleanEmail)
                        .type("GUEST")
                        .build());
            }
        }
        return ResponseEntity.ok(ApiResponse.success("Phân loại người tham gia thành công", results));
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttendeeResolveResult {
        private String email;
        private String type; // INTERNAL, GUEST
        private Long userId;
        private String name;
    }
}
