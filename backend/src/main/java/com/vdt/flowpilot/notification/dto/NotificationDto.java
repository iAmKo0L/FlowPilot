package com.vdt.flowpilot.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private Long id;
    private Long meetingRequestId;
    private String recipientUsername;
    private String recipientEmail;
    private String recipientType;
    private String title;
    private String message;
    private String type;
    private String status;
    private LocalDateTime createdAt;
}
