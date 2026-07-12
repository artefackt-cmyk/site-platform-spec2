import { createHash, randomBytes } from "node:crypto";
import argon2 from "argon2";

export const SESSION_TOKEN_BYTES = 32;
export const PASSWORD_RESET_TOKEN_BYTES = 32;

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 64 * 1024,
  timeCost: 3,
  parallelism: 1
} as const;

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(
  passwordHash: string,
  password: string
): Promise<boolean> {
  try {
    return await argon2.verify(passwordHash, password);
  } catch {
    return false;
  }
}

export function generateSessionToken(): string {
  return randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
}

export function generatePasswordResetToken(): string {
  return randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString("base64url");
}

export function hashSecretToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
