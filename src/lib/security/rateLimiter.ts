// Production In-Memory / Sliding-Window Rate Limiter
// Protects against SMS resource exhaustion, OTP brute-forcing, Doorstep OTP guessing, and API spam

interface RateLimitRecord {
  count: number;
  resetAt: number;
  lockedUntil?: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Clean up stale records periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      if (now > record.resetAt && (!record.lockedUntil || now > record.lockedUntil)) {
        memoryStore.delete(key);
      }
    }
  }, 60000);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
  locked?: boolean;
}

/**
 * Checks and increments rate limit for a given key.
 * @param key Unique identifier (e.g. `otp-send:+919848012345` or `ip:192.168.1.1`)
 * @param maxLimit Maximum allowed attempts within windowMs
 * @param windowMs Time window in milliseconds
 * @param lockDurationMs Optional lock duration if limit is breached
 */
export function checkRateLimit(
  key: string,
  maxLimit: number,
  windowMs: number,
  lockDurationMs: number = 0
): RateLimitResult {
  const now = Date.now();
  let record = memoryStore.get(key);

  if (!record || now > record.resetAt) {
    record = {
      count: 1,
      resetAt: now + windowMs,
    };
    memoryStore.set(key, record);
    return {
      allowed: true,
      remaining: maxLimit - 1,
    };
  }

  // Check if locked
  if (record.lockedUntil && now < record.lockedUntil) {
    const retryAfter = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: retryAfter,
      locked: true,
    };
  }

  if (record.count >= maxLimit) {
    if (lockDurationMs > 0 && !record.lockedUntil) {
      record.lockedUntil = now + lockDurationMs;
      const retryAfter = Math.ceil(lockDurationMs / 1000);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: retryAfter,
        locked: true,
      };
    }

    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: retryAfter,
      locked: false,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxLimit - record.count,
  };
}

/**
 * Resets a rate limit counter upon successful validation.
 */
export function resetRateLimit(key: string): void {
  memoryStore.delete(key);
}

/**
 * Helper to extract client IP address from standard headers in Next.js
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}
