import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { createConversationsController } from './conversations.controller.js';
import { createDirectRequest, createGroupRequest, markReadRequest } from './conversations.schemas.js';

export const createConversationsRouter = (conversationsService) => {
  const controller = createConversationsController(conversationsService);
  const router = Router();

  router.use(authenticate);
  router.get('/', controller.list);
  router.post('/direct', validate(createDirectRequest), controller.createDirect);
  router.post('/group', validate(createGroupRequest), controller.createGroup);
  router.post('/:id/read', validate(markReadRequest), controller.markRead);

  return router;
};
