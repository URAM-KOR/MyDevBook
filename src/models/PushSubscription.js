const db = require('../utils/db');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class PushSubscription {
  static async create(subscriptionData) {
    try {
      const id = uuidv4();
      const { userId, endpoint, keys } = subscriptionData;

      const keysJson = JSON.stringify(keys);

      const stmt = db.prepare(`
        INSERT INTO push_subscriptions (id, user_id, endpoint, keys)
        VALUES ($1, $2, $3, $4)
      `);

      await stmt.run(id, userId, endpoint, keysJson);
      logger.logDatabase('INSERT', 'push_subscriptions', { id, userId });

      return await this.findById(id);
    } catch (error) {
      logger.logError(error, { model: 'PushSubscription', operation: 'create' });
      throw error;
    }
  }

  static async findById(id) {
    try {
      const stmt = db.prepare('SELECT * FROM push_subscriptions WHERE id = $1');
      const subscription = await stmt.get(id);
      if (subscription && subscription.keys) {
        subscription.keys = typeof subscription.keys === 'string'
          ? JSON.parse(subscription.keys)
          : subscription.keys;
      }
      return subscription || null;
    } catch (error) {
      logger.logError(error, { model: 'PushSubscription', operation: 'findById', id });
      throw error;
    }
  }

  static async findByUserId(userId) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM push_subscriptions 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `);
      const subscriptions = await stmt.all(userId);

      // keys JSON 파싱
      return subscriptions.map(sub => {
        if (sub.keys) {
          sub.keys = typeof sub.keys === 'string'
            ? JSON.parse(sub.keys)
            : sub.keys;
        }
        return sub;
      });
    } catch (error) {
      logger.logError(error, { model: 'PushSubscription', operation: 'findByUserId', userId });
      throw error;
    }
  }

  static async findAll() {
    try {
      const stmt = db.prepare('SELECT * FROM push_subscriptions ORDER BY created_at DESC');
      const subscriptions = await stmt.all();

      // keys JSON 파싱
      return subscriptions.map(sub => {
        if (sub.keys) {
          sub.keys = typeof sub.keys === 'string'
            ? JSON.parse(sub.keys)
            : sub.keys;
        }
        return sub;
      });
    } catch (error) {
      logger.logError(error, { model: 'PushSubscription', operation: 'findAll' });
      throw error;
    }
  }

  static async update(id, updateData) {
    try {
      const { endpoint, keys } = updateData;
      const fields = [];
      const values = [];
      let paramIndex = 1;

      if (endpoint !== undefined) {
        fields.push(`endpoint = $${paramIndex++}`);
        values.push(endpoint);
      }
      if (keys !== undefined) {
        fields.push(`keys = $${paramIndex++}`);
        values.push(JSON.stringify(keys));
      }

      if (fields.length === 0) {
        return await this.findById(id);
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const sql = `
        UPDATE push_subscriptions 
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
      `;

      await db.run(sql, values);
      logger.logDatabase('UPDATE', 'push_subscriptions', { id });

      return await this.findById(id);
    } catch (error) {
      logger.logError(error, { model: 'PushSubscription', operation: 'update', id });
      throw error;
    }
  }

  static async delete(id) {
    try {
      const stmt = db.prepare('DELETE FROM push_subscriptions WHERE id = $1');
      const result = await stmt.run(id);
      logger.logDatabase('DELETE', 'push_subscriptions', { id, changes: result.changes });
      return result.changes > 0;
    } catch (error) {
      logger.logError(error, { model: 'PushSubscription', operation: 'delete', id });
      throw error;
    }
  }
}

module.exports = PushSubscription;
