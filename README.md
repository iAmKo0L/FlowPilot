# FlowPilot - Hệ thống tự động hóa quy trình tạo lịch họp thông qua BPMN

FlowPilot là ứng dụng web tự động hóa quy trình tạo lịch họp tích hợp với BPMN Engine (Camunda 7 / CIB Seven). Hệ thống hỗ trợ lập lịch họp, kiểm tra và tạm giữ phòng họp chống trùng lặp lịch, gửi thông báo phê duyệt tới cấp quản lý và tự động gửi lời mời qua email token cho người tham dự phản hồi.

Hệ thống được phát triển phục vụ chương trình đào tạo **Viettel Digital Talent** với đề tài: *“Hệ thống tự động hóa quy trình nghiệp vụ tạo lịch họp thông qua BPMN/Workflow Engine”*.

---

## 1. Công Nghệ Sử Dụng (Tech Stack)

### Backend
- **Core**: Java 17, Spring Boot 3.x
- **BPMN Engine**: Camunda 7 / CIB Seven Integration
- **ORM**: Spring Data JPA, Hibernate
- **Database**: PostgreSQL
- **Security**: Spring Security + JWT + BCrypt (Cho người dùng hệ thống) & UUID Tokens (Cho khách mời bên ngoài)
- **API Documentation**: Swagger UI (springdoc-openapi)
- **Retry Mechanism**: Resilience4j Retry
- **Build Tool**: Maven

### Frontend
- **Framework**: React 18, Vite, TypeScript
- **Styling**: Vanilla CSS + Tailwind CSS utilities, Lucide Icons, Glassmorphism & HSL tailoring
- **HTTP Client**: Axios với Interceptors tự động đính kèm token
- **Build Tool**: npm

### Devops
- **Dockerization**: Multi-stage Dockerfiles cho cả backend và frontend
- **Orchestration**: Docker Compose kết hợp Healthcheck readiness probes

---

## 2. Các Tính Năng Core
1. **Quản lý tài nguyên**: Thêm sửa xóa phòng họp (`MeetingRoom`) và thiết bị (`Equipment`).
2. **Kiểm tra trùng lịch tự động**: Thuật toán overlap chặn trùng lịch đối với phòng họp ở trạng thái `PENDING_APPROVAL` hoặc `CONFIRMED`.
3. **Tạm giữ phòng họp (Temporary Room Hold)**: Hệ thống giữ phòng họp trong vòng 15 phút từ lúc gửi yêu cầu đến khi được duyệt. Quá 15 phút nếu chưa phê duyệt, Camunda engine sẽ kích hoạt Service Task hủy giữ phòng.
4. **Phân loại người tham gia**: Phân loại tự động email thành `INTERNAL` (tài khoản hệ thống) hoặc `GUEST` (khách mời ngoài).
5. **Cơ chế Token mời họp**: Khách mời nhận link với UUID token để phản hồi trực tiếp trạng thái tham gia (Accept, Decline, Tentative) mà không cần đăng nhập.
6. **Bản đồ Quy trình (15-step BPMN Process)**: Quy trình 15 bước chặt chẽ quản lý toàn bộ vòng đời cuộc họp từ kiểm tra trùng lặp, phê duyệt, thông báo, thu thập phản hồi, đến cập nhật trạng thái.

---

## 3. Khởi Chạy Nhanh (Quick Start)

Yêu cầu máy tính cài đặt sẵn **Docker** và **Docker Compose**. Chạy lệnh sau tại thư mục root của dự án:

```bash
docker compose up -d --build
```

Sau khi toàn bộ các container khởi động thành công và báo trạng thái `healthy`, bạn có thể truy cập các cổng dịch vụ sau:
- **Giao diện Web FlowPilot**: `http://localhost:3000`
- **Swagger API Docs**: `http://localhost:8081/swagger-ui/index.html`
- **Camunda REST Engine**: `http://localhost:8080/engine-rest`
- **Camunda Cockpit**: `http://localhost:8080` (Tài khoản: `demo` / `demo`)

---

## 4. Tài Khoản Demo
Hệ thống tạo sẵn các tài khoản ứng với các vai trò để dễ dàng kiểm thử quy trình:
1. **admin / admin123** - Vai trò **ADMIN** (Thiết lập phòng họp, deploy quy trình, theo dõi giám sát)
2. **requester01 / requester123** - Vai trò **REQUESTER** (Người tạo yêu cầu lịch họp, gửi duyệt)
3. **user01 / user123** - Vai trò **REQUESTER** (Tài khoản requester demo phụ)
4. **approver01 / approver123** - Vai trò **APPROVER** (Người phê duyệt phòng họp, nhận thông báo duyệt)

---

## 5. Tài Liệu Chi Tiết

Tất cả tài liệu đặc tả hệ thống được đặt trong thư mục `docs/`:
- [Hướng dẫn chạy chi tiết (README_RUN.md)](file:///docs/README_RUN.md)
- [Tài liệu thiết kế kiến trúc kỹ thuật (TECHNICAL_DOCUMENT.md)](file:///docs/TECHNICAL_DOCUMENT.md)
- [Đặc tả các REST APIs (API_DOCUMENT.md)](file:///docs/API_DOCUMENT.md)
- [Kịch bản kiểm thử quy trình (DEMO_SCRIPT.md)](file:///docs/DEMO_SCRIPT.md)
