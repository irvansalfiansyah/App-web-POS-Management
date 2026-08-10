const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../users/user.repository');
const env = require('../../config/env');
const ApiError = require('../../utils/ApiError');

class AuthService {
  async login(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user || !user.is_active) {
      throw new ApiError(401, 'Incorrect email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Incorrect email or password');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return {
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      },
    };
  }
}

module.exports = new AuthService();
