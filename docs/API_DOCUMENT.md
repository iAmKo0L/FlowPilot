# Tài Liệu API FlowPilot

Swagger UI: `http://localhost:8081/swagger-ui/index.html`

Sau khi đăng nhập, copy JWT token và bấm **Authorize** trong Swagger với giá trị:

```text
Bearer <token>
```

## 1. Authentication API

| Method | Endpoint | Role | Mô tả |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | PUBLIC | Đăng nhập và nhận JWT |
| POST | `/api/auth/register` | PUBLIC | Đăng ký tài khoản |
| GET | `/api/auth/me` | AUTHENTICATED | Lấy thông tin người dùng hiện tại |

## 2. Room API

| Method | Endpoint | Role | Mô tả |
| --- | --- | --- | --- |
| GET | `/api/rooms` | REQUESTER / APPROVER / ADMIN | Danh sách phòng |
| GET | `/api/rooms/{id}` | REQUESTER / APPROVER / ADMIN | Chi tiết phòng |
| POST | `/api/admin/rooms` | ADMIN | Tạo phòng |
| PUT | `/api/admin/rooms/{id}` | ADMIN | Cập nhật phòng |
| DELETE | `/api/admin/rooms/{id}` | ADMIN | Xóa phòng |

## 3. Equipment API

| Method | Endpoint | Role | Mô tả |
| --- | --- | --- | --- |
| GET | `/api/equipment` | REQUESTER / APPROVER / ADMIN | Danh sách thiết bị |
| GET | `/api/equipment/{id}` | REQUESTER / APPROVER / ADMIN | Chi tiết thiết bị |
| POST | `/api/admin/equipment` | ADMIN | Tạo thiết bị |
| PUT | `/api/admin/equipment/{id}` | ADMIN | Cập nhật thiết bị |
| DELETE | `/api/admin/equipment/{id}` | ADMIN | Xóa thiết bị |

## 4. Workflow API

| Method | Endpoint | Role | Mô tả |
| --- | --- | --- | --- |
| GET | `/api/admin/workflows` | ADMIN | Lấy danh sách workflow |
| POST | `/api/admin/workflows` | ADMIN | Tạo workflow |
| GET | `/api/admin/workflows/{id}` | ADMIN | Xem chi tiết workflow |
| PUT | `/api/admin/workflows/{id}` | ADMIN | Cập nhật workflow |
| DELETE | `/api/admin/workflows/{id}` | ADMIN | Xóa workflow |
| POST | `/api/admin/workflows/{id}/steps` | ADMIN | Thêm bước xử lý |
| PUT | `/api/admin/workflows/{id}/steps/{stepId}` | ADMIN | Sửa bước xử lý |
| DELETE | `/api/admin/workflows/{id}/steps/{stepId}` | ADMIN | Xóa bước xử lý |
| GET | `/api/admin/workflows/{id}/bpmn-preview` | ADMIN | Preview BPMN XML |
| POST | `/api/admin/workflows/{id}/deploy` | ADMIN | Deploy workflow lên BPMN engine |
| GET | `/api/workflows/available` | REQUESTER / APPROVER / ADMIN | Lấy workflow đã deploy để tạo yêu cầu |

Các API form-field đã bị loại bỏ vì hiện frontend và nghiệp vụ tạo lịch chưa sử dụng form động theo field cấu hình.

## 5. Meeting API

| Method | Endpoint | Role | Mô tả |
| --- | --- | --- | --- |
| POST | `/api/meetings` | REQUESTER / APPROVER / ADMIN | Tạo yêu cầu lịch họp |
| GET | `/api/meetings/my` | REQUESTER / APPROVER / ADMIN | Lịch họp của người đang đăng nhập |
| GET | `/api/meetings/{id}` | REQUESTER owner / APPROVER / ADMIN | Chi tiết lịch họp |
| POST | `/api/meetings/{id}/start` | REQUESTER owner / ADMIN | Start process instance |
| GET | `/api/meetings/{id}/history` | REQUESTER owner / APPROVER / ADMIN | Lịch sử xử lý |

## 6. Attendee API

| Method | Endpoint | Role | Mô tả |
| --- | --- | --- | --- |
| GET | `/api/meetings/{id}/attendees` | REQUESTER / APPROVER / ADMIN | Danh sách attendee |
| POST | `/api/meetings/{id}/attendees/{attendeeId}/response` | INTERNAL attendee | Internal attendee phản hồi lời mời |
| GET | `/api/meetings/{id}/attendee-responses` | REQUESTER / APPROVER / ADMIN | Tổng hợp phản hồi attendee |
| POST | `/api/public/attendee-response/{token}` | PUBLIC guest token | Guest phản hồi bằng token |

Email guest dùng link frontend dạng:

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

## 7. Meeting Task API

| Method | Endpoint | Role | Mô tả |
| --- | --- | --- | --- |
| GET | `/api/meeting-tasks/my` | REQUESTER / APPROVER / ADMIN | Danh sách task có thể xử lý |
| GET | `/api/meeting-tasks/{taskId}` | REQUESTER / APPROVER / ADMIN | Chi tiết task |
| POST | `/api/meeting-tasks/{taskId}/claim` | APPROVER / ADMIN | Nhận task |
| POST | `/api/meeting-tasks/{taskId}/approve` | APPROVER / ADMIN | Phê duyệt yêu cầu |
| POST | `/api/meeting-tasks/{taskId}/reject` | APPROVER / ADMIN | Từ chối yêu cầu |

Endpoint `/api/meeting-tasks/{taskId}/complete` đã bị loại bỏ khỏi API public vì frontend chỉ dùng hai hành động nghiệp vụ rõ ràng là approve/reject.

## 8. Notification API

| Method | Endpoint | Role | Mô tả |
| --- | --- | --- | --- |
| GET | `/api/notifications/my` | AUTHENTICATED | Thông báo cá nhân |
| GET | `/api/meetings/{id}/notifications` | APPROVER / ADMIN | Nhật ký thông báo của meeting |

## 9. User / Attendee Resolve API

| Method | Endpoint | Role | Mô tả |
| --- | --- | --- | --- |
| GET | `/api/users/search?keyword={keyword}` | AUTHENTICATED | Tìm user nội bộ |
| POST | `/api/attendees/resolve` | AUTHENTICATED | Phân loại email thành INTERNAL/GUEST |

## 10. Monitor API

| Method | Endpoint | Role | Mô tả |
| --- | --- | --- | --- |
| GET | `/api/admin/monitor/meetings` | ADMIN | Danh sách process/meeting |
| GET | `/api/admin/monitor/meetings/{id}/history` | ADMIN | Lịch sử xử lý |
| GET | `/api/admin/monitor/dashboard` | ADMIN | Thống kê dashboard |

## 11. Swagger / OpenAPI

| Method | Endpoint | Role | Mô tả |
| --- | --- | --- | --- |
| GET | `/swagger-ui/**` | PUBLIC | Swagger UI |
| GET | `/swagger-ui.html` | PUBLIC | Swagger UI |
| GET | `/v3/api-docs/**` | PUBLIC | OpenAPI JSON |
