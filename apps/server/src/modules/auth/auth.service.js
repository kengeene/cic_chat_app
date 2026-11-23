import bcrypt from 'bcryptjs';
import { AppError } from '../../lib/AppError.js';
import { signSessionToken } from '../../lib/jwt.js';
import { toPublicUser } from '../users/users.mapper.js';

const BCRYPT_ROUNDS = 10;
// Compared against when the email is unknown, so both failure paths take the same time.
const TIMING_SAFE_DUMMY_HASH = bcrypt.hashSync('timing-safe-dummy-password', BCRYPT_ROUNDS);

const invalidCredentials = () => new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');

const toSession = (user) => ({ user: toPublicUser(user), token: signSessionToken(user.id) });

export const createAuthService = ({ usersRepository }) => ({
  async register({ email, displayName, password }) {
    if (await usersRepository.findByEmail(email)) {
      throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    return toSession(await usersRepository.create({ email, displayName, passwordHash }));
  },

  async login({ email, password }) {
    const user = await usersRepository.findByEmail(email);
    const isPasswordValid = await bcrypt.compare(password, user?.passwordHash ?? TIMING_SAFE_DUMMY_HASH);
    if (!user || !isPasswordValid) throw invalidCredentials();
    return toSession(user);
  },

  async getCurrentUser(userId) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new AppError(401, 'UNAUTHENTICATED', 'Please sign in');
    return toPublicUser(user);
  },
});
