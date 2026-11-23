export const createConversationsController = (conversationsService) => ({
  list: async (req, res) => {
    res.json({ conversations: await conversationsService.listForUser(req.user.id) });
  },

  createDirect: async (req, res) => {
    const conversation = await conversationsService.findOrCreateDirect(req.user.id, req.validated.body.userId);
    res.json({ conversation });
  },

  createGroup: async (req, res) => {
    const conversation = await conversationsService.createGroup(req.user.id, req.validated.body);
    res.status(201).json({ conversation });
  },

  markRead: async (req, res) => {
    await conversationsService.markRead(req.validated.params.id, req.user.id);
    res.status(204).end();
  },
});
