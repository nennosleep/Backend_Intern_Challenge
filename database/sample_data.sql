-- Roles
INSERT INTO roles (id, name, created_at) VALUES
('11111111-1111-1111-1111-111111111111'::uuid, 'ADMIN', now()),
('22222222-2222-2222-2222-222222222222'::uuid, 'STAFF', now());

-- Users
INSERT INTO users (id, email, password_hash, name, created_at, updated_at) VALUES
('a1111111-1111-1111-1111-111111111111'::uuid, 'admin@gmail.com', '$2b$10$hashvalue', 'Admin User', now(), now()),
('a2222222-2222-2222-2222-222222222222'::uuid, 'staff@gmail.com', '$2b$10$hashvalue', 'Staff User', now(), now());

-- User Roles
INSERT INTO user_roles (id, user_id, role_id, assigned_at) VALUES
('b1111111-1111-1111-1111-111111111111'::uuid, 'a1111111-1111-1111-1111-111111111111'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, now()),
('b2222222-2222-2222-2222-222222222222'::uuid, 'a2222222-2222-2222-2222-222222222222'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, now());

-- Customers
INSERT INTO customers (id, name, email, phone, created_at, updated_at) VALUES
('c1111111-1111-1111-1111-111111111111'::uuid, 'Nguyen Van A', 'customer1@gmail.com', '0900000001', now(), now());

-- Conversations
INSERT INTO conversations (id, customer_id, status, created_at, updated_at) VALUES
('d1111111-1111-1111-1111-111111111111'::uuid, 'c1111111-1111-1111-1111-111111111111'::uuid, 'OPEN', now(), now());

-- Conversation Members
INSERT INTO conversation_members (id, conversation_id, participant_type, user_id, customer_id, joined_at) VALUES
('e1111111-1111-1111-1111-111111111111'::uuid, 'd1111111-1111-1111-1111-111111111111'::uuid, 'USER', 'a2222222-2222-2222-2222-222222222222'::uuid, NULL, now()),
('e2222222-2222-2222-2222-222222222222'::uuid, 'd1111111-1111-1111-1111-111111111111'::uuid, 'CUSTOMER', NULL, 'c1111111-1111-1111-1111-111111111111'::uuid, now());

-- Messages
INSERT INTO messages (id, conversation_id, sender_id, sender_type, content, sent_at) VALUES
('f1111111-1111-1111-1111-111111111111'::uuid, 'd1111111-1111-1111-1111-111111111111'::uuid, 'a2222222-2222-2222-2222-222222222222'::uuid, 'USER', 'Xin chào, bạn cần hỗ trợ gì?', now() - interval '5 minutes'),
('f2222222-2222-2222-2222-222222222222'::uuid, 'd1111111-1111-1111-1111-111111111111'::uuid, 'c1111111-1111-1111-1111-111111111111'::uuid, 'CUSTOMER', 'Chào bạn, tôi muốn hỏi về sản phẩm A.', now());

-- Assignments
INSERT INTO assignments (id, conversation_id, user_id, is_active, assigned_at, unassigned_at) VALUES
('11111111-2222-3333-4444-555555555555'::uuid, 'd1111111-1111-1111-1111-111111111111'::uuid, 'a2222222-2222-2222-2222-222222222222'::uuid, true, now(), NULL);

-- Notifications
INSERT INTO notifications (id, user_id, content, is_read, created_at) VALUES
('22222222-3333-4444-5555-666666666666'::uuid, 'a2222222-2222-2222-2222-222222222222'::uuid, 'Bạn có tin nhắn mới', false, now());

-- Webhook Events
INSERT INTO webhook_events (id, event_id, payload, created_at) VALUES
('33333333-4444-5555-6666-777777777777'::uuid, 'evt_001', '{"type":"message.created"}'::jsonb, now());

-- Attachments
INSERT INTO attachments (id, message_id, file_name, file_type, file_size, file_path, created_at) VALUES
('44444444-5555-6666-7777-888888888888'::uuid, 'f1111111-1111-1111-1111-111111111111'::uuid, 'document.pdf', 'application/pdf', 102400, '/uploads/document.pdf', now());

-- Activity Logs
INSERT INTO activity_logs (id, user_id, entity_type, entity_id, action, metadata, created_at) VALUES
('55555555-6666-7777-8888-999999999999'::uuid, 'a2222222-2222-2222-2222-222222222222'::uuid, 'CONVERSATION', 'd1111111-1111-1111-1111-111111111111'::uuid, 'ASSIGN', '{"assigned_to":"a2222222-2222-2222-2222-222222222222"}'::jsonb, now()),
('66666666-7777-8888-9999-000000000000'::uuid, NULL, 'CUSTOMER', 'c1111111-1111-1111-1111-111111111111'::uuid, 'CREATE', '{"channel":"web","ip":"127.0.0.1"}'::jsonb, now());