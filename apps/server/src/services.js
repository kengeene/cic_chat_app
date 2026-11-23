import { usersRepository } from './modules/users/users.repository.js';
import { conversationsRepository } from './modules/conversations/conversations.repository.js';
import { messagesRepository } from './modules/messages/messages.repository.js';
import { createAuthService } from './modules/auth/auth.service.js';
import { createUsersService } from './modules/users/users.service.js';
import { createConversationsService } from './modules/conversations/conversations.service.js';
import { createMessagesService } from './modules/messages/messages.service.js';

/** Composition root for the service layer: shared by REST controllers and socket handlers. */
export const createServices = ({ presence, notifyConversationCreated }) => ({
  authService: createAuthService({ usersRepository }),
  usersService: createUsersService({ usersRepository, presence }),
  conversationsService: createConversationsService({
    conversationsRepository,
    messagesRepository,
    usersRepository,
    presence,
    notifyConversationCreated,
  }),
  messagesService: createMessagesService({ messagesRepository, conversationsRepository }),
});
