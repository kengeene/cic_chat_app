import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { loginRateLimiter } from '../../middleware/rateLimiters.js';
import * as authController from './auth.controller.js';
import { loginRequest, registerRequest } from './auth.schemas.js';

export const authRouter = Router();

authRouter.post('/register', validate(registerRequest), authController.register);
authRouter.post('/login', loginRateLimiter, validate(loginRequest), authController.login);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', authenticate, authController.me);
