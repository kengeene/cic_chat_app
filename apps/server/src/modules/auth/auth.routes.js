import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { loginRateLimiter } from '../../middleware/rateLimiters.js';
import { createAuthController } from './auth.controller.js';
import { loginRequest, registerRequest } from './auth.schemas.js';

export const createAuthRouter = (authService) => {
  const controller = createAuthController(authService);
  const router = Router();

  router.post('/register', validate(registerRequest), controller.register);
  router.post('/login', loginRateLimiter, validate(loginRequest), controller.login);
  router.post('/logout', controller.logout);
  router.get('/me', authenticate, controller.me);

  return router;
};
