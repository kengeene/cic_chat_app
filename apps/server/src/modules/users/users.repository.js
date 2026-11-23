import { prisma } from '../../lib/prisma.js';

const matchesSearch = (search) => ({
  OR: [
    { displayName: { contains: search, mode: 'insensitive' } },
    { email: { contains: search, mode: 'insensitive' } },
  ],
});

export const usersRepository = {
  findById: (id) => prisma.user.findUnique({ where: { id } }),

  findByEmail: (email) => prisma.user.findUnique({ where: { email } }),

  create: ({ email, displayName, passwordHash }) => prisma.user.create({ data: { email, displayName, passwordHash } }),

  search: ({ search, excludeUserId, limit }) =>
    prisma.user.findMany({
      where: { id: { not: excludeUserId }, ...(search && matchesSearch(search)) },
      orderBy: { displayName: 'asc' },
      take: limit,
    }),

  countByIds: (ids) => prisma.user.count({ where: { id: { in: ids } } }),

  updateLastSeenAt: (id, lastSeenAt) => prisma.user.update({ where: { id }, data: { lastSeenAt } }),
};
