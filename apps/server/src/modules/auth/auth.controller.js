import { clearSessionCookie, setSessionCookie } from '../../lib/sessionCookie.js';

export const createAuthController = (authService) => ({
  register: async (req, res) => {
    const { user, token } = await authService.register(req.validated.body);
    setSessionCookie(res, token);
    res.status(201).json({ user });
  },

  login: async (req, res) => {
    const { user, token } = await authService.login(req.validated.body);
    setSessionCookie(res, token);
    res.json({ user });
  },

  logout: (req, res) => {
    clearSessionCookie(res);
    res.status(204).end();
  },

  me: async (req, res) => {
    res.json({ user: await authService.getCurrentUser(req.user.id) });
  },
});
