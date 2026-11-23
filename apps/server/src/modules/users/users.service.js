import { prisma } from '../../lib/prisma.js';
import { presenceStore } from '../../lib/presenceStore.js';

const DIRECTORY_PAGE_SIZE = 50;

const matchesSearch = (search) => ({
  OR: [
    { displayName: { contains: search, mode: 'insensitive' } },
    { email: { contains: search, mode: 'insensitive' } },
  ],
});

export const searchDirectory = async (currentUserId, search) => {
  const users = await prisma.user.findMany({
    where: { id: { not: currentUserId }, ...(search && matchesSearch(search)) },
    orderBy: { displayName: 'asc' },
    take: DIRECTORY_PAGE_SIZE,
  });
  return users.map((user) => ({ ...user, isOnline: presenceStore.isOnline(user.id) }));
};

export const markLastSeen = (userId, lastSeenAt) => prisma.user.update({ where: { id: userId }, data: { lastSeenAt } });
