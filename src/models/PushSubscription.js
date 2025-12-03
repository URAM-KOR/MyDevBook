const db = require('../utils/db');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class PushSubscription {
  static create(subscriptionData) {
    try {
      const id = uuidv4();
      const { userId, endpoint, keys } = subscriptionData;

      const keysJson = JSON.stringify(keys);

      const stmt = db.prepare(`
        INSERT INTO push_subscriptions (id, user_id, endpoint, keys)
        VALUES (?, ?, ?, ?)
      `);

      stmt.run(id, userId, endpoint, keysJson);
      logger.logDatabase('INSERT', 'push_subscriptions', { id, userId });

      return this.findById(id);
    } catch (error) {
      logger.logError(error, { model: 'PushSubscription', operation: 'create' });
      throw error;
    }
  }

  static findById(id) {
    try {
      const stmt = db.prepare('SELECT * FROM push_subscriptions WHERE id = ?');
      const subscription = stmt.get(id);
      if (subscription && subscription.keys) {
        subscription.keys = JSON.parse(subscription.keys);
      }
      return subscription || null;
    } catch (error) {
      logger.logError(error, { model: 'PushSubscription', operation: 'findById', id });
      throw error;
    }
  }

  static findByUserId(userId) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM push_subscriptions 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `);
      const subscriptions = stmt.all(userId);

      // keys JSON 파싱
      return subscriptions.map(sub => {
        if (sub.keys) {
          sub.keys = JSON.parse(sub.keys);
        }
        return sub;
      });
    } catch (error) {
      logger.logError(error, { model: 'PushSubscription', operation: 'findByUserId', userId });
      throw error;
    }
  }

  static findAll() {
    try {
      const stmt = db.prepare('SELECT * FROM push_subscriptions ORDER BY created_at DESC');
      const subscriptions = stmt.all();

      // keys JSON 파싱
      return subscriptions.map(sub => {
        if (sub.keys) {
          sub.keys = JSON.parse(sub.keys);
        }
        return sub;
      });
    } catch (error) {
      logger.logError(error, { model: 'PushSubscription', operation: 'findAll' });
      throw error;
    }
  }

  static update(id, updateData) {
    try {
      const { endpoint, keys } = updateData;
      const fields = [];
      const values = [];

      if (endpoint !== undefined) {
        fields.push('endpoint = ?');
        values.push(endpoint);
      }
      if (keys !== undefined) {
        fields.push('keys = ?');
        values.push(JSON.stringify(keys));
      }

      if (fields.length === 0) {
        return this.findById(id);
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const stmt = db.prepare(`
        UPDATE push_subscriptions 
        SET ${fields.join(', ')}
        WHERE id = ?
      `);

      stmt.run(...values);
      logger.logDatabase('UPDATE', 'push_subscriptions', { id });

      return this.findById(id);
    } catch (error) {
      logger.logError(error, { model: 'PushSubscription', operation: 'update', id });
      throw error;
    }
  }

  static delete(id) {
    try {
      const stmt = db.prepare('DELETE FROM push_subscriptions WHERE id = ?');
      const result = stmt.run(id);
      logger.logDatabase('DELETE', 'push_subscriptions', { id, changes: result.changes });
      return result.changes > 0;
    } catch (error) {
      logger.logError(error, { model: 'PushSubscription', operation: 'delete', id });
      throw error;
    }
  }
}

module.exports = PushSubscription;

