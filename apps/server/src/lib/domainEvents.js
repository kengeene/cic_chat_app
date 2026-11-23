import { EventEmitter } from 'node:events';

/** Lets services announce changes without depending on Socket.IO; the realtime layer subscribes. */
export const domainEvents = new EventEmitter();

export const CONVERSATION_CREATED = 'conversationCreated';
