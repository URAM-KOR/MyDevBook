const db = require('../utils/db');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class Notification {
  static create(notificationData) {
    try {
      const id = uuidv4();
      const { userId, trackingId, type, payload = {} } = notificationData;

      const stmt = db.prepare(`
        INSERT INTO notifications (id, user_id, tracking_id, type, payload)
        VALUES (?, ?, ?, ?, ?)
      `);

      const payloadJson = JSON.stringify(payload);
      stmt.run(id, userId, trackingId, type, payloadJson);
      logger.logDatabase('INSERT', 'notifications', { id, userId, type });

      return this.findById(id);
    } catch (error) {
      logger.logError(error, { model: 'Notification', operation: 'create' });
      throw error;
    }
  }

  static findById(id) {
    try {
      const stmt = db.prepare('SELECT * FROM notifications WHERE id = ?');
      const notification = stmt.get(id);
      if (notification && notification.payload) {
        notification.payload = JSON.parse(notification.payload);
      }
      return notification || null;
    } catch (error) {
      logger.logError(error, { model: 'Notification', operation: 'findById', id });
      throw error;
    }
  }

  static findByUserId(userId, options = {}) {
    try {
      const { unreadOnly = false, limit = null } = options;
      let query = 'SELECT * FROM notifications WHERE user_id = ?';
      const params = [userId];

      if (unreadOnly) {
        query += ' AND read = 0';
      }

      query += ' ORDER BY created_at DESC';

      if (limit) {
        query += ' LIMIT ?';
        params.push(limit);
      }

      const stmt = db.prepare(query);
      const notifications = stmt.all(...params);

      // payload JSON 파싱
      return notifications.map(notif => {
        if (notif.payload) {
          notif.payload = JSON.parse(notif.payload);
        }
        return notif;
      });
    } catch (error) {
      logger.logError(error, { model: 'Notification', operation: 'findByUserId', userId });
      throw error;
    }
  }

  static markAsRead(id) {
    try {
      const stmt = db.prepare(`
        UPDATE notifications 
        SET read = 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      stmt.run(id);
      logger.logDatabase('UPDATE', 'notifications', { id, action: 'markAsRead' });

      return this.findById(id);
    } catch (error) {
      logger.logError(error, { model: 'Notification', operation: 'markAsRead', id });
      throw error;
    }
  }

  static markAsSent(id) {
    try {
      const stmt = db.prepare(`
        UPDATE notifications 
        SET sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      stmt.run(id);
      logger.logDatabase('UPDATE', 'notifications', { id, action: 'markAsSent' });

      return this.findById(id);
    } catch (error) {
      logger.logError(error, { model: 'Notification', operation: 'markAsSent', id });
      throw error;
    }
  }

  static delete(id) {
    try {
      const stmt = db.prepare('DELETE FROM notifications WHERE id = ?');
      const result = stmt.run(id);
      logger.logDatabase('DELETE', 'notifications', { id, changes: result.changes });
      return result.changes > 0;
    } catch (error) {
      logger.logError(error, { model: 'Notification', operation: 'delete', id });
      throw error;
    }
  }
}

module.exports = Notification;

