-- Align the initial database migration with the Prisma schema without resetting data.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'STAFF';

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "department" TEXT,
  ADD COLUMN IF NOT EXISTS "gender" TEXT,
  ADD COLUMN IF NOT EXISTS "DOB" TIMESTAMP(3);

ALTER TABLE "Patient" ALTER COLUMN "abhaId" DROP NOT NULL;

DROP INDEX IF EXISTS "Patient_userId_key";
CREATE INDEX IF NOT EXISTS "Patient_userId_idx" ON "Patient"("userId");
