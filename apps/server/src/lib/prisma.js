import { PrismaClient } from '@prisma/client';

// passwordHash is never returned unless a query explicitly opts in (login only).
export const prisma = new PrismaClient({ omit: { user: { passwordHash: true } } });

export const isUniqueViolation = (error) => error?.code === 'P2002';
