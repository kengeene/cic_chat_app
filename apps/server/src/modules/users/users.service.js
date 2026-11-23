import { toPublicUser } from './users.mapper.js';

const DIRECTORY_PAGE_SIZE = 50;

/** @param {{ usersRepository: object, presence: { isOnline(userId: string): boolean } }} deps */
export const createUsersService = ({ usersRepository, presence }) => ({
  async searchDirectory(currentUserId, search) {
    const users = await usersRepository.search({ search, excludeUserId: currentUserId, limit: DIRECTORY_PAGE_SIZE });
    return users.map((user) => ({ ...toPublicUser(user), isOnline: presence.isOnline(user.id) }));
  },

  markLastSeen: (userId, lastSeenAt) => usersRepository.updateLastSeenAt(userId, lastSeenAt),
});
