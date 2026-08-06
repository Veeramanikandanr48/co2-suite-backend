/**
 * SingleFlight — Thundering Herd (Stampede) Protection
 *
 * Ensures that for any given key, only one in-flight asynchronous operation
 * (e.g. database query or expensive factor resolution) is executed concurrently.
 * All subsequent callers requesting the same key wait for the result of the
 * initial call, preventing database stampedes during cache misses.
 */
export class SingleFlightGroup<T> {
  private inFlight = new Map<string, Promise<T>>();

  /**
   * Executes `fn` if no call for `key` is currently in-flight.
   * If a call for `key` is already in-flight, returns the existing Promise.
   */
  async do(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key);
    if (existing) {
      return existing;
    }

    const promise = (async () => {
      try {
        return await fn();
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }

  /**
   * Returns the count of currently in-flight calls.
   */
  get activeCount(): number {
    return this.inFlight.size;
  }

  /**
   * Forcibly clears all in-flight promises.
   */
  clear(): void {
    this.inFlight.clear();
  }
}
