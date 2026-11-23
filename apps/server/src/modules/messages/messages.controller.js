export const createMessagesController = (messagesService) => ({
  list: async (req, res) => {
    const { cursor, limit } = req.validated.query;
    const page = await messagesService.listPage({ conversationId: req.validated.params.id, userId: req.user.id, cursor, limit });
    res.json(page);
  },
});
