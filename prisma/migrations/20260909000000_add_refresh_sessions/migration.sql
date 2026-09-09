CREATE TABLE "RefreshSession" (
    "session_id" SERIAL NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    CONSTRAINT "RefreshSession_pkey" PRIMARY KEY ("session_id")
);

CREATE UNIQUE INDEX "RefreshSession_token_hash_key" ON "RefreshSession"("token_hash");
CREATE INDEX "RefreshSession_user_id_idx" ON "RefreshSession"("user_id");
ALTER TABLE "RefreshSession" ADD CONSTRAINT "RefreshSession_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
