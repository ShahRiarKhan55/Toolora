/**
 * Bounded TTL cache with in-flight de-duplication. Best-effort only: on serverless hosts (Vercel) it
 * lives and dies with a warm function instance, so callers must work with an empty cache.
 * ponytail: in-memory; swap for an external cache behind this same `getOrLoad` if one is ever added.
 */
export class TtlCache<T> {
  private readonly entries = new Map<string, { value: T; expiresAt: number }>();
  private readonly inFlight = new Map<string, Promise<T>>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries = 64,
    private readonly now: () => number = Date.now,
  ) {}

  /** Returns the cached value (`cached: true`) or loads it once, however many callers ask at once.
   *  A failed load is not cached and rejects every waiting caller. */
  async getOrLoad(key: string, load: () => Promise<T>): Promise<{ value: T; cached: boolean }> {
    const hit = this.entries.get(key);
    if (hit && hit.expiresAt > this.now()) return { value: hit.value, cached: true };

    let pending = this.inFlight.get(key);
    if (!pending) {
      pending = load()
        .then((value) => {
          this.set(key, value);
          return value;
        })
        .finally(() => this.inFlight.delete(key));
      this.inFlight.set(key, pending);
    }
    return { value: await pending, cached: false };
  }

  private set(key: string, value: T): void {
    this.entries.delete(key);
    // Map iterates in insertion order, so the first key is the oldest.
    while (this.entries.size >= this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }
    this.entries.set(key, { value, expiresAt: this.now() + this.ttlMs });
  }
}
