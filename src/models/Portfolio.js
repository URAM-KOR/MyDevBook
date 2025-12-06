const db = require('../utils/db');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class Portfolio {
  static create(portfolioData) {
    try {
      const id = uuidv4();
      const { userId, title, content, status = 'active', order = 0, imageUrl } = portfolioData;

      const stmt = db.prepare(`
        INSERT INTO portfolios (id, user_id, title, content, status, "order", image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(id, userId, title, content, status, order, imageUrl || null);
      logger.logDatabase('INSERT', 'portfolios', { id, userId, title });

      return this.findById(id);
    } catch (error) {
      logger.logError(error, { model: 'Portfolio', operation: 'create' });
      throw error;
    }
  }

  static findById(id) {
    try {
      const stmt = db.prepare('SELECT * FROM portfolios WHERE id = ?');
      const portfolio = stmt.get(id);
      return portfolio || null;
    } catch (error) {
      logger.logError(error, { model: 'Portfolio', operation: 'findById', id });
      throw error;
    }
  }

  static findByUserId(userId) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM portfolios 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `);
      const portfolios = stmt.all(userId);
      return portfolios;
    } catch (error) {
      logger.logError(error, { model: 'Portfolio', operation: 'findByUserId', userId });
      throw error;
    }
  }

  static getMaxOrder(userId) {
    try {
      const stmt = db.prepare(`
        SELECT MAX("order") as max_order 
        FROM portfolios 
        WHERE user_id = ?
      `);
      const result = stmt.get(userId);
      return result?.max_order ?? -1;
    } catch (error) {
      logger.logError(error, { model: 'Portfolio', operation: 'getMaxOrder', userId });
      return -1;
    }
  }

  static findAll() {
    try {
      const stmt = db.prepare('SELECT * FROM portfolios ORDER BY created_at DESC');
      const portfolios = stmt.all();
      return portfolios;
    } catch (error) {
      logger.logError(error, { model: 'Portfolio', operation: 'findAll' });
      throw error;
    }
  }

  static update(id, updateData) {
    try {
      const { title, content, status, order, imageUrl } = updateData;
      const fields = [];
      const values = [];

      if (title !== undefined) {
        fields.push('title = ?');
        values.push(title);
      }
      if (content !== undefined) {
        fields.push('content = ?');
        values.push(content);
      }
      if (status !== undefined) {
        fields.push('status = ?');
        values.push(status);
      }
      if (order !== undefined) {
        fields.push('"order" = ?');
        values.push(order);
      }
      if (imageUrl !== undefined) {
        fields.push('image_url = ?');
        values.push(imageUrl);
      }

      if (fields.length === 0) {
        return this.findById(id);
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const stmt = db.prepare(`
        UPDATE portfolios 
        SET ${fields.join(', ')}
        WHERE id = ?
      `);

      stmt.run(...values);
      logger.logDatabase('UPDATE', 'portfolios', { id });

      return this.findById(id);
    } catch (error) {
      logger.logError(error, { model: 'Portfolio', operation: 'update', id });
      throw error;
    }
  }

  static delete(id) {
    try {
      const stmt = db.prepare('DELETE FROM portfolios WHERE id = ?');
      const result = stmt.run(id);
      logger.logDatabase('DELETE', 'portfolios', { id, changes: result.changes });
      return result.changes > 0;
    } catch (error) {
      logger.logError(error, { model: 'Portfolio', operation: 'delete', id });
      throw error;
    }
  }
}

module.exports = Portfolio;

