# CRM Backend Hệ Thống Quản Lý Khách Hàng Realtime

## 1. Giới Thiệu Project
Dự án là một hệ thống **Realtime CRM (Customer Relationship Management)** dành cho doanh nghiệp, cho phép nhân viên (STAFF) và ban quản trị (ADMIN) tương tác, tư vấn và hỗ trợ khách hàng (CUSTOMER) theo thời gian thực. Hệ thống cung cấp API RESTful hoàn chỉnh, phân quyền bảo mật, giao tiếp WebSocket tức thời và kiến trúc xử lý nền (Background Job) chống nghẽn tải.

## 2. Công Nghệ Sử Dụng

| Lớp (Layer) | Công nghệ |
| :--- | :--- |
| **Runtime** | Node.js (v20+) |
| **Ngôn ngữ** | TypeScript |
| **Framework** | Express.js |
| **Cơ sở dữ liệu** | PostgreSQL |
| **ORM** | Prisma |
| **Realtime** | Socket.IO |
| **Background Job** | BullMQ & Redis |
| **Xác thực** | JWT (jsonwebtoken + bcrypt) |
| **Validation** | Zod |
| **Tài liệu API** | Swagger / OpenAPI |
| **Triển khai** | Docker & Docker Compose |

---

## 3. Database Design
Hệ thống sử dụng PostgreSQL thông qua Prisma ORM, bao gồm các thực thể chính có quan hệ chặt chẽ (Relational Design):
- **User**: Bảng người dùng nội bộ (nhân viên, quản trị viên). Có mật khẩu được mã hoá (bcrypt).
- **Role & UserRole**: Bảng quản lý vai trò (ADMIN, STAFF, CUSTOMER) và bảng trung gian (N-N) để gán vai trò cho User.
- **Customer**: Bảng lưu trữ thông tin khách hàng, thuộc về một User quản lý (Assigned To).
- **Conversation**: Bảng quản lý các phiên hội thoại (Chat) giữa Customer và hệ thống. Trạng thái (OPEN, CLOSED).
- **Message**: Các dòng tin nhắn thực tế trong một hội thoại, có thể đính kèm file (Attachment).
- **Attachment**: Bảng lưu trữ thông tin về file đính kèm.
- **WebhookEvent**: Bảng lưu trữ và theo dõi trạng thái các webhook nhận từ hệ thống bên thứ 3 (đảm bảo tính luỹ đẳng).
- **Notification**: Thông báo sinh ra tự động gửi cho User.

---

## 4. Hướng Dẫn Cài Đặt & Khởi Chạy

### Cách Chạy Bằng Docker (Khuyên Dùng)
Dự án đã được Dockerize hoàn chỉnh bằng Multi-stage build để tối ưu dung lượng.
```bash
# Chạy toàn bộ hệ thống (App, Postgres, Redis) dưới nền
docker-compose up --build -d
```

### Cách Chạy Local (Không Dùng Docker)
Yêu cầu: Node.js 20+, PostgreSQL và Redis đã cài đặt.
```bash
# 1. Cài đặt dependencies
yarn install

# 2. Thiết lập file .env (Sử dụng mẫu .env bên dưới)

# 3. Tạo cấu trúc Database
npx prisma generate
npx prisma db push

# 4. Khởi chạy Server
yarn dev
```

### Mẫu `.env`
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/crm_db?schema=public"
PORT=3000
JWT_SECRET=supersecretkey
JWT_EXPIRES_IN=1d
REDIS_URL="redis://localhost:6379"
```

---

## 5. API Document
Tài liệu API được mô tả chi tiết bằng Swagger, cho phép tương tác trực tiếp:
- **URL**: `http://localhost:3000/api-docs`

---

## 6. Các Luồng Nghiệp Vụ (Flows & Architecture)

### 6.1. Auth Flow
1. **Đăng ký (Register)**: Người dùng (User) gọi API `POST /api/auth/register` với Email, Tên và Mật khẩu. Mật khẩu được mã hoá bằng `bcrypt` trước khi lưu.
2. **Đăng nhập (Login)**: Gọi `POST /api/auth/login`. Hệ thống so khớp mật khẩu, lấy các Roles tương ứng và trả về chuỗi Token `JWT`.
3. **Sử dụng API**: Client gắn JWT vào header `Authorization: Bearer <token>` ở các request cần xác thực.

### 6.2. Conversation / Message Flow
1. **Tạo hội thoại**: Bất kỳ User nào cũng có thể tạo `Conversation` thông qua `POST /api/conversations`.
2. **Phân công (Assign)**: ADMIN hoặc STAFF sử dụng `POST /api/conversations/:id/assign` để nhận hoặc phân công hội thoại cho nhân viên xử lý.
3. **Nhắn tin**: Gọi `POST /api/conversations/:id/messages` để gửi text. Nếu có tệp đính kèm, sử dụng endpoint có `multipart/form-data`.
4. **Đóng hội thoại**: Sau khi xử lý xong, STAFF hoặc ADMIN gọi `POST /api/conversations/:id/close` để hoàn thành.

### 6.3. Realtime WebSocket Flow
Sử dụng Socket.IO với cơ chế bảo vệ bằng JWT.
1. **Connect**: Client kết nối và gửi JWT trong mục `auth` hoặc `extraHeaders`. Server xác minh JWT và gắn userId vào Socket.
2. **Join Room**: Client gửi event `join_conversation` cùng `conversationId`. Server check xem User có quyền truy cập không, nếu hợp lệ sẽ join vào Room tương ứng.
3. **Send Message**: Khi Client gọi API gửi tin nhắn, hoặc emit event `send_message`, Server lưu Database sau đó gọi `io.to(room).emit("new_message")` phát (broadcast) cho tất cả các member đang xem.

> 🛠 *Xem file `demo/realtime-chat.html` để trải nghiệm gửi nhận tin nhắn 2 màn hình.*

### 6.4. Webhook & Notification Flow
- **Webhook**: Hệ thống lắng nghe tại `POST /api/webhooks/messages`. Khi có request:
  1. Kiểm tra header `x-webhook-secret` (Authentication).
  2. Lưu Webhook Event vào Database kèm EventID (đảm bảo tính Idempotency - không xử lý trùng).
  3. Đẩy Webhook vào Background Job (BullMQ) để xử lý (trả về 200 OK ngay lập tức).
- **Background Jobs**:
  1. **Notification Job**: Khi có tin nhắn mới lưu vào DB, một job sẽ được đẩy vào Queue `notification-queue`.
  2. **Worker** lắng nghe Redis Queue, lấy job ra xử lý và lưu record vào bảng Notification.
  3. Tích hợp tự động Retry (tối đa 3 lần) bằng thuật toán Exponential Backoff nếu có lỗi.

---

## 7. Phân Quyền & Bảo Mật (Security Notes)

- **Roles & Permissions (RBAC)**:
  - `ADMIN`: Xem tất cả, quản lý Users, Customers, gán Role, xem Webhook Logs.
  - `STAFF`: Quản lý Customer của mình, phân công Conversation, nhắn tin.
  - `CUSTOMER`: Chỉ xem và nhắn tin trong hội thoại mà mình là thành viên.
- **Bảo Mật Bằng Middleware (`roleGuard`)**: Roles được nhúng sẵn trong Payload của JWT, giúp Middleware kiểm tra quyền cực nhanh mà không cần gọi Database.
- **Chống Brute Force (Rate Limit)**:
  - Giới hạn IP ở API `/auth/login` và `/auth/register` (Tối đa 10 requests / 15 phút).
  - Giới hạn IP ở Webhook (Tối đa 60 requests / 1 phút).
- **Quyền Riêng Tư (Privacy)**: Các Error Handler và Application Logger được thiết kế để không bao giờ ghi lại Token hay Password ra màn hình console.
