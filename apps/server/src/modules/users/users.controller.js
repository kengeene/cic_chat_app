import * as usersService from './users.service.js';

export const search = async (req, res) => {
  res.json({ users: await usersService.searchDirectory(req.user.id, req.validated.query.search) });
};
