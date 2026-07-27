import "server-only";
import { randomBytes, createHash } from "crypto";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/** Raw token for the email link, and its SHA-256 digest for DB storage/lookup. */
export function generateResetToken(): {
  token: string;
  hash: string;
  expiresAt: Date;
} {
  const token = randomBytes(32).toString("hex");
  return {
    token,
    hash: hashResetToken(token),
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  };
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
