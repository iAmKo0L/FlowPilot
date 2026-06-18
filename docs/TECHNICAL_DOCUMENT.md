# Tài Liệu Kỹ Thuật FlowPilot

## 1. Tổng Quan Kiến Trúc

FlowPilot gồm bốn khối chính:

```text
React/Vite Frontend
        |
        | HTTP JSON + JWT
        v
Spring Boot Backend  ---- HTTP REST ---- Camunda/CIB Seven Engine
        |
        | JPA/Hibernate
        v
PostgreSQL
```

- Frontend: React, TypeScript, Vite, giao diện theo role `ADMIN`, `REQUESTER`, `APPROVER`.
- Backend: Spring Boot 3, Java 17, Spring Security JWT, Spring Data JPA.
- BPMN engine: Camunda 7 compatible image, dùng REST API `/engine-rest`.
- Database: PostgreSQL lưu dữ liệu nghiệp vụ; Camunda tự lưu runtime/process metadata trong engine container.

## 2. Cấu Trúc Backend

Backend đang tổ chức theo domain. Đây là hướng dễ hiểu hơn so với gom theo layer lớn vì mỗi nghiệp vụ có controller/service/dto/entity riêng.

```text
backend/src/main/java/com/vdt/flowpilot
├── auth          # đăng nhập, JWT, role, security
├── bpmn          # adapter REST tới engine và generator BPMN XML
├── common        # cấu hình chung, seed data, response wrapper
├── crypto        # mã hóa dữ liệu nhạy cảm
├── meeting       # yêu cầu họp, attendee, giữ phòng, hết hạn giữ phòng
├── notification  # thông báo cá nhân và nhật ký gửi thông báo
├── process       # monitor, process history, task snapshot
├── room          # phòng họp, thiết bị, endpoint public/admin
├── task          # task phê duyệt từ BPMN engine
├── user          # tìm user nội bộ, resolve attendee
└── workflow      # cấu hình workflow động, step, form field, deploy
```

Hai controller admin cũ của phòng và thiết bị đã được gộp vào controller domain:

- `RoomController`: giữ cả `/api/rooms/**` và `/api/admin/rooms/**`.
- `EquipmentController`: giữ cả `/api/equipment/**` và `/api/admin/equipment/**`.

URL API không đổi, chỉ giảm file trùng trách nhiệm.

## 3. Luồng Nghiệp Vụ Chính

1. Admin tạo hoặc chỉnh workflow gồm các step `START`, `SERVICE_TASK`, `USER_TASK`, `APPROVE`, `CONDITION`, `END`.
2. Backend sinh BPMN XML bằng `BpmnXmlGenerator`.
3. Admin preview XML và deploy workflow lên Camunda qua `CibSevenAdapter`.
4. Requester tạo yêu cầu lịch họp, chọn phòng, thiết bị, attendee và workflow đã deploy.
5. Backend kiểm tra:
   - thời gian hợp lệ;
   - phòng tồn tại và đang active;
   - số attendee không vượt quá sức chứa phòng;
   - phòng không trùng lịch với request `CONFIRMED` hoặc request `PENDING_APPROVAL` còn thời hạn giữ.
6. Requester start process. Backend tạo process instance, lưu `processInstanceId`, chuyển trạng thái sang `PENDING_APPROVAL`, đặt `holdUntil`.
7. Approver/Admin nhận task, claim task và approve/reject.
8. Backend hoàn thành task trên engine, cập nhật meeting, ghi `ProcessHistory`, gửi notification.
9. Internal attendee phản hồi qua notification. Guest attendee phản hồi bằng token public.
10. Admin theo dõi trạng thái trong monitor dashboard và Camunda Cockpit.

## 4. Workflow Động Và BPMN Generator

Workflow được lưu trong database qua các bảng:

- `workflow_definitions`: thông tin workflow, process key, trạng thái deploy.
- `workflow_steps`: danh sách bước xử lý và thứ tự.
- `workflow_form_fields`: field động cho form tạo yêu cầu.

`BpmnXmlGenerator` sinh BPMN theo cấu hình step:

- `START` -> `bpmn:startEvent`.
- `SERVICE_TASK` -> `bpmn:serviceTask`.
- `USER_TASK`/`APPROVE` -> `bpmn:userTask` với `camunda:candidateGroups`.
- `CONDITION` -> `bpmn:exclusiveGateway` và sequence flow rẽ nhánh.
- `END` -> `bpmn:endEvent`.

Với step `CONDITION`, `configJson` cần chỉ rõ biến và target:

```json
{
  "variable": "approved",
  "trueTarget": "confirm_meeting",
  "falseTarget": "cancel_hold"
}
```

Generator cũng sinh BPMNDI shape/edge để Camunda Cockpit hiển thị mũi tên và nhánh điều kiện dễ nhìn.

Lưu ý: workflow động quyết định cấu trúc BPMN. Logic nghiệp vụ thực tế như kiểm tra phòng, giữ phòng, approve/reject, gửi thông báo vẫn nằm trong backend. Nếu muốn thêm một bước service task có nghiệp vụ hoàn toàn mới, cần bổ sung code backend hoặc delegate/adapter tương ứng.

## 5. Giữ Phòng Và Tự Hủy Khi Hết Hạn

Thời gian giữ phòng được cấu hình bằng:

- `app.meeting-hold.duration-minutes`, mặc định 15 phút.
- `app.meeting-hold.expiration-scan-ms`, mặc định 60000 ms.

Khi process được start:

- meeting chuyển sang `PENDING_APPROVAL`;
- `holdUntil` được set;
- phòng bị tính là bận trong các lần kiểm tra trùng lịch.

`RoomHoldExpirationService` chạy định kỳ. Nếu request còn `PENDING_APPROVAL` và `holdUntil` đã qua:

- chuyển meeting sang `REJECTED`;
- xóa `holdUntil`;
- ghi lịch sử `ROOM_HOLD_EXPIRED`;
- gửi notification cho requester.

## 6. Email Mời Họp Cho Guest

Khi meeting được approve, backend tạo notification cho requester và từng attendee. Với attendee `GUEST`, hệ thống có thể gửi email thật nếu `APP_MAIL_ENABLED=true`.

Thành phần liên quan:

- `EmailService`: dựng email HTML và gửi qua `JavaMailSender`.
- `MeetingService.sendMeetingConfirmedNotifications`: sau khi tạo notification guest, gọi `EmailService.sendGuestInvitation`.
- `PublicAttendeeResponsePage`: nhận token public và query `status`; nếu status hợp lệ thì tự ghi nhận phản hồi.

Email guest có 3 link tương ứng:

- `ACCEPTED`: đồng ý tham gia.
- `TENTATIVE`: có thể tham gia.
- `DECLINED`: từ chối tham gia.

Ví dụ link:

```text
https://flowpilot.company.com/public/attendee-response/{token}?status=ACCEPTED
```

`APP_FRONTEND_URL` phải là URL mà guest truy cập được. Nếu để `http://localhost:3000`, link chỉ dùng được trên máy đang chạy frontend local.

SMTP có thể dùng:

- Gmail/Google Workspace: cần App Password hoặc SMTP relay.
- Microsoft 365: cần SMTP AUTH hoặc relay được quản trị viên cho phép.
- SendGrid/Mailgun/Amazon SES: phù hợp môi trường production.
- SMTP nội bộ công ty: phù hợp nếu công ty đã có mail gateway.

Nếu gửi mail thất bại hoặc chưa bật mail, meeting vẫn không bị fail. Notification guest được lưu với status `EMAIL_NOT_SENT`; nếu gửi thành công là `EMAIL_SENT`.

## 7. Trạng Thái Chính

Meeting request:

- `DRAFT`: mới tạo, chưa start process.
- `PENDING_APPROVAL`: đang chờ phê duyệt và đang giữ phòng.
- `CONFIRMED`: đã phê duyệt.
- `REJECTED`: bị từ chối hoặc hết hạn giữ phòng.
- `CANCELLED`: bị hủy.
- `FAILED`/`VALIDATION_FAILED`: lỗi nghiệp vụ hoặc lỗi start process.

Attendee response:

- `PENDING`
- `ACCEPTED`
- `DECLINED`
- `TENTATIVE`

Workflow:

- `DRAFT`: cấu hình chưa deploy.
- `DEPLOYED`: đã deploy lên engine và có thể chọn khi tạo meeting.

## 8. Dữ Liệu Khởi Tạo

`DataInitializer` seed:

- Roles: `ADMIN`, `REQUESTER`, `APPROVER`.
- Users demo: `admin`, `requester01`, `approver01`, `user01`.
- Thiết bị mẫu: projector, micro, whiteboard, TV screen, video conference.
- Phòng mẫu: `ROOM_A101`, `ROOM_B201`, `ROOM_ONLINE`.
- Workflow mẫu: `MEETING_SCHEDULING_WORKFLOW`.

## 9. Quy Ước Dọn Dẹp Source

Không nên commit các thư mục sinh ra:

- `backend/target/`
- `frontend/dist/`
- `frontend/node_modules/`

Root `.gitignore` đã loại các thư mục này. Các package backend hiện nhiều nhưng đang bám theo domain nghiệp vụ, nên không nên ép gộp cơ học nếu không có lý do rõ ràng vì sẽ làm tăng rủi ro vỡ import và security rule.
