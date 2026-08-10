const userService = require('./user.service');
const asyncHandler = require('../../utils/asyncHandler');

class UserController {
  register = asyncHandler(async (req, res) => {
    const { fullName, email, password, role } = req.body;
    const user = await userService.createUser({ fullName, email, password, role });
    res.status(201).json({ error: false, user });
  });

  getProfile = asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.user.id);
    res.status(200).json({ error: false, user });
  });
}

module.exports = new UserController();
