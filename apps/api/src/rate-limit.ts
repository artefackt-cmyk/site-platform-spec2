export type RateLimitResult =
  | {
      readonly allowed: true;
    }
  | {
      readonly allowed: false;
      readonly retryAfterSeconds: number;
    };

export type RateLimiter = {
  readonly consume: (key: string) => RateLimitResult;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export class InMemoryRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, RateLimitBucket>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number
  ) {}

  consume(key: string): RateLimitResult {
    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (bucket === undefined || bucket.resetAt <= now) {
      this.buckets.set(key, {
        count: 1,
        resetAt: now + this.windowMs
      });

      return {
        allowed: true
      };
    }

    if (bucket.count >= this.limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000)
      };
    }

    bucket.count += 1;

    return {
      allowed: true
    };
  }
}
