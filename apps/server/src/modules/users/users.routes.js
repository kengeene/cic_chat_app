import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { createUsersController } from './users.controller.js';
import { searchUsersRequest } from './users.schemas.js';

export const createUsersRouter = (usersService) => {
  const controller = createUsersController(usersService);
  const router = Router();

  router.get('/', authenticate, validate(searchUsersRequest), controller.search);

  return router;
};
