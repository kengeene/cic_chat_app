// Open sockets per user (multi-tab aware). In-memory, so single-server only; swap for Redis to scale out.
const socketCounts = new Map();

export const presenceStore = {
  /** @returns {boolean} true if this is the user's first open socket */
  connect(userId) {
    const count = (socketCounts.get(userId) ?? 0) + 1;
    socketCounts.set(userId, count);
    return count === 1;
  },

  /** @returns {boolean} true if this was the user's last open socket */
  disconnect(userId) {
    const count = socketCounts.get(userId) ?? 0;
    if (count > 1) socketCounts.set(userId, count - 1);
    else socketCounts.delete(userId);
    return count === 1;
  },

  isOnline: (userId) => socketCounts.has(userId),
};
