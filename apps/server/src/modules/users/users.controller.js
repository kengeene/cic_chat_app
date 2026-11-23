export const createUsersController = (usersService) => ({
  search: async (req, res) => {
    const users = await usersService.searchDirectory(req.user.id, req.validated.query.search);
    res.json({ users });
  },
});
