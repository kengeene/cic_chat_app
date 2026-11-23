import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { createMessagesController } from './messages.controller.js';
import { listMessagesRequest } from './messages.schemas.js';

/** Mounted under /conversations. */
export const createMessagesRouter = (messagesService) => {
  const controller = createMessagesController(messagesService);
  const router = Router();

  router.get('/:id/messages', authenticate, validate(listMessagesRequest), controller.list);

  return router;
};
