package com.vdt.flowpilot.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String username;
    private String fullName;
    private String email;
    private List<String> roles;
}
