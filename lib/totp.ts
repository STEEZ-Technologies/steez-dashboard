import "server-only";
import * as OTPAuth from "otpauth";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const ISSUER = "STEEZ Dashboard";

export function generateSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

export function buildTotpUri(email: string, secret: string): string {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });
  return totp.toString();
}

/** Returns true if `token` is valid for `secret` within the standard ±1 step window. */
export function verifyTotpToken(secret: string, token: string): boolean {
  if (!/^\d{6}$/.test(token)) return false;
  const totp = new OTPAuth.TOTP({
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });
  return totp.validate({ token, window: 1 }) !== null;
}

/** Human-friendly one-time recovery codes, e.g. "7F3K-9QXZ". Returned in plaintext once; only the hashes are stored. */
export function generateRecoveryCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = randomBytes(5).toString("hex").toUpperCase(); // 10 hex chars
    codes.push(`${raw.slice(0, 5)}-${raw.slice(5, 10)}`);
  }
  return codes;
}

export async function hashRecoveryCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map((c) => bcrypt.hash(c, 10)));
}

/** Checks `code` against the stored hashes; returns the index of the match, or -1. */
export async function matchRecoveryCode(
  code: string,
  hashes: string[],
): Promise<number> {
  const normalized = code.trim().toUpperCase();
  for (let i = 0; i < hashes.length; i++) {
    if (await bcrypt.compare(normalized, hashes[i])) return i;
  }
  return -1;
}
