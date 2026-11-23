/**
 * In-memory presence for a single server: counts open sockets per user so multiple tabs work.
 * Keep this interface small; a Redis-backed store can replace it for multi-server deployments.
 */
export const createPresenceStore = () => {
  const socketCounts = new Map();

  return {
    /** @returns {boolean} true if this is the user's first open socket */
    connect(userId) {
      const count = (socketCounts.get(userId) ?? 0) + 1;
      socketCounts.set(userId, count);
      return count === 1;
    },

    /** @returns {boolean} true if this was the user's last open socket */
    disconnect(userId) {
      const count = socketCounts.get(userId);
      if (count === undefined) return false;
      if (count > 1) {
        socketCounts.set(userId, count - 1);
        return false;
      }
      socketCounts.delete(userId);
      return true;
    },

    isOnline: (userId) => socketCounts.has(userId),

    getOnlineUserIds: () => [...socketCounts.keys()],
  };
};
