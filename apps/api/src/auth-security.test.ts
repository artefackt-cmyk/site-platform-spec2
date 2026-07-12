import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./auth-security";

describe("auth password security", () => {
  it("verifies a valid password", async () => {
    const hash = await hashPassword("development123");

    await expect(verifyPassword(hash, "development123")).resolves.toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("development123");

    await expect(verifyPassword(hash, "development124")).resolves.toBe(false);
  });

  it("creates different hashes for the same password", async () => {
    const firstHash = await hashPassword("development123");
    const secondHash = await hashPassword("development123");

    expect(firstHash).not.toBe(secondHash);
  });

  it("rejects malformed hashes safely", async () => {
    await expect(verifyPassword("not-an-argon2-hash", "development123")).resolves.toBe(
      false
    );
  });
});
