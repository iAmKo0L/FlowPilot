# Kịch Bản Demo FlowPilot

## 1. Chuẩn Bị

Chạy hệ thống:

```bash
docker-compose up --build
```

Mở các trang:

- App: `http://localhost:3000`
- Swagger: `http://localhost:8081/swagger-ui/index.html`
- Camunda Cockpit: `http://localhost:8080/camunda/app/cockpit/default/#/processes`

Tài khoản demo:

- Admin: `admin` / `admin123`
- Requester: `requester01` / `requester123`
- Approver: `approver01` / `approver123`
- Internal attendee: `user01` / `user123`

## 2. Demo Admin Cấu Hình Workflow Động

1. Đăng nhập bằng `admin`.
2. Vào **Quy trình (Workflow)**.
3. Tạo workflow mới hoặc mở workflow mẫu `MEETING_SCHEDULING_WORKFLOW`.
4. Thêm các bước cơ bản:
   - `START`: Tiếp nhận yêu cầu.
   - `SERVICE_TASK`: Kiểm tra điều kiện lịch họp.
   - `SERVICE_TASK`: Tạm giữ phòng họp.
   - `APPROVE`: Phê duyệt lịch họp, role `APPROVER`.
   - `CONDITION`: Phân tích kết quả phê duyệt.
   - Nhánh từ chối: hủy giữ phòng, thông báo từ chối, kết thúc bị từ chối.
   - Nhánh đồng ý: xác nhận lịch họp, thông báo người tham gia, hoàn thành lịch họp.
5. Với bước `CONDITION`, dùng cấu hình:

```json
{
  "variable": "approved",
  "trueTarget": "confirm_meeting",
  "falseTarget": "cancel_hold"
}
```

6. Bấm preview BPMN để kiểm tra XML.
7. Bấm deploy workflow.
8. Mở Camunda Cockpit để xác nhận process definition mới xuất hiện, có mũi tên nối và gateway rẽ nhánh.

Kết quả mong đợi: workflow chuyển sang `DEPLOYED` và có thể chọn khi requester tạo yêu cầu mới.

## 3. Demo Quản Lý Phòng Và Thiết Bị

1. Đăng nhập `admin`.
2. Vào **Phòng họp & Thiết bị**.
3. Tạo phòng mới với capacity nhỏ, ví dụ 2.
4. Tạo hoặc gán thiết bị cho phòng.
5. Thử tạo meeting với số attendee lớn hơn capacity.

Kết quả mong đợi: backend từ chối yêu cầu vì số người tham gia vượt sức chứa phòng.

## 4. Demo Requester Tạo Yêu Cầu

1. Đăng nhập `requester01`.
2. Vào **Đặt lịch họp mới**.
3. Nhập tiêu đề, nội dung, thời gian, phòng, thiết bị.
4. Chọn workflow đã deploy.
5. Thêm attendee nội bộ `user01@flowpilot.com` và guest `guest@example.com`.
6. Gửi yêu cầu.

Kết quả mong đợi:

- Meeting được tạo và start process thành công.
- Trạng thái chuyển sang `PENDING_APPROVAL`.
- Phòng được giữ tạm thời đến `holdUntil`.
- Requester xem được chi tiết lịch họp nhưng không có quyền phê duyệt.

## 5. Demo Approver Phê Duyệt

1. Đăng nhập `approver01`.
2. Vào **Yêu cầu cần duyệt** hoặc mở thông báo task.
3. Bấm xem chi tiết để mở trang chi tiết lịch họp.
4. Claim task.
5. Chọn approve hoặc reject và nhập ghi chú.

Nếu approve:

- Meeting chuyển sang `CONFIRMED`.
- BPMN nhận biến `approved = true`.
- Internal attendee nhận notification mời họp.
- Guest attendee có token phản hồi public.

Nếu reject:

- Meeting chuyển sang `REJECTED`.
- BPMN nhận biến `approved = false`.
- Phòng được trả lại.

## 6. Demo Internal Attendee Phản Hồi

1. Đăng nhập `user01`.
2. Vào **Thông báo**.
3. Mở thông báo mời họp.
4. Chọn **Đồng ý** hoặc **Từ chối**.

Kết quả mong đợi:

- Notification đổi trạng thái theo phản hồi đã chọn.
- Không còn cho bấm phản hồi nhiều lần trên cùng thông báo.
- Trang chi tiết meeting hiển thị trạng thái attendee mới.

## 7. Demo Guest Phản Hồi Bằng Token

1. Vào chi tiết meeting hoặc log notification để lấy token/link guest.
2. Mở:

```text
http://localhost:3000/public/attendee-response/{token}
```

3. Chọn accept/decline/tentative.

Kết quả mong đợi: guest phản hồi được mà không cần đăng nhập.

## 8. Demo Gửi Email Thật Cho Guest

Để gửi mail thật, cấu hình backend:

```text
APP_MAIL_ENABLED=true
APP_FRONTEND_URL=http://localhost:3000
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-sender@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=your-sender@gmail.com
```

Với Gmail, `MAIL_PASSWORD` là App Password, không phải mật khẩu đăng nhập Gmail.

Sau khi approver approve meeting:

1. Guest nhận email thật tại email đã nhập.
2. Email có thông tin tiêu đề, thời gian, phòng/địa điểm, người tạo và nội dung.
3. Guest bấm một trong ba nút **Đồng ý**, **Có thể**, **Từ chối**.
4. Link mở trang public của FlowPilot và tự ghi nhận phản hồi.

Kết quả mong đợi: trạng thái attendee đổi thành `ACCEPTED`, `TENTATIVE` hoặc `DECLINED`.

## 9. Demo Tự Hủy Khi Hết Hạn Giữ Phòng

Để demo nhanh, có thể giảm biến:

```text
MEETING_HOLD_DURATION_MINUTES=1
MEETING_HOLD_EXPIRATION_SCAN_MS=10000
```

Sau đó:

1. Tạo request mới và start process.
2. Không approve.
3. Chờ scheduler quét hết hạn.

Kết quả mong đợi:

- Meeting chuyển sang `REJECTED`.
- `holdUntil` được xóa.
- History có action `ROOM_HOLD_EXPIRED`.
- Requester nhận notification yêu cầu đã bị từ chối do quá hạn giữ phòng.

## 10. Demo Monitor

1. Đăng nhập `admin`.
2. Vào **Monitor Dashboard**.
3. Xem danh sách process/meeting.
4. Mở chi tiết một process.

Kết quả mong đợi:

- Thấy trạng thái hiện tại, task hiện tại, người xử lý, lịch sử xử lý.
- History hiển thị ghi chú tiếng Việt đúng font.
- Camunda Cockpit hiển thị process diagram tương ứng workflow đã deploy.
