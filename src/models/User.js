const db = require('../utils/db');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class User {
  static async create(userData) {
    try {
      const id = uuidv4();
      const { name, email, providerId, provider = 'google' } = userData;

      const stmt = db.prepare(`
        INSERT INTO users (id, name, email, provider_id, provider)
        VALUES ($1, $2, $3, $4, $5)
      `);

      await stmt.run(id, name, email, providerId, provider);
      logger.logDatabase('INSERT', 'users', { id, email });

      return await this.findById(id);
    } catch (error) {
      logger.logError(error, { model: 'User', operation: 'create' });
      throw error;
    }
  }

  static async findById(id) {
    try {
      const stmt = db.prepare('SELECT * FROM users WHERE id = $1');
      const user = await stmt.get(id);
      return user || null;
    } catch (error) {
      logger.logError(error, { model: 'User', operation: 'findById', id });
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const stmt = db.prepare('SELECT * FROM users WHERE email = $1');
      const user = await stmt.get(email);
      return user || null;
    } catch (error) {
      logger.logError(error, { model: 'User', operation: 'findByEmail', email });
      throw error;
    }
  }

  static async findByProviderId(providerId) {
    try {
      const stmt = db.prepare('SELECT * FROM users WHERE provider_id = $1');
      const user = await stmt.get(providerId);
      return user || null;
    } catch (error) {
      logger.logError(error, { model: 'User', operation: 'findByProviderId', providerId });
      throw error;
    }
  }

  static async update(id, updateData) {
    try {
      const { name, email } = updateData;
      const fields = [];
      const values = [];
      let paramIndex = 1;

      if (name !== undefined) {
        fields.push(`name = $${paramIndex++}`);
        values.push(name);
      }
      if (email !== undefined) {
        fields.push(`email = $${paramIndex++}`);
        values.push(email);
      }

      if (fields.length === 0) {
        return await this.findById(id);
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const sql = `
        UPDATE users 
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
      `;

      await db.run(sql, values);
      logger.logDatabase('UPDATE', 'users', { id });

      return await this.findById(id);
    } catch (error) {
      logger.logError(error, { model: 'User', operation: 'update', id });
      throw error;
    }
  }

  static async delete(id) {
    try {
      const stmt = db.prepare('DELETE FROM users WHERE id = $1');
      const result = await stmt.run(id);
      logger.logDatabase('DELETE', 'users', { id, changes: result.changes });
      return result.changes > 0;
    } catch (error) {
      logger.logError(error, { model: 'User', operation: 'delete', id });
      throw error;
    }
  }
}

module.exports = User;
