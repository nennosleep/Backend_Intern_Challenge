# PR: Challenge 6 – Assignment & Conversation Status APIs

## Summary

This PR implements the Assignment and Conversation Status management for the CRM system. It provides a complete workflow for assigning staff to support conversations, unassigning them, and controlling conversation lifecycle (open → assigned → closed → open).

## Changes Included

### New APIs

| Method | Endpoint | Auth | Description |
| :----- | :------- | :--- | :---------- |
| `POST` | `/api/conversations/:id/assign` | ADMIN, STAFF | Assign a staff member to a conversation |
| `POST` | `/api/conversations/:id/unassign` | ADMIN, STAFF | Remove the active assignment from a conversation |
| `POST` | `/api/conversations/:id/close` | ADMIN, STAFF | Close a conversation |
| `POST` | `/api/conversations/:id/reopen` | ADMIN, STAFF | Reopen a closed conversation |

### Key Implementation Details

1. **Staff Validation on Assign**: Validates that the target `staffUserId` exists in the database, has the `STAFF` role, and has `isActive = true`. Rejects assignment to inactive or non-staff users.
2. **Role-Based Access Control**:
   - **ADMIN**: Can assign/unassign/close/reopen any conversation.
   - **STAFF**: Can only assign conversations to themselves; can only unassign, close, or reopen conversations where they are (or were last) the assigned staff.
3. **Race Condition Prevention**: All assignment and status mutations use `Serializable` PostgreSQL transactions combined with a `SELECT ... FOR UPDATE` row-level lock on the conversation row. This ensures only one active assignment can exist per conversation at any point in time.
4. **Activity Logging**: Every action (`ASSIGN`, `UNASSIGN`, `CLOSE`, `REOPEN`) is recorded in `activity_logs` with the actor user ID and relevant metadata.
5. **Member Enrollment**: When a staff is assigned, they are automatically added to `conversation_members` if not already a member.

---

## Status Transition Table

The following table describes all valid conversation status transitions:

| Current Status | Action | New Status | Allowed Roles | Conditions |
| :------------- | :----- | :--------- | :------------ | :--------- |
| `OPEN` | `assign` | `ASSIGNED` | ADMIN, STAFF | Target user must have STAFF role and be active |
| `ASSIGNED` | `assign` | `ASSIGNED` | ADMIN, STAFF | Replaces the previous assignment (deactivates old one first) |
| `OPEN` / `ASSIGNED` | `unassign` | `OPEN` | ADMIN, STAFF | There must be an active assignment; STAFF can only unassign their own |
| `OPEN` / `ASSIGNED` | `close` | `CLOSED` | ADMIN, STAFF | STAFF can only close conversations assigned to themselves |
| `CLOSED` | `reopen` | `OPEN` | ADMIN, STAFF | STAFF can only reopen conversations where they were last assigned |
| `CLOSED` | `assign` | ❌ Error | — | Cannot assign a CLOSED conversation |
| `CLOSED` | `close` | ❌ Error | — | Already closed |

> [!NOTE]
> `PENDING` is a valid database enum value reserved for future use (e.g., bot-to-human escalation). It is not used in the current assignment workflow.

---

## Test Cases

### `POST /api/conversations/:id/assign`

| # | Scenario | Actor | Request Body | Expected Response |
|---|----------|-------|-------------|-------------------|
| 1 | Admin assigns an OPEN conversation to a valid staff | ADMIN | `{ "staffUserId": "<valid-staff-uuid>" }` | `200` – Assignment object returned |
| 2 | Staff assigns the conversation to themselves | STAFF | `{ "staffUserId": "<own-user-uuid>" }` | `200` – Assignment object returned |
| 3 | Staff tries to assign to a different staff | STAFF | `{ "staffUserId": "<other-staff-uuid>" }` | `403` – "STAFF can only assign conversations to themselves" |
| 4 | Assign to a non-existent user | ADMIN | `{ "staffUserId": "<random-uuid>" }` | `404` – "Staff user not found" |
| 5 | Assign to a user who has no STAFF role | ADMIN | `{ "staffUserId": "<admin-uuid>" }` | `403` – "The specified user does not have the STAFF role" |
| 6 | Assign to an inactive staff | ADMIN | `{ "staffUserId": "<inactive-staff-uuid>" }` | `400` – "Cannot assign to an inactive staff member" |
| 7 | Assign a CLOSED conversation | ADMIN | `{ "staffUserId": "<valid-staff-uuid>" }` | `400` – "Cannot assign a CLOSED conversation" |
| 8 | Assign a non-existent conversation | ADMIN | `{ "staffUserId": "<valid-staff-uuid>" }` | `404` – "Conversation not found" |
| 9 | Request with invalid `staffUserId` format | ADMIN | `{ "staffUserId": "not-a-uuid" }` | `400` – Zod validation error |
| 10 | Unauthenticated request | None | `{ "staffUserId": "<valid-staff-uuid>" }` | `401` – "No token provided" |
| 11 | Non-ADMIN, non-STAFF user | (user with no role) | `{ "staffUserId": "<valid-staff-uuid>" }` | `403` – "Access denied. Required roles: ADMIN, STAFF" |

---

### `POST /api/conversations/:id/unassign`

| # | Scenario | Actor | Expected Response |
|---|----------|-------|-------------------|
| 1 | Admin unassigns an ASSIGNED conversation | ADMIN | `200` – Updated conversation with status `OPEN` |
| 2 | Staff unassigns their own conversation | STAFF (assigned) | `200` – Updated conversation with status `OPEN` |
| 3 | Staff tries to unassign another staff's conversation | STAFF (not assigned) | `403` – "STAFF can only unassign conversations that are assigned to themselves" |
| 4 | Unassign a conversation with no active assignment | ADMIN | `400` – "No active assignment found for this conversation" |
| 5 | Conversation not found | ADMIN | `404` – "Conversation not found" |

---

### `POST /api/conversations/:id/close`

| # | Scenario | Actor | Expected Response |
|---|----------|-------|-------------------|
| 1 | Admin closes an OPEN conversation | ADMIN | `200` – Updated conversation with status `CLOSED` |
| 2 | Admin closes an ASSIGNED conversation | ADMIN | `200` – Updated conversation with status `CLOSED` |
| 3 | Staff closes their own assigned conversation | STAFF (assigned) | `200` – Updated conversation with status `CLOSED` |
| 4 | Staff closes a conversation not assigned to them | STAFF (not assigned) | `403` – "STAFF can only close conversations that are assigned to themselves" |
| 5 | Close an already CLOSED conversation | ADMIN | `400` – "Conversation is already closed" |
| 6 | Conversation not found | ADMIN | `404` – "Conversation not found" |

---

### `POST /api/conversations/:id/reopen`

| # | Scenario | Actor | Expected Response |
|---|----------|-------|-------------------|
| 1 | Admin reopens a CLOSED conversation | ADMIN | `200` – Updated conversation with status `OPEN` |
| 2 | Staff reopens a conversation they were last assigned to | STAFF (was assigned) | `200` – Updated conversation with status `OPEN` |
| 3 | Staff tries to reopen a conversation assigned to someone else | STAFF | `403` – "STAFF can only reopen conversations that were previously assigned to themselves" |
| 4 | Reopen a conversation that is not CLOSED | ADMIN | `400` – "Cannot reopen a conversation with status: OPEN/ASSIGNED" |
| 5 | Conversation not found | ADMIN | `404` – "Conversation not found" |

---

## How to Test Locally

1. Register two users – one with `ADMIN` role and one with `STAFF` role.
2. Create a customer.
3. Create a conversation for that customer (`POST /api/conversations`).
4. As ADMIN, call `POST /api/conversations/:id/assign` with the staff UUID.
5. Verify `GET /api/conversations/:id` shows status = `ASSIGNED`.
6. As STAFF, try assigning the conversation to a different staff – expect `403`.
7. As ADMIN, call `POST /api/conversations/:id/close`.
8. Verify status = `CLOSED`.
9. Call `assign` on the CLOSED conversation – expect `400`.
10. As ADMIN, call `POST /api/conversations/:id/reopen`.
11. Verify status = `OPEN`.
