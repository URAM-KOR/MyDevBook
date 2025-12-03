const db = require('../utils/db');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class PortfolioTracking {
  static create(trackingData) {
    try {
      const id = uuidv4();
      const { portfolioId, url, logicPrompt } = trackingData;

      const stmt = db.prepare(`
        INSERT INTO portfolio_trackings (id, portfolio_id, url, logic_prompt)
        VALUES (?, ?, ?, ?)
      `);

      stmt.run(id, portfolioId, url, logicPrompt);
      logger.logDatabase('INSERT', 'portfolio_trackings', { id, portfolioId, url });

      return this.findById(id);
    } catch (error) {
      logger.logError(error, { model: 'PortfolioTracking', operation: 'create' });
      throw error;
    }
  }

  static findById(id) {
    try {
      const stmt = db.prepare('SELECT * FROM portfolio_trackings WHERE id = ?');
      const tracking = stmt.get(id);
      return tracking || null;
    } catch (error) {
      logger.logError(error, { model: 'PortfolioTracking', operation: 'findById', id });
      throw error;
    }
  }

  static findByPortfolioId(portfolioId) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM portfolio_trackings 
        WHERE portfolio_id = ? 
        ORDER BY created_at DESC
      `);
      const trackings = stmt.all(portfolioId);
      return trackings;
    } catch (error) {
      logger.logError(error, { model: 'PortfolioTracking', operation: 'findByPortfolioId', portfolioId });
      throw error;
    }
  }

  static findAll() {
    try {
      const stmt = db.prepare('SELECT * FROM portfolio_trackings ORDER BY created_at DESC');
      const trackings = stmt.all();
      return trackings;
    } catch (error) {
      logger.logError(error, { model: 'PortfolioTracking', operation: 'findAll' });
      throw error;
    }
  }

  static findPendingChecks() {
    try {
      // 마지막 확인이 없거나 1시간 이상 지난 항목들
      const stmt = db.prepare(`
        SELECT * FROM portfolio_trackings 
        WHERE last_checked_at IS NULL 
           OR datetime(last_checked_at) < datetime('now', '-1 hour')
        ORDER BY last_checked_at ASC NULLS FIRST
      `);
      const trackings = stmt.all();
      return trackings;
    } catch (error) {
      logger.logError(error, { model: 'PortfolioTracking', operation: 'findPendingChecks' });
      throw error;
    }
  }

  static updateStatus(id, status) {
    try {
      const stmt = db.prepare(`
        UPDATE portfolio_trackings 
        SET last_status = ?, 
            last_checked_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      stmt.run(status, id);
      logger.logDatabase('UPDATE', 'portfolio_trackings', { id, status });

      return this.findById(id);
    } catch (error) {
      logger.logError(error, { model: 'PortfolioTracking', operation: 'updateStatus', id });
      throw error;
    }
  }

  static update(id, updateData) {
    try {
      const { url, logicPrompt } = updateData;
      const fields = [];
      const values = [];

      if (url !== undefined) {
        fields.push('url = ?');
        values.push(url);
      }
      if (logicPrompt !== undefined) {
        fields.push('logic_prompt = ?');
        values.push(logicPrompt);
      }

      if (fields.length === 0) {
        return this.findById(id);
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const stmt = db.prepare(`
        UPDATE portfolio_trackings 
        SET ${fields.join(', ')}
        WHERE id = ?
      `);

      stmt.run(...values);
      logger.logDatabase('UPDATE', 'portfolio_trackings', { id });

      return this.findById(id);
    } catch (error) {
      logger.logError(error, { model: 'PortfolioTracking', operation: 'update', id });
      throw error;
    }
  }

  static delete(id) {
    try {
      const stmt = db.prepare('DELETE FROM portfolio_trackings WHERE id = ?');
      const result = stmt.run(id);
      logger.logDatabase('DELETE', 'portfolio_trackings', { id, changes: result.changes });
      return result.changes > 0;
    } catch (error) {
      logger.logError(error, { model: 'PortfolioTracking', operation: 'delete', id });
      throw error;
    }
  }
}

module.exports = PortfolioTracking;

