-- A PostgreSQL UNIQUE constraint treats NULL values as distinct. The old
-- three-column index therefore allowed duplicate user/customer memberships.
DROP INDEX IF EXISTS "conversation_members_conversation_id_user_id_customer_id_key";

CREATE UNIQUE INDEX "conversation_members_conversation_user_key"
ON "conversation_members" ("conversation_id", "user_id")
WHERE "user_id" IS NOT NULL;

CREATE UNIQUE INDEX "conversation_members_conversation_customer_key"
ON "conversation_members" ("conversation_id", "customer_id")
WHERE "customer_id" IS NOT NULL;
