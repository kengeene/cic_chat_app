import * as conversationsService from './conversations.service.js';

export const list = async (req, res) => {
  res.json({ conversations: await conversationsService.listForUser(req.user.id) });
};

export const createDirect = async (req, res) => {
  res.json({ conversation: await conversationsService.findOrCreateDirect(req.user.id, req.validated.body.userId) });
};

export const createGroup = async (req, res) => {
  res.status(201).json({ conversation: await conversationsService.createGroup(req.user.id, req.validated.body) });
};

export const markRead = async (req, res) => {
  await conversationsService.markRead(req.validated.params.id, req.user.id);
  res.status(204).end();
};
