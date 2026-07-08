-- Roles
INSERT INTO roles (id, name, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'ADMIN', now()),
('22222222-2222-2222-2222-222222222222', 'STAFF', now());

-- Users
INSERT INTO users (id, email, password_hash, name, created_at, updated_at) VALUES
('a1111111-1111-1111-1111-111111111111', 'admin@gmail.com', '$2b$10$hashvalue', 'Admin User', now(), now()),
('a2222222-2222-2222-2222-222222222222', 'staff@gmail.com', '$2b$10$hashvalue', 'Staff User', now(), now());

-- User Roles
INSERT INTO user_roles (id, user_id, role_id, assigned_at) VALUES
('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', now()),
('b2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', now());

-- Customers
INSERT INTO customers (id, name, email, phone, created_at, updated_at) VALUES
('c1111111-1111-1111-1111-111111111111', 'Nguyen Van A', 'customer1@gmail.com', '0900000001', now(), now());

-- Conversations
INSERT INTO conversations (id, customer_id, status, created_at, updated_at) VALUES
('d1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'OPEN', now(), now());

-- Conversation Members
INSERT INTO conversation_members (id, conversation_id, user_id, joined_at) VALUES
('e1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', now());

-- Messages
INSERT INTO messages (id, conversation_id, sender_id, content, sent_at) VALUES
('f1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'Xin chào, bạn cần hỗ trợ gì?', now());

-- Assignments
INSERT INTO assignments (id, conversation_id, user_id, assigned_at) VALUES
('11111111-2222-3333-4444-555555555555', 'd1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', now());

-- Notifications
INSERT INTO notifications (id, user_id, content, is_read, created_at) VALUES
('22222222-3333-4444-5555-666666666666', 'a2222222-2222-2222-2222-222222222222', 'Bạn có tin nhắn mới', false, now());

-- Webhook Events
INSERT INTO webhook_events (id, event_id, payload, created_at) VALUES
('33333333-4444-5555-6666-777777777777', 'evt_001', '{"type":"message.created"}', now());

-- Attachments
INSERT INTO attachments (id, message_id, file_name, file_type, file_size, file_path, created_at) VALUES
('44444444-5555-6666-7777-888888888888', 'f1111111-1111-1111-1111-111111111111', 'document.pdf', 'application/pdf', 102400, '/uploads/document.pdf', now());

-- Activity Logs
INSERT INTO activity_logs (id, user_id, conversation_id, action, description, created_at) VALUES
('55555555-6666-7777-8888-999999999999', 'a2222222-2222-2222-2222-222222222222', 'd1111111-1111-1111-1111-111111111111', 'ASSIGN', 'Staff được phân công hội thoại', now());