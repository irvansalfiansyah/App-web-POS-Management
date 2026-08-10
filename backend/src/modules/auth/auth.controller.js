const authService = require('./auth.service');
const asyncHandler = require('../../utils/asyncHandler');

class AuthController {
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.status(200).json({ error: false, ...result });
  });
}

module.exports = new AuthController();
