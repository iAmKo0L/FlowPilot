# FlowPilot

FlowPilot là hệ thống đặt lịch họp có workflow động, tích hợp BPMN engine để deploy/start process instance, phân công task theo role, phê duyệt yêu cầu, giữ phòng tạm thời, gửi thông báo và ghi nhận phản hồi người tham gia.

Hệ thống được xây dựng cho bài toán: mỗi công ty có thể cấu hình luồng tạo lịch họp khác nhau, sau đó FlowPilot sinh BPMN XML tương ứng và deploy lên Camunda/CIB Seven.

## Tính Năng Chính

- Quản trị viên cấu hình động nhiều workflow: thêm/sửa/xóa workflow, step, form field.
- Sinh BPMN XML từ cấu hình workflow và deploy lên BPMN engine.
- Hỗ trợ các step: `START`, `SERVICE_TASK`, `USER_TASK`, `APPROVE`, `CONDITION`, `END`.
- Requester tạo yêu cầu đặt lịch họp theo workflow đã deploy.
- Kiểm tra phòng active, trùng lịch và sức chứa phòng so với số attendee.
- Tạm giữ phòng khi process được start; tự reject và trả phòng khi quá hạn.
- Approver/Admin nhận task, claim task, approve/reject.
- Đồng bộ trạng thái process/task/history về ứng dụng để monitor.
- Internal attendee phản hồi lời mời trong màn hình thông báo.
- Guest attendee nhận email thật qua SMTP và phản hồi bằng link public.
- Admin quản lý phòng họp, thiết bị, workflow và monitor dashboard.

## Công Nghệ

Backend:

- Java 17, Spring Boot 3
- Spring Security JWT
- Spring Data JPA, PostgreSQL
- Spring Mail SMTP
- Resilience4j Retry
- Swagger/OpenAPI
- Camunda 7 compatible REST integration

Frontend:

- React, TypeScript, Vite
- Tailwind CSS
- Axios
- Lucide Icons

DevOps:

- Docker Compose
- Backend/frontend Dockerfile
- PostgreSQL container
- Camunda/CIB Seven container

## Chạy Nhanh

Từ thư mục gốc dự án:

```bash
docker-compose up --build
```

Các URL chính:

- FlowPilot Web: `http://localhost:3000`
- Backend Swagger: `http://localhost:8081/swagger-ui/index.html`
- Camunda REST: `http://localhost:8080/engine-rest`
- Camunda Cockpit: `http://localhost:8080/camunda/app/cockpit/default/#/processes`

Dừng hệ thống:

```bash
docker-compose down
```

## Tài Khoản Demo

| Username | Password | Role |
| --- | --- | --- |
| `admin` | `admin123` | ADMIN |
| `requester01` | `requester123` | REQUESTER |
| `approver01` | `approver123` | APPROVER |
| `user01` | `user123` | REQUESTER |

## Gửi Email Thật Cho Guest

Mặc định hệ thống vẫn chạy nếu chưa cấu hình mail. Để gửi email thật cho khách mời bên ngoài, bật SMTP:

```env
APP_MAIL_ENABLED=true
APP_FRONTEND_URL=https://your-public-flowpilot-domain.com
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-sender@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=your-sender@gmail.com
```

Với Gmail, `MAIL_PASSWORD` là **App Password**, không phải mật khẩu đăng nhập Gmail thường. Khi guest nhận email, trong email có thông tin cuộc họp và 3 link phản hồi:

- Đồng ý: `/public/attendee-response/{token}?status=ACCEPTED`
- Có thể: `/public/attendee-response/{token}?status=TENTATIVE`
- Từ chối: `/public/attendee-response/{token}?status=DECLINED`

Khi guest bấm link, frontend tự gọi API public để ghi nhận phản hồi.

## Tài Liệu Chi Tiết

Tài liệu đầy đủ nằm trong thư mục `docs/`:

- [Hướng dẫn chạy](docs/README_RUN.md)
- [Tài liệu kỹ thuật](docs/TECHNICAL_DOCUMENT.md)
- [Tài liệu API](docs/API_DOCUMENT.md)
- [Kịch bản demo](docs/DEMO_SCRIPT.md)

## Ghi Chú Source

Không commit các thư mục sinh ra khi build/chạy local:

- `backend/target/`
- `frontend/dist/`
- `frontend/node_modules/`

Các mục này đã được khai báo trong `.gitignore`.
