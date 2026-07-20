-- TOTP-based 2FA for User accounts.
ALTER TABLE "User" ADD COLUMN "totpSecret" TEXT;
ALTER TABLE "User" ADD COLUMN "totpEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "recoveryCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
