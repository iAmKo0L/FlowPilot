# Hướng Dẫn Chạy FlowPilot

FlowPilot là hệ thống đặt lịch họp có workflow động, sinh BPMN XML và deploy lên Camunda/CIB Seven để quản lý phê duyệt, giữ phòng, thông báo và theo dõi tiến trình.

## 1. Yêu Cầu

- Docker Desktop và Docker Compose.
- Java 17 và Maven 3.8+ nếu chạy backend local.
- Node.js 18/20 và npm nếu chạy frontend local.

## 2. Chạy Nhanh Bằng Docker Compose

Từ thư mục gốc `flowpilot`:

```bash
docker-compose up --build
```

Các service được khởi động:

- PostgreSQL: `localhost:5432`
- Camunda/CIB Seven engine: `http://localhost:8080`
- Backend API: `http://localhost:8081`
- Frontend: `http://localhost:3000`

Dừng hệ thống:

```bash
docker-compose down
```

Nếu muốn xóa luôn dữ liệu PostgreSQL volume:

```bash
docker-compose down -v
```

## 3. Chạy Local Khi Phát Triển

Khởi động database và BPMN engine:

```bash
docker-compose up postgres cibseven
```

Chạy backend:

```bash
cd backend
mvn spring-boot:run
```

Chạy frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend dev mặc định chạy tại `http://localhost:5173`.

## 4. URL Quan Trọng

- Ứng dụng FlowPilot: `http://localhost:3000`
- Swagger UI: `http://localhost:8081/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8081/v3/api-docs`
- Camunda REST: `http://localhost:8080/engine-rest`
- Camunda Cockpit: `http://localhost:8080/camunda/app/cockpit/default/#/processes`

Tài khoản Camunda demo của image mặc định: `demo` / `demo`.

## 5. Tài Khoản Demo

| Username | Password | Role | Mục đích |
| --- | --- | --- | --- |
| `admin` | `admin123` | ADMIN | Quản lý phòng, thiết bị, workflow, deploy BPMN, xem monitor |
| `requester01` | `requester123` | REQUESTER | Tạo yêu cầu đặt lịch họp, xem lịch họp của mình |
| `approver01` | `approver123` | APPROVER | Nhận task, xem chi tiết lịch họp, approve/reject |
| `user01` | `user123` | REQUESTER | Tài khoản requester nội bộ để demo attendee |

## 6. Biến Cấu Hình Chính

Các biến này có thể cấu hình trong `docker-compose.yml` hoặc môi trường chạy backend:

- `SPRING_DATASOURCE_URL`: JDBC URL PostgreSQL.
- `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`: tài khoản database.
- `BPMN_ENGINE_URL`: URL Camunda REST, mặc định local là `http://localhost:8080/engine-rest`.
- `JWT_SECRET`: khóa ký JWT, cần đổi khi chạy thật.
- `APP_CRYPTO_SECRET`: khóa AES 16 bytes cho dữ liệu nhạy cảm.
- `MEETING_HOLD_DURATION_MINUTES`: thời gian tạm giữ phòng, mặc định 15 phút.
- `MEETING_HOLD_EXPIRATION_SCAN_MS`: chu kỳ quét yêu cầu hết hạn giữ phòng, mặc định 60000 ms.
- `APP_FRONTEND_URL`: URL public của frontend dùng trong email mời họp, mặc định `http://localhost:3000`.
- `APP_MAIL_ENABLED`: bật gửi email thật, mặc định `false`.
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`: cấu hình SMTP.
- `MAIL_SMTP_AUTH`, `MAIL_SMTP_STARTTLS_ENABLE`: cấu hình xác thực/TLS SMTP.

## 7. Gửi Email Thật Cho Guest

Mặc định hệ thống chỉ lưu notification trong database. Để gửi email thật cho khách mời bên ngoài, cần bật SMTP:

```yaml
APP_MAIL_ENABLED=true
APP_FRONTEND_URL=https://your-public-flowpilot-domain.com
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-sender@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=your-sender@gmail.com
```

Với Gmail, không dùng mật khẩu đăng nhập chính. Cần bật xác thực 2 bước và tạo **App Password** cho ứng dụng gửi mail. Với môi trường công ty, nên dùng SMTP doanh nghiệp như Google Workspace, Microsoft 365, SendGrid, Mailgun, Amazon SES hoặc SMTP relay nội bộ.

Email gửi cho guest có thông tin cuộc họp và 3 link:

- Đồng ý: `/public/attendee-response/{token}?status=ACCEPTED`
- Có thể: `/public/attendee-response/{token}?status=TENTATIVE`
- Từ chối: `/public/attendee-response/{token}?status=DECLINED`

Khi guest bấm link, frontend tự gọi API public để ghi nhận phản hồi.

## 8. Ghi Chú Dọn Dẹp

Các thư mục sinh ra khi build/chạy local không cần commit:

- `backend/target/`
- `frontend/dist/`
- `frontend/node_modules/`
- `frontend/.vite/`

Dự án đã có `.gitignore` ở root để loại các file trên khỏi cây mã nguồn.
