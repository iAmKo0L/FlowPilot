package com.vdt.flowpilot.meeting.service;

import com.vdt.flowpilot.meeting.entity.MeetingRequest;
import com.vdt.flowpilot.meeting.repository.MeetingRequestRepository;
import com.vdt.flowpilot.notification.entity.Notification;
import com.vdt.flowpilot.notification.repository.NotificationRepository;
import com.vdt.flowpilot.process.entity.ProcessHistory;
import com.vdt.flowpilot.process.entity.ProcessTaskSnapshot;
import com.vdt.flowpilot.process.repository.ProcessHistoryRepository;
import com.vdt.flowpilot.process.repository.ProcessTaskSnapshotRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RoomHoldExpirationService {

    private final MeetingRequestRepository meetingRepository;
    private final ProcessHistoryRepository historyRepository;
    private final ProcessTaskSnapshotRepository taskSnapshotRepository;
    private final NotificationRepository notificationRepository;

    @Value("${app.meeting-hold.duration-minutes:15}")
    private long holdDurationMinutes;

    public RoomHoldExpirationService(MeetingRequestRepository meetingRepository,
                                     ProcessHistoryRepository historyRepository,
                                     ProcessTaskSnapshotRepository taskSnapshotRepository,
                                     NotificationRepository notificationRepository) {
        this.meetingRepository = meetingRepository;
        this.historyRepository = historyRepository;
        this.taskSnapshotRepository = taskSnapshotRepository;
        this.notificationRepository = notificationRepository;
    }

    @Scheduled(fixedDelayString = "${app.meeting-hold.expiration-scan-ms:60000}")
    @Transactional
    public void expireOverdueRoomHolds() {
        LocalDateTime now = LocalDateTime.now();
        List<MeetingRequest> expiredRequests = meetingRepository.findByStatusAndHoldUntilBefore("PENDING_APPROVAL", now);

        for (MeetingRequest request : expiredRequests) {
            expireRequest(request, now);
        }
    }

    private void expireRequest(MeetingRequest request, LocalDateTime now) {
        String oldStatus = request.getStatus();
        request.setStatus("REJECTED");
        request.setApproverComment("Hết thời gian tạm giữ phòng trước khi được phê duyệt");
        meetingRepository.save(request);

        List<ProcessTaskSnapshot> snapshots = taskSnapshotRepository.findByMeetingRequestId(request.getId());
        for (ProcessTaskSnapshot snapshot : snapshots) {
            if (!"COMPLETED".equals(snapshot.getStatus())) {
                snapshot.setStatus("COMPLETED");
                snapshot.setCompletedAt(now);
                taskSnapshotRepository.save(snapshot);
            }
        }

        historyRepository.save(ProcessHistory.builder()
                .meetingRequest(request)
                .action("ROOM_HOLD_EXPIRED")
                .actor("system")
                .comment("Hết thời gian tạm giữ phòng sau " + holdDurationMinutes + " phút mà chưa được phê duyệt. Yêu cầu đã bị từ chối và phòng đã được trả lại.")
                .oldStatus(oldStatus)
                .newStatus("REJECTED")
                .build());

        notificationRepository.save(Notification.builder()
                .meetingRequest(request)
                .recipientUsername(request.getCreatedBy())
                .recipientType("INTERNAL")
                .title("Yêu cầu họp đã hết hạn giữ phòng")
                .message("Yêu cầu họp " + request.getRequestCode() + " đã bị từ chối vì hết thời gian tạm giữ phòng trước khi được phê duyệt.")
                .type("REJECTED")
                .status("SENT")
                .build());
    }
}
