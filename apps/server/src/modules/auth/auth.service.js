import bcrypt from 'bcryptjs';
import { AppError } from '../../lib/AppError.js';
import { signSessionToken } from '../../lib/jwt.js';
import { prisma } from '../../lib/prisma.js';

const BCRYPT_ROUNDS = 10;
// Compared against when the email is unknown, so both failure paths take the same time.
const TIMING_SAFE_DUMMY_HASH = bcrypt.hashSync('timing-safe-dummy-password', BCRYPT_ROUNDS);

const toSession = (user) => ({ user, token: signSessionToken(user.id) });

export const register = async ({ email, displayName, password }) => {
  if (await prisma.user.findUnique({ where: { email } })) {
    throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
  }
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  return toSession(await prisma.user.create({ data: { email, displayName, passwordHash } }));
};

export const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email }, omit: { passwordHash: false } });
  const isPasswordValid = await bcrypt.compare(password, user?.passwordHash ?? TIMING_SAFE_DUMMY_HASH);
  if (!user || !isPasswordValid) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');

  const { passwordHash, ...publicUser } = user;
  return toSession(publicUser);
};

export const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(401, 'UNAUTHENTICATED', 'Please sign in');
  return user;
};
