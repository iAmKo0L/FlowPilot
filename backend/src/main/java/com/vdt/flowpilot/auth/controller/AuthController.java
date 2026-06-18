package com.vdt.flowpilot.auth.controller;

import com.vdt.flowpilot.auth.dto.*;
import com.vdt.flowpilot.auth.service.AuthService;
import com.vdt.flowpilot.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Endpoints for user authentication and session management")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    @Operation(summary = "User Login", description = "Authenticates user and returns JWT token")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/register")
    @Operation(summary = "User Registration", description = "Registers a new user in the system")
    public ResponseEntity<ApiResponse<UserDto>> register(@Valid @RequestBody RegisterRequest request) {
        UserDto response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("Registration successful", response));
    }

    @GetMapping("/me")
    @Operation(summary = "Current User Info", description = "Returns details of the currently logged in user")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser() {
        UserDto response = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success("User information retrieved", response));
    }
}
