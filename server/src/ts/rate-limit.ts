import type { Request } from "express";

/**
 * A simple per-key limit: no more than `limit` hits in any `window` milliseconds. Kept in memory, which is fine for
 * what it is for: stopping one address from creating games (or guessing passwords) in a tight loop.
 */
export class RateLimiter {
  private readonly limit: number;
  private readonly window: number;
  private readonly hits = new Map<string, number[]>();

  public constructor(limit: number, window: number) {
    this.limit = limit;
    this.window = window;
  }

  /**
   * Record a hit for the key, returning false (and not recording it) if the key is over its limit.
   */
  public allow(key: string, now: number = Date.now()): boolean {
    const recent = (this.hits.get(key) ?? []).filter(
      (time) => now - time < this.window,
    );
    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }

  /**
   * Forget keys with no recent hits, so the map doesn't grow forever.
   */
  public prune(now: number = Date.now()): void {
    for (const [key, times] of this.hits) {
      if (times.every((time) => now - time >= this.window)) {
        this.hits.delete(key);
      }
    }
  }
}

/**
 * The address a request came from. Behind a proxy (Apache), the proxy adds the address it saw to the end of
 * X-Forwarded-For, so the last entry is the one to trust: anything before it the client could have written itself.
 */
export const clientAddress = (req: Request): string => {
  const forwarded = req.headers["x-forwarded-for"];
  const header = Array.isArray(forwarded) ? forwarded.join(",") : forwarded;
  if (header !== undefined && header.trim() !== "") {
    const entries = header.split(",").map((entry) => entry.trim());
    const last = entries[entries.length - 1];
    if (last !== undefined && last !== "") {
      return last;
    }
  }
  return req.socket.remoteAddress ?? "unknown";
};
