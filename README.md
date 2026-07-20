# CRM Backend

A Realtime CRM System built with Node.js, TypeScript, Express.js, PostgreSQL, Prisma and Socket.IO.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| Runtime | Node.js 20+ |
| Language | TypeScript |
| Framework | Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Realtime | Socket.IO |
| Auth | JWT (jsonwebtoken + bcrypt) |
| Validation | Zod |
| API Docs | Swagger / OpenAPI |

---

## Cách chạy local

```bash
# 1. Chạy tất cả bằng Docker (Khuyên dùng)
docker-compose up --build -d

# Truy cập API tại: http://localhost:3000
# Truy cập Swagger tại: http://localhost:3000/api-docs
```

## Cách chạy local (Không dùng Docker)

```bash
# 1. Cài đặt dependencies
yarn install

# 2. Tạo file .env (xem mẫu bên dưới)

# 3. Sinh Prisma Client
npx prisma generate

# 4. Khởi tạo database (chạy init.sql + sample_data.sql trong pgAdmin)

# 5. Chạy server
yarn dev
```

## Mẫu .env

```env
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/crm_db?schema=public"
PORT=3000
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d
REDIS_URL="redis://localhost:6379"
```

---

## API Docs (Swagger)

```
http://localhost:3000/api-docs
```

## Health Check

```
GET http://localhost:3000/api/health
```

---

## Realtime Chat — WebSocket Flow (Challenge 5)

### Kiến trúc

```
Client (Browser / Postman)          Server (Socket.IO)
        |                                   |
        |── connect + JWT token ──────────> |  Middleware xác thực JWT
        |                                   |  → Gắn userId vào socket.data
        |                                   |  → Ghi log SOCKET_CONNECTED
        |                                   |
        |── emit "join_conversation" ─────> |  Kiểm tra isMember()
        |   { conversationId }              |  → socket.join(conversationId)
        |                                   |  → Ghi log SOCKET_JOIN_CONVERSATION
        |<─ emit "joined_conversation" ──── |
        |                                   |
        |── emit "send_message" ──────────> |  Validate nội dung (Zod)
        |   { conversationId, content }     |  → Lưu message vào DB
        |                                   |  → io.to(room).emit("new_message")
        |                                   |  → Ghi log SOCKET_MESSAGE_SENT
        |<─ emit "new_message" ──────────── |  (Broadcast đến tất cả member trong room)
        |                                   |
        |── disconnect ────────────────────>|  → Ghi log SOCKET_DISCONNECTED
```

### Các sự kiện Socket (Events)

#### Client → Server

| Event | Payload | Mô tả |
| :--- | :--- | :--- |
| `join_conversation` | `{ conversationId: string }` | Join vào room của hội thoại |
| `send_message` | `{ conversationId: string, content: string }` | Gửi tin nhắn realtime |

#### Server → Client

| Event | Payload | Mô tả |
| :--- | :--- | :--- |
| `joined_conversation` | `{ conversationId, message }` | Xác nhận đã join room thành công |
| `new_message` | `{ id, conversationId, senderId, content, sentAt }` | Tin nhắn mới từ bất kỳ member nào |
| `socket_error` | `{ message, code? }` | Thông báo lỗi (403, validation, ...) |

### Cách xác thực (Authentication)

Client phải gửi JWT token khi kết nối:

```js
// Cách 1: qua auth object (khuyên dùng)
const socket = io('http://localhost:3000', {
  auth: { token: '<JWT_TOKEN>' }
});

// Cách 2: qua Authorization header
const socket = io('http://localhost:3000', {
  extraHeaders: { authorization: 'Bearer <JWT_TOKEN>' }
});
```

### Activity Logs được ghi tự động

| Action | Khi nào |
| :--- | :--- |
| `SOCKET_CONNECTED` | Client kết nối thành công |
| `SOCKET_JOIN_CONVERSATION` | Client join room thành công |
| `SOCKET_MESSAGE_SENT` | Tin nhắn gửi và lưu DB thành công |
| `SOCKET_DISCONNECTED` | Client ngắt kết nối |
| `SOCKET_ERROR` | Xảy ra lỗi khi gửi tin nhắn |

### Demo realtime với 2 client

Mở file `demo/realtime-chat.html` trong **2 tab trình duyệt** khác nhau:

1. **Tab 1**: Dán JWT token của User A → Connect → Join conversation → Gửi tin nhắn.
2. **Tab 2**: Dán JWT token của User B (cùng conversation) → Connect → Join cùng conversation → Thấy tin nhắn của User A xuất hiện realtime.

> File demo: `demo/realtime-chat.html`

---

## Phân quyền & Bảo mật (Challenge 11)

- **Roles**: Hệ thống hỗ trợ 3 vai trò chính:
  - `ADMIN`: Quản lý toàn bộ hệ thống (xem Users, Customers, gán Role, xem Webhook Logs).
  - `STAFF`: Quản lý Customer, xử lý các Conversation được phân công, xem dữ liệu nội bộ.
  - `CUSTOMER`: (Vai trò cho client bên thứ 3) Chỉ xem và gửi Message trong Conversation của chính mình.
- **Middleware**: Sử dụng `roleGuard` kiểm tra roles lấy từ JWT payload để bảo vệ các endpoints (Vd: `roleGuard('ADMIN')`).
- **Rate Limit**: Áp dụng `express-rate-limit` chống Spam/Brute Force:
  - **Auth API** (Login/Register): Tối đa 10 requests / 15 phút.
  - **Webhook API**: Tối đa 60 requests / 1 phút.
- **Data Privacy**: Logs hệ thống đảm bảo tuyệt đối không in thông tin nhạy cảm như `token` hay `password`.

---

## Background Job Queue (Challenge 10)

Hệ thống xử lý các tác vụ nền bằng **BullMQ** kết hợp **Redis** để giảm tải cho API chính (non-blocking). 
Ví dụ: Tạo thông báo (Notification) khi có tin nhắn mới.

### Yêu cầu
Phải có Redis server đang chạy. Cấu hình dễ dàng qua `docker-compose.yml`:
```bash
docker-compose up -d redis
```

### Flow xử lý thông báo (Notification Flow)
1. **API**: Người dùng gửi tin nhắn (API `POST /messages`).
2. **Producer**: API ghi tin nhắn vào DB, sau đó đẩy một job `send-notification` vào `notification-queue` của BullMQ và lập tức trả về kết quả 201 cho Client (không chờ ghi thông báo).
3. **Queue**: Job nằm trong Redis queue.
4. **Worker**: Background worker (`src/jobs/notification.job.ts`) lắng nghe, lấy job ra và thực thi việc ghi thông báo vào cơ sở dữ liệu.
5. **Retry Logic**: Nếu có lỗi khi lưu DB, BullMQ sẽ tự động retry tối đa 3 lần theo thuật toán `exponential backoff` trước khi đánh dấu là thất bại (failed). 
6. **Logging**: Ghi log ra console qua các event `completed` và `failed`.

---

## Triển khai Docker (Challenge 12)

Dự án đã được Dockerize hoàn chỉnh, giúp việc triển khai trở nên cực kỳ đơn giản và nhanh chóng.

- **Dockerfile**: Sử dụng Multi-stage build (`node:20-alpine`) để giảm thiểu dung lượng image. Chỉ cài đặt production dependencies trong stage cuối cùng.
- **Docker Compose**: Định nghĩa 3 services liên kết với nhau:
  - `db`: PostgreSQL database.
  - `redis`: Redis server (dành cho BullMQ).
  - `app`: Ứng dụng Node.js (tự động build từ Dockerfile, đợi DB/Redis chạy và tự động chạy `prisma db push` trước khi start).
- **Lệnh chạy**:
  ```bash
  docker-compose up --build -d
  ```
  Sau khi container chạy thành công, truy cập Swagger UI tại: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
