const db = require('../utils/db');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class Portfolio {
  static async create(portfolioData) {
    try {
      const id = uuidv4();
      const { userId, title, content, status = 'active', order = 0, imageUrl } = portfolioData;

      const stmt = db.prepare(`
        INSERT INTO portfolios (id, user_id, title, content, status, "order", image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `);

      await stmt.run(id, userId, title, content, status, order, imageUrl || null);
      logger.logDatabase('INSERT', 'portfolios', { id, userId, title });

      return await this.findById(id);
    } catch (error) {
      logger.logError(error, { model: 'Portfolio', operation: 'create' });
      throw error;
    }
  }

  static async findById(id) {
    try {
      const stmt = db.prepare('SELECT * FROM portfolios WHERE id = $1');
      const portfolio = await stmt.get(id);
      return portfolio || null;
    } catch (error) {
      logger.logError(error, { model: 'Portfolio', operation: 'findById', id });
      throw error;
    }
  }

  static async findByUserId(userId) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM portfolios 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `);
      const portfolios = await stmt.all(userId);
      return portfolios;
    } catch (error) {
      logger.logError(error, { model: 'Portfolio', operation: 'findByUserId', userId });
      throw error;
    }
  }

  static async getMaxOrder(userId) {
    try {
      const stmt = db.prepare(`
        SELECT MAX("order") as max_order 
        FROM portfolios 
        WHERE user_id = $1
      `);
      const result = await stmt.get(userId);
      return result?.max_order ?? -1;
    } catch (error) {
      logger.logError(error, { model: 'Portfolio', operation: 'getMaxOrder', userId });
      return -1;
    }
  }

  static async findAll() {
    try {
      const stmt = db.prepare('SELECT * FROM portfolios ORDER BY created_at DESC');
      const portfolios = await stmt.all();
      return portfolios;
    } catch (error) {
      logger.logError(error, { model: 'Portfolio', operation: 'findAll' });
      throw error;
    }
  }

  static async update(id, updateData) {
    try {
      const { title, content, status, order, imageUrl } = updateData;
      const fields = [];
      const values = [];
      let paramIndex = 1;

      if (title !== undefined) {
        fields.push(`title = $${paramIndex++}`);
        values.push(title);
      }
      if (content !== undefined) {
        fields.push(`content = $${paramIndex++}`);
        values.push(content);
      }
      if (status !== undefined) {
        fields.push(`status = $${paramIndex++}`);
        values.push(status);
      }
      if (order !== undefined) {
        fields.push(`"order" = $${paramIndex++}`);
        values.push(order);
      }
      if (imageUrl !== undefined) {
        fields.push(`image_url = $${paramIndex++}`);
        values.push(imageUrl);
      }

      if (fields.length === 0) {
        return await this.findById(id);
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const sql = `
        UPDATE portfolios 
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
      `;

      await db.run(sql, values);
      logger.logDatabase('UPDATE', 'portfolios', { id });

      return await this.findById(id);
    } catch (error) {
      logger.logError(error, { model: 'Portfolio', operation: 'update', id });
      throw error;
    }
  }

  static async delete(id) {
    try {
      const stmt = db.prepare('DELETE FROM portfolios WHERE id = $1');
      const result = await stmt.run(id);
      logger.logDatabase('DELETE', 'portfolios', { id, changes: result.changes });
      return result.changes > 0;
    } catch (error) {
      logger.logError(error, { model: 'Portfolio', operation: 'delete', id });
      throw error;
    }
  }
}

module.exports = Portfolio;
