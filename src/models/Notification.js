const db = require('../utils/db');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class Notification {
  static async create(notificationData) {
    try {
      const id = uuidv4();
      const { userId, portfolioId, trackingId, type, title, message, payload = {} } = notificationData;

      const stmt = db.prepare(`
        INSERT INTO notifications (id, user_id, portfolio_id, tracking_id, type, title, message, payload)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `);

      const payloadJson = JSON.stringify(payload);
      await stmt.run(id, userId, portfolioId || null, trackingId || null, type, title || null, message || null, payloadJson);
      logger.logDatabase('INSERT', 'notifications', { id, userId, type });

      return await this.findById(id);
    } catch (error) {
      logger.logError(error, { model: 'Notification', operation: 'create' });
      throw error;
    }
  }

  static async findById(id) {
    try {
      const stmt = db.prepare('SELECT * FROM notifications WHERE id = $1');
      const notification = await stmt.get(id);
      if (notification && notification.payload) {
        notification.payload = typeof notification.payload === 'string' 
          ? JSON.parse(notification.payload) 
          : notification.payload;
      }
      return notification || null;
    } catch (error) {
      logger.logError(error, { model: 'Notification', operation: 'findById', id });
      throw error;
    }
  }

  static async findByUserId(userId, options = {}) {
    try {
      const { unreadOnly = false, limit = null } = options;
      let query = 'SELECT * FROM notifications WHERE user_id = $1';
      const params = [userId];
      let paramIndex = 2;

      if (unreadOnly) {
        query += ` AND read = $${paramIndex++}`;
        params.push(false);
      }

      query += ' ORDER BY created_at DESC';

      if (limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(limit);
      }

      const result = await db.query(query, params);
      const notifications = result.rows;

      // payload JSON 파싱
      return notifications.map(notif => {
        if (notif.payload) {
          notif.payload = typeof notif.payload === 'string' 
            ? JSON.parse(notif.payload) 
            : notif.payload;
        }
        return notif;
      });
    } catch (error) {
      logger.logError(error, { model: 'Notification', operation: 'findByUserId', userId });
      throw error;
    }
  }

  static async markAsRead(id) {
    try {
      const stmt = db.prepare(`
        UPDATE notifications 
        SET read = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `);

      await stmt.run(true, id);
      logger.logDatabase('UPDATE', 'notifications', { id, action: 'markAsRead' });

      return await this.findById(id);
    } catch (error) {
      logger.logError(error, { model: 'Notification', operation: 'markAsRead', id });
      throw error;
    }
  }

  static async markAsSent(id) {
    try {
      const stmt = db.prepare(`
        UPDATE notifications 
        SET sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `);

      await stmt.run(id);
      logger.logDatabase('UPDATE', 'notifications', { id, action: 'markAsSent' });

      return await this.findById(id);
    } catch (error) {
      logger.logError(error, { model: 'Notification', operation: 'markAsSent', id });
      throw error;
    }
  }

  static async delete(id) {
    try {
      const stmt = db.prepare('DELETE FROM notifications WHERE id = $1');
      const result = await stmt.run(id);
      logger.logDatabase('DELETE', 'notifications', { id, changes: result.changes });
      return result.changes > 0;
    } catch (error) {
      logger.logError(error, { model: 'Notification', operation: 'delete', id });
      throw error;
    }
  }
}

module.exports = Notification;
