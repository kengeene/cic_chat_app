import { clearSessionCookie, setSessionCookie } from '../../lib/sessionCookie.js';
import * as authService from './auth.service.js';

export const register = async (req, res) => {
  const { user, token } = await authService.register(req.validated.body);
  setSessionCookie(res, token);
  res.status(201).json({ user });
};

export const login = async (req, res) => {
  const { user, token } = await authService.login(req.validated.body);
  setSessionCookie(res, token);
  res.json({ user });
};

export const logout = (req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
};

export const me = async (req, res) => {
  res.json({ user: await authService.getCurrentUser(req.user.id) });
};
