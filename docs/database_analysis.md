# Database Analysis — CRM Backend

## Tổng quan

Database được thiết kế cho hệ thống Realtime CRM / Customer Support, hỗ trợ quản lý khách hàng, hội thoại, tin nhắn, phân công nhân viên, thông báo và webhook.

## Danh sách bảng và mô tả

### 1. users

Lưu thông tin người dùng hệ thống (nhân viên nội bộ) (ADMIN, STAFF). Không lưu password dạng plain text, dùng `password_hash`.

### 2. roles

Danh mục vai trò trong hệ thống: ADMIN, STAFF.

### 3. user_roles

Bảng trung gian, thể hiện quan hệ n-n giữa `users` và `roles` (1 user có thể có nhiều role).

### 4. customers

Lưu thông tin khách hàng liên hệ hỗ trợ. `email` và `phone` có ràng buộc unique.

### 5. conversations

Hội thoại giữa customer và nhân viên hỗ trợ. Có trường `status` (OPEN, ASSIGNED, PENDING, CLOSED).

### 6. conversation_members

Bảng trung gian n-n giữa `users` và `conversations`, xác định user nào tham gia hội thoại nào.

### 7. messages

Tin nhắn trong 1 conversation, gắn với người gửi (`sender_id`).

### 8. assignments

Ghi lại việc phân công 1 conversation cho 1 staff xử lý, có `assigned_at` và `unassigned_at`.

### 9. notifications

Thông báo gửi tới user (vd: có tin nhắn mới), có trạng thái `is_read`.

### 10. webhook_events

Lưu lại các sự kiện webhook nhận được, dùng `event_id` unique để đảm bảo không xử lý trùng.

### 11. attachments

File đính kèm gắn với 1 message cụ thể.

### 12. activity_logs

Ghi log các hành động quan trọng, phục vụ audit.

## Quan hệ giữa các bảng

- `users` 1-n `user_roles` n-1 `roles`
- `customers` 1-n `conversations`
- `conversations` 1-n `conversation_members` n-1 `users`
- `conversations` 1-n `messages`
- `messages` n-1 `users` (sender)
- `messages` 1-n `attachments`
- `conversations` 1-n `assignments` n-1 `users`
- `users` 1-n `notifications`
- `conversations` 1-n `activity_logs`, `users` 1-n `activity_logs`

## Index & Unique Constraint

---

| Bảng                 | Unique                     | Index                      |
| -------------------- | -------------------------- | -------------------------- |
| users                | email                      | email                      |
| customers            | email, phone               | name                       |
| user_roles           | (user_id, role_id)         | user_id, role_id           |
| conversation_members | (conversation_id, user_id) | conversation_id, user_id   |
| webhook_events       | event_id                   | event_id                   |
| conversations        | —                          | customer_id, status        |
| messages             | —                          | conversation_id, sender_id |
| assignments          | —                          | conversation_id, user_id   |
| notifications        | —                          | user_id                    |
| attachments          | —                          | message_id                 |
| activity_logs        | —                          | user_id, conversation_id   |

---
