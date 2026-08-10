const db = require('../../config/db');

class UserRepository {
  async findByEmail(email) {
    const { rows } = await db.query(
      'SELECT id, full_name, email, password_hash, role, is_active FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  }

  async findById(id) {
    const { rows } = await db.query(
      'SELECT id, full_name, email, role, is_active FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }

  async create({ fullName, email, passwordHash, role }) {
    const { rows } = await db.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, role, is_active, created_at`,
      [fullName, email, passwordHash, role]
    );
    return rows[0];
  }
}

module.exports = new UserRepository();
