/**
 * Simple In-Memory Sliding Window / Token Bucket Rate Limiter
 * Provides IP-based request throttling for public endpoints (webhooks, tracking, cron)
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipStore = new Map<string, RateLimitRecord>();

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Checks if the given IP address has exceeded the rate limit.
 * @param ip Client IP address or identifier
 * @param limit Maximum requests permitted in window (default: 10)
 * @param windowMs Window duration in milliseconds (default: 60,000ms = 1 min)
 */
export function checkRateLimit(
  ip: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const record = ipStore.get(ip);

  if (!record || now > record.resetTime) {
    ipStore.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetSeconds: Math.ceil((record.resetTime - now) / 1000),
    };
  }

  record.count++;
  return {
    allowed: true,
    limit,
    remaining: limit - record.count,
    resetSeconds: Math.ceil((record.resetTime - now) / 1000),
  };
}

/**
 * Resets all rate limit counters (for testing)
 */
export function resetRateLimiter(): void {
  ipStore.clear();
}
