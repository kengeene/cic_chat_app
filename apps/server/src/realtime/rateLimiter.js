/** Fixed-window, in-memory limiter keyed by user id (single server). */
export const createRateLimiter = ({ limit, windowMs }) => {
  const windows = new Map();

  return {
    /** @returns {boolean} false when the key has exceeded its limit for the current window */
    tryConsume(key, now = Date.now()) {
      const window = windows.get(key);
      if (!window || now - window.startedAt >= windowMs) {
        windows.set(key, { startedAt: now, count: 1 });
        return true;
      }
      window.count += 1;
      return window.count <= limit;
    },
  };
};
