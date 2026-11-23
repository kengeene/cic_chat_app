import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import * as usersController from './users.controller.js';
import { searchUsersRequest } from './users.schemas.js';

export const usersRouter = Router();

usersRouter.get('/', authenticate, validate(searchUsersRequest), usersController.search);
