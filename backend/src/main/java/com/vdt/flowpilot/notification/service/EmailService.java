package com.vdt.flowpilot.notification.service;

import com.vdt.flowpilot.meeting.entity.MeetingAttendee;
import com.vdt.flowpilot.meeting.entity.MeetingRequest;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}")
    private boolean enabled;

    @Value("${app.mail.from:no-reply@flowpilot.local}")
    private String fromAddress;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public boolean sendGuestInvitation(MeetingRequest request, MeetingAttendee attendee) {
        if (!enabled) {
            log.debug("Email sending is disabled. Skipping guest invitation for {}", attendee.getAttendeeEmail());
            return false;
        }
        if (attendee.getResponseToken() == null || attendee.getResponseToken().isBlank()) {
            log.warn("Guest attendee {} has no response token. Email not sent.", attendee.getAttendeeEmail());
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name()
            );
            helper.setFrom(fromAddress);
            helper.setTo(attendee.getAttendeeEmail());
            helper.setSubject("Lời mời họp: " + request.getTitle());
            helper.setText(buildInvitationHtml(request, attendee), true);
            mailSender.send(message);
            return true;
        } catch (MessagingException | MailException ex) {
            log.error("Could not send guest invitation email to {}", attendee.getAttendeeEmail(), ex);
            return false;
        }
    }

    private String buildInvitationHtml(MeetingRequest request, MeetingAttendee attendee) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");
        String time = request.getStartTime().format(formatter) + " - " + request.getEndTime().format(formatter);
        String room = request.getRoom() != null ? request.getRoom().getRoomName() : "Họp trực tuyến";
        String requester = request.getCreatedBy() != null ? request.getCreatedBy() : "FlowPilot";

        String acceptUrl = buildResponseUrl(attendee.getResponseToken(), "ACCEPTED");
        String tentativeUrl = buildResponseUrl(attendee.getResponseToken(), "TENTATIVE");
        String declineUrl = buildResponseUrl(attendee.getResponseToken(), "DECLINED");

        return """
                <!doctype html>
                <html lang="vi">
                <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#172033">
                  <div style="max-width:640px;margin:0 auto;padding:24px">
                    <div style="background:#ffffff;border:1px solid #e5eaf2;border-radius:12px;padding:24px">
                      <h2 style="margin:0 0 12px;color:#1f3bff">Lời mời họp FlowPilot</h2>
                      <p>Xin chào %s,</p>
                      <p>Bạn được mời tham gia cuộc họp sau:</p>
                      <table style="width:100%%;border-collapse:collapse;margin:16px 0">
                        <tr><td style="padding:8px 0;font-weight:bold;width:140px">Tiêu đề</td><td>%s</td></tr>
                        <tr><td style="padding:8px 0;font-weight:bold">Thời gian</td><td>%s</td></tr>
                        <tr><td style="padding:8px 0;font-weight:bold">Phòng/địa điểm</td><td>%s</td></tr>
                        <tr><td style="padding:8px 0;font-weight:bold">Người tạo</td><td>%s</td></tr>
                        <tr><td style="padding:8px 0;font-weight:bold">Nội dung</td><td>%s</td></tr>
                      </table>
                      <p>Vui lòng chọn phản hồi của bạn:</p>
                      <p style="margin:24px 0">
                        <a href="%s" style="display:inline-block;margin:4px 8px 4px 0;padding:12px 16px;background:#059669;color:white;text-decoration:none;border-radius:8px;font-weight:bold">Đồng ý</a>
                        <a href="%s" style="display:inline-block;margin:4px 8px 4px 0;padding:12px 16px;background:#d97706;color:white;text-decoration:none;border-radius:8px;font-weight:bold">Có thể</a>
                        <a href="%s" style="display:inline-block;margin:4px 8px 4px 0;padding:12px 16px;background:#dc2626;color:white;text-decoration:none;border-radius:8px;font-weight:bold">Từ chối</a>
                      </p>
                      <p style="font-size:12px;color:#64748b">Nếu nút không hoạt động, hãy copy một trong các đường link trên và mở bằng trình duyệt.</p>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(
                escape(attendee.getAttendeeName() != null ? attendee.getAttendeeName() : attendee.getAttendeeEmail()),
                escape(request.getTitle()),
                escape(time),
                escape(room),
                escape(requester),
                escape(request.getMeetingContent() != null ? request.getMeetingContent() : "-"),
                acceptUrl,
                tentativeUrl,
                declineUrl
        );
    }

    private String buildResponseUrl(String token, String status) {
        return UriComponentsBuilder
                .fromHttpUrl(frontendUrl)
                .path("/public/attendee-response/{token}")
                .queryParam("status", status)
                .buildAndExpand(token)
                .toUriString();
    }

    private String escape(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
