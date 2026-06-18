package com.vdt.flowpilot.meeting.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateMeetingRequestDto {
    private Long workflowId;

    @NotBlank(message = "Vui lòng nhập tiêu đề cuộc họp")
    private String title;

    @NotBlank(message = "Vui lòng nhập nội dung cuộc họp")
    private String meetingContent;

    @NotBlank(message = "Vui lòng chọn hình thức họp")
    private String meetingType; // ONLINE, OFFLINE, HYBRID

    private String onlineMeetingLink;

    @NotNull(message = "Vui lòng chọn thời gian bắt đầu")
    private LocalDateTime startTime;

    @NotNull(message = "Vui lòng chọn thời gian kết thúc")
    private LocalDateTime endTime;

    private Long roomId;

    private Set<Long> equipmentIds;

    @NotBlank(message = "Vui lòng chọn mức ưu tiên")
    private String priority; // LOW, MEDIUM, HIGH

    @NotEmpty(message = "Vui lòng thêm ít nhất một người tham gia")
    @Valid
    private List<AttendeeInput> attendees;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttendeeInput {
        @NotBlank(message = "Vui lòng nhập email người tham gia")
        private String email;
        private String name;
    }
}
