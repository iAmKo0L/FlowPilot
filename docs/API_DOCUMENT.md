# Tài Liệu API FlowPilot

Swagger UI: `http://localhost:8081/swagger-ui/index.html`

Sau khi đăng nhập, copy JWT token và bấm **Authorize** trong Swagger với giá trị:

```text
Bearer <token>
```

## 1. Authentication

| Method | Endpoint | Quyền | Mô tả |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | Public | Đăng nhập và nhận JWT |
| POST | `/api/auth/register` | Public | Đăng ký tài khoản |
| GET | `/api/auth/me` | Authenticated | Lấy thông tin người dùng hiện tại |

Body login mẫu:

```json
{
  "username": "requester01",
  "password": "requester123"
}
```

## 2. Workflow Động

Endpoint admin quản lý nhiều workflow khác nhau cho từng công ty/quy trình.

| Method | Endpoint | Quyền | Mô tả |
| --- | --- | --- | --- |
| GET | `/api/admin/workflows` | ADMIN | Lấy danh sách workflow |
| POST | `/api/admin/workflows` | ADMIN | Tạo workflow |
| GET | `/api/admin/workflows/{id}` | ADMIN | Xem chi tiết workflow |
| PUT | `/api/admin/workflows/{id}` | ADMIN | Cập nhật workflow |
| DELETE | `/api/admin/workflows/{id}` | ADMIN | Xóa workflow |
| POST | `/api/admin/workflows/{id}/steps` | ADMIN | Thêm bước xử lý |
| PUT | `/api/admin/workflows/{id}/steps/{stepId}` | ADMIN | Sửa bước xử lý |
| DELETE | `/api/admin/workflows/{id}/steps/{stepId}` | ADMIN | Xóa bước xử lý |
| GET | `/api/admin/workflows/{id}/bpmn-preview` | ADMIN | Xem BPMN XML được sinh |
| POST | `/api/admin/workflows/{id}/deploy` | ADMIN | Deploy workflow lên Camunda |
| GET | `/api/admin/workflows/{id}/form-fields` | ADMIN | Lấy form field của workflow |
| POST | `/api/admin/workflows/{id}/form-fields` | ADMIN | Thêm form field |
| PUT | `/api/admin/workflows/{id}/form-fields/{fieldId}` | ADMIN | Sửa form field |
| DELETE | `/api/admin/workflows/{id}/form-fields/{fieldId}` | ADMIN | Xóa form field |
| GET | `/api/workflows/available` | REQUESTER, ADMIN | Lấy workflow đã deploy để requester chọn khi tạo yêu cầu |
| GET | `/api/workflows/{id}/form-fields` | REQUESTER, ADMIN | Lấy form field để render form động |

Các loại step đang hỗ trợ:

- `START`: điểm bắt đầu quy trình.
- `SERVICE_TASK`: bước tự động trong engine. Hiện generator dùng expression an toàn để đi tiếp, logic nghiệp vụ thật nằm ở backend khi start/approve/reject/scheduler.
- `USER_TASK`: task cho người dùng theo role.
- `APPROVE`: user task phê duyệt, thường gán `assigneeRole = APPROVER`.
- `CONDITION`: gateway rẽ nhánh theo biến process, ví dụ `{"variable":"approved","trueTarget":"confirm_meeting","falseTarget":"cancel_hold"}`.
- `END`: điểm kết thúc.

## 3. Phòng Họp Và Thiết Bị

| Method | Endpoint | Quyền | Mô tả |
| --- | --- | --- | --- |
| GET | `/api/rooms` | REQUESTER, APPROVER, ADMIN | Danh sách phòng |
| GET | `/api/rooms/{id}` | REQUESTER, APPROVER, ADMIN | Chi tiết phòng |
| POST | `/api/admin/rooms` | ADMIN | Tạo phòng |
| PUT | `/api/admin/rooms/{id}` | ADMIN | Cập nhật phòng |
| DELETE | `/api/admin/rooms/{id}` | ADMIN | Xóa phòng |
| GET | `/api/equipment` | REQUESTER, APPROVER, ADMIN | Danh sách thiết bị |
| GET | `/api/equipment/{id}` | REQUESTER, APPROVER, ADMIN | Chi tiết thiết bị |
| POST | `/api/admin/equipment` | ADMIN | Tạo thiết bị |
| PUT | `/api/admin/equipment/{id}` | ADMIN | Cập nhật thiết bị |
| DELETE | `/api/admin/equipment/{id}` | ADMIN | Xóa thiết bị |

Backend kiểm tra số attendee không vượt quá `capacity` của phòng khi tạo yêu cầu.

## 4. Meeting Requests

| Method | Endpoint | Quyền | Mô tả |
| --- | --- | --- | --- |
| POST | `/api/meetings` | REQUESTER, ADMIN | Tạo yêu cầu lịch họp |
| GET | `/api/meetings/my` | REQUESTER, ADMIN | Lịch họp của người đang đăng nhập |
| GET | `/api/meetings/{id}` | Requester owner, APPROVER, ADMIN | Chi tiết lịch họp |
| POST | `/api/meetings/{id}/start` | Requester owner, ADMIN | Start process instance trên BPMN engine |
| GET | `/api/meetings/{id}/history` | Requester owner, APPROVER, ADMIN | Lịch sử xử lý |

Body tạo lịch họp mẫu:

```json
{
  "title": "Họp triển khai FlowPilot",
  "meetingContent": "Rà soát tiến độ và phân công công việc",
  "meetingType": "OFFLINE",
  "onlineMeetingLink": null,
  "startTime": "2026-06-20T09:00:00",
  "endTime": "2026-06-20T10:00:00",
  "roomId": 1,
  "workflowId": 1,
  "equipmentIds": [1],
  "priority": "HIGH",
  "attendees": [
    { "email": "user01@flowpilot.com", "name": "User nội bộ" },
    { "email": "guest@example.com", "name": "Khách ngoài" }
  ]
}
```

Khi start process, backend:

- Kiểm tra phòng còn hoạt động, không trùng lịch và đủ sức chứa.
- Tạo process instance trên Camunda theo workflow đã deploy.
- Chuyển meeting sang `PENDING_APPROVAL`.
- Gán `holdUntil = now + MEETING_HOLD_DURATION_MINUTES`.
- Nếu quá hạn giữ phòng mà chưa duyệt, scheduler tự chuyển yêu cầu sang `REJECTED` và trả lại phòng.

## 5. Task Phê Duyệt

| Method | Endpoint | Quyền | Mô tả |
| --- | --- | --- | --- |
| GET | `/api/meeting-tasks/my` | APPROVER, ADMIN | Danh sách task theo role/người dùng |
| GET | `/api/meeting-tasks/{taskId}` | APPROVER, ADMIN | Chi tiết task |
| POST | `/api/meeting-tasks/{taskId}/claim` | APPROVER, ADMIN | Nhận task |
| POST | `/api/meeting-tasks/{taskId}/complete` | APPROVER, ADMIN | Hoàn thành task với biến tùy chọn |
| POST | `/api/meeting-tasks/{taskId}/approve` | APPROVER, ADMIN | Phê duyệt yêu cầu |
| POST | `/api/meeting-tasks/{taskId}/reject` | APPROVER, ADMIN | Từ chối yêu cầu |

Khi approve, biến `approved = true` được gửi về BPMN engine. Khi reject, biến `approved = false` được gửi để gateway rẽ nhánh đúng.

## 6. Attendee Và Notification

| Method | Endpoint | Quyền | Mô tả |
| --- | --- | --- | --- |
| GET | `/api/users/search?keyword=...` | Authenticated | Tìm user nội bộ |
| POST | `/api/attendees/resolve` | Authenticated | Phân loại email thành INTERNAL/GUEST |
| GET | `/api/meetings/{id}/attendees` | Người có quyền xem meeting | Danh sách attendee |
| POST | `/api/meetings/{id}/attendees/{attendeeId}/response` | INTERNAL attendee | Phản hồi lời mời họp |
| GET | `/api/meetings/{id}/attendee-responses` | Người có quyền xem meeting | Tổng hợp phản hồi |
| POST | `/api/public/attendee-response/{token}` | Public guest token | Guest phản hồi bằng token |
| GET | `/api/notifications/my` | Authenticated | Thông báo cá nhân |
| GET | `/api/meetings/{id}/notifications` | Người có quyền xem meeting | Nhật ký thông báo của meeting |

Internal attendee phản hồi qua thông báo sau khi đăng nhập. Guest attendee phản hồi qua link token công khai.

Email guest dùng các link frontend dạng:

```text
/public/attendee-response/{token}?status=ACCEPTED
/public/attendee-response/{token}?status=TENTATIVE
/public/attendee-response/{token}?status=DECLINED
```

Frontend sẽ tự gọi `POST /api/public/attendee-response/{token}` với body:

```json
{
  "responseStatus": "ACCEPTED"
}
```

## 7. Monitor

| Method | Endpoint | Quyền | Mô tả |
| --- | --- | --- | --- |
| GET | `/api/admin/monitor/meetings` | ADMIN | Danh sách process/meeting đang theo dõi |
| GET | `/api/admin/monitor/meetings/{id}/history` | ADMIN | Lịch sử xử lý của meeting |
| GET | `/api/admin/monitor/dashboard` | ADMIN | Thống kê dashboard |
