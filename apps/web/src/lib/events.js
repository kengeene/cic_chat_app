// Must match apps/server/src/realtime/events.js.
export const CLIENT_EVENTS = Object.freeze({
  MESSAGE_SEND: 'message:send',
});

export const SERVER_EVENTS = Object.freeze({
  MESSAGE_NEW: 'message:new',
  PRESENCE_UPDATE: 'presence:update',
  CONVERSATION_NEW: 'conversation:new',
});
