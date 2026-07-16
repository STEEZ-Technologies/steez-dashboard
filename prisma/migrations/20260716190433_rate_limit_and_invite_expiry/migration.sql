-- AlterTable
-- Existing rows (invite codes issued before this migration) get a 7-day
-- expiry from the moment this runs, so already-shared-but-unused codes
-- don't die instantly. New rows always set expiresAt explicitly from
-- application code (see team/actions.ts createInviteCode).
ALTER TABLE "InviteCode" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days');
ALTER TABLE "InviteCode" ALTER COLUMN "expiresAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "RateLimitHit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitHit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RateLimitHit_key_createdAt_idx" ON "RateLimitHit"("key", "createdAt");
