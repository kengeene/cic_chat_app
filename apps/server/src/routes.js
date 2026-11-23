import { Router } from 'express';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { createUsersRouter } from './modules/users/users.routes.js';
import { createConversationsRouter } from './modules/conversations/conversations.routes.js';
import { createMessagesRouter } from './modules/messages/messages.routes.js';

export const createApiRouter = ({ authService, usersService, conversationsService, messagesService }) => {
  const router = Router();

  router.use('/auth', createAuthRouter(authService));
  router.use('/users', createUsersRouter(usersService));
  router.use('/conversations', createMessagesRouter(messagesService));
  router.use('/conversations', createConversationsRouter(conversationsService));

  return router;
};
