import * as messagesService from './messages.service.js';

export const list = async (req, res) => {
  const { cursor, limit } = req.validated.query;
  res.json(await messagesService.listPage({ conversationId: req.validated.params.id, userId: req.user.id, cursor, limit }));
};
