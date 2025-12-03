const db = require('../utils/db');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class User {
  static create(userData) {
    try {
      const id = uuidv4();
      const { name, email, providerId, provider = 'google' } = userData;

      const stmt = db.prepare(`
        INSERT INTO users (id, name, email, provider_id, provider)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(id, name, email, providerId, provider);
      logger.logDatabase('INSERT', 'users', { id, email });

      return this.findById(id);
    } catch (error) {
      logger.logError(error, { model: 'User', operation: 'create' });
      throw error;
    }
  }

  static findById(id) {
    try {
      const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
      const user = stmt.get(id);
      return user || null;
    } catch (error) {
      logger.logError(error, { model: 'User', operation: 'findById', id });
      throw error;
    }
  }

  static findByEmail(email) {
    try {
      const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
      const user = stmt.get(email);
      return user || null;
    } catch (error) {
      logger.logError(error, { model: 'User', operation: 'findByEmail', email });
      throw error;
    }
  }

  static findByProviderId(providerId) {
    try {
      const stmt = db.prepare('SELECT * FROM users WHERE provider_id = ?');
      const user = stmt.get(providerId);
      return user || null;
    } catch (error) {
      logger.logError(error, { model: 'User', operation: 'findByProviderId', providerId });
      throw error;
    }
  }

  static update(id, updateData) {
    try {
      const { name, email } = updateData;
      const fields = [];
      const values = [];

      if (name !== undefined) {
        fields.push('name = ?');
        values.push(name);
      }
      if (email !== undefined) {
        fields.push('email = ?');
        values.push(email);
      }

      if (fields.length === 0) {
        return this.findById(id);
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const stmt = db.prepare(`
        UPDATE users 
        SET ${fields.join(', ')}
        WHERE id = ?
      `);

      stmt.run(...values);
      logger.logDatabase('UPDATE', 'users', { id });

      return this.findById(id);
    } catch (error) {
      logger.logError(error, { model: 'User', operation: 'update', id });
      throw error;
    }
  }

  static delete(id) {
    try {
      const stmt = db.prepare('DELETE FROM users WHERE id = ?');
      const result = stmt.run(id);
      logger.logDatabase('DELETE', 'users', { id, changes: result.changes });
      return result.changes > 0;
    } catch (error) {
      logger.logError(error, { model: 'User', operation: 'delete', id });
      throw error;
    }
  }
}

module.exports = User;

