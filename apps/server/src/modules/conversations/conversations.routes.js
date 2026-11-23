import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import * as conversationsController from './conversations.controller.js';
import { createDirectRequest, createGroupRequest, markReadRequest } from './conversations.schemas.js';

export const conversationsRouter = Router();

conversationsRouter.use(authenticate);
conversationsRouter.get('/', conversationsController.list);
conversationsRouter.post('/direct', validate(createDirectRequest), conversationsController.createDirect);
conversationsRouter.post('/group', validate(createGroupRequest), conversationsController.createGroup);
conversationsRouter.post('/:id/read', validate(markReadRequest), conversationsController.markRead);
