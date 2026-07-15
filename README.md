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
| `error` | `{ message, code? }` | Thông báo lỗi (403, validation, ...) |

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
