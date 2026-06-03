-- Add indexes for foreign key columns reported by Supabase Performance Advisor.
CREATE INDEX IF NOT EXISTS "Collection_user_id_idx" ON "Collection"("user_id");
CREATE INDEX IF NOT EXISTS "Post_user_id_idx" ON "Post"("user_id");
CREATE INDEX IF NOT EXISTS "Post_collection_id_idx" ON "Post"("collection_id");
