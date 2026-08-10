const bcrypt = require('bcryptjs');
const userRepository = require('./user.repository');
const ApiError = require('../../utils/ApiError');

class UserService {
  async createUser({ fullName, email, password, role }) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ApiError(409, 'Email is already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    return userRepository.create({ fullName, email, passwordHash, role });
  }

  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  }
}

module.exports = new UserService();
