import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import * as messagesController from './messages.controller.js';
import { listMessagesRequest } from './messages.schemas.js';

/** Mounted under /conversations. */
export const messagesRouter = Router();

messagesRouter.get('/:id/messages', authenticate, validate(listMessagesRequest), messagesController.list);
