import { describe, expect, it, vi } from "vitest";
import { InMemoryRateLimiter } from "./rate-limit";

describe("InMemoryRateLimiter", () => {
  it("rejects requests after the limit is reached", () => {
    const limiter = new InMemoryRateLimiter(2, 1_000);

    expect(limiter.consume("login:a").allowed).toBe(true);
    expect(limiter.consume("login:a").allowed).toBe(true);
    expect(limiter.consume("login:a").allowed).toBe(false);
  });

  it("resets after the window", () => {
    vi.useFakeTimers();

    try {
      const limiter = new InMemoryRateLimiter(1, 1_000);

      expect(limiter.consume("register:a").allowed).toBe(true);
      expect(limiter.consume("register:a").allowed).toBe(false);
      vi.advanceTimersByTime(1_001);
      expect(limiter.consume("register:a").allowed).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("tracks independent keys", () => {
    const limiter = new InMemoryRateLimiter(1, 1_000);

    expect(limiter.consume("reset:a").allowed).toBe(true);
    expect(limiter.consume("reset:b").allowed).toBe(true);
    expect(limiter.consume("reset:a").allowed).toBe(false);
  });
});
