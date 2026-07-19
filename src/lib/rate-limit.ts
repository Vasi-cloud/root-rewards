/**
 * Browser-only rate limiting simulation (localStorage).
 * Not a substitute for server / Cloud Functions rate limits — demo cooldowns only.
 */

const STORAGE_KEY = "forest-buddies-rate-limit-v1";

export type RateLimitBucket =
  | "auth"
  | "feedback"
  | "report"
  | "support"
  | "checkout"
  | "recommend"
  | "review"
  | "vision";

type BucketState = {
  timestamps: number[];
  lockedUntil?: number;
};

type Store = Partial<Record<RateLimitBucket, BucketState>>;

const LIMITS: Record<
  RateLimitBucket,
  { max: number; windowMs: number; lockMs: number }
> = {
  auth: { max: 8, windowMs: 60_000, lockMs: 30_000 },
  feedback: { max: 3, windowMs: 60_000, lockMs: 45_000 },
  report: { max: 5, windowMs: 60_000, lockMs: 30_000 },
  support: { max: 12, windowMs: 60_000, lockMs: 20_000 },
  checkout: { max: 4, windowMs: 60_000, lockMs: 20_000 },
  recommend: { max: 20, windowMs: 60_000, lockMs: 15_000 },
  review: { max: 5, windowMs: 60_000, lockMs: 30_000 },
  vision: { max: 8, windowMs: 60_000, lockMs: 25_000 },
};

function load(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Store;
  } catch {
    return {};
  }
}

function save(store: Store) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // quota / private mode
  }
}

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSec: number; message: string };

/**
 * Check + record an action. Returns whether the client may proceed.
 */
export function consumeRateLimit(bucket: RateLimitBucket): RateLimitResult {
  if (typeof window === "undefined") {
    return { allowed: true, remaining: LIMITS[bucket].max };
  }

  const now = Date.now();
  const cfg = LIMITS[bucket];
  const store = load();
  const state: BucketState = store[bucket] ?? { timestamps: [] };

  if (state.lockedUntil && state.lockedUntil > now) {
    const retryAfterSec = Math.ceil((state.lockedUntil - now) / 1000);
    return {
      allowed: false,
      retryAfterSec,
      message: `Please wait ${retryAfterSec}s before trying again. (Demo rate limit)`,
    };
  }

  const windowStart = now - cfg.windowMs;
  const recent = state.timestamps.filter((t) => t >= windowStart);

  if (recent.length >= cfg.max) {
    const lockedUntil = now + cfg.lockMs;
    store[bucket] = { timestamps: recent, lockedUntil };
    save(store);
    const retryAfterSec = Math.ceil(cfg.lockMs / 1000);
    return {
      allowed: false,
      retryAfterSec,
      message: `Too many attempts. Please wait ${retryAfterSec}s. (Demo rate limit)`,
    };
  }

  recent.push(now);
  store[bucket] = { timestamps: recent };
  save(store);

  return {
    allowed: true,
    remaining: Math.max(0, cfg.max - recent.length),
  };
}

/** Read-only peek without consuming a slot. */
export function peekRateLimit(bucket: RateLimitBucket): RateLimitResult {
  if (typeof window === "undefined") {
    return { allowed: true, remaining: LIMITS[bucket].max };
  }
  const now = Date.now();
  const cfg = LIMITS[bucket];
  const state = load()[bucket] ?? { timestamps: [] };
  if (state.lockedUntil && state.lockedUntil > now) {
    const retryAfterSec = Math.ceil((state.lockedUntil - now) / 1000);
    return {
      allowed: false,
      retryAfterSec,
      message: `Please wait ${retryAfterSec}s before trying again. (Demo rate limit)`,
    };
  }
  const recent = state.timestamps.filter((t) => t >= now - cfg.windowMs);
  if (recent.length >= cfg.max) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil(cfg.lockMs / 1000),
      message: `Too many attempts. Please wait a moment. (Demo rate limit)`,
    };
  }
  return { allowed: true, remaining: cfg.max - recent.length };
}
