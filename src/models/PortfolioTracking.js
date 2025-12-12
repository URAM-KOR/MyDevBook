const db = require('../utils/db');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const { encryptToken, decryptToken } = require('../utils/crypto');

class PortfolioTracking {
  static async create(trackingData) {
    try {
      const id = uuidv4();
      const { portfolioId, url, logicPrompt, authToken, authType, currentValue, targetKey } = trackingData;

      // 토큰 암호화
      const encryptedToken = authToken ? encryptToken(authToken) : null;

      const stmt = db.prepare(`
        INSERT INTO portfolio_trackings (id, portfolio_id, url, logic_prompt, auth_token, auth_type, current_value, target_key)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `);

      await stmt.run(id, portfolioId, url, logicPrompt, encryptedToken, authType || 'none', currentValue || null, targetKey || null);
      logger.logDatabase('INSERT', 'portfolio_trackings', { id, portfolioId, url, hasAuth: !!authToken, currentValue });

      return await this.findById(id);
    } catch (error) {
      logger.logError(error, { model: 'PortfolioTracking', operation: 'create' });
      throw error;
    }
  }

  static async findById(id) {
    try {
      const stmt = db.prepare('SELECT * FROM portfolio_trackings WHERE id = $1');
      const tracking = await stmt.get(id);
      return tracking || null;
    } catch (error) {
      logger.logError(error, { model: 'PortfolioTracking', operation: 'findById', id });
      throw error;
    }
  }

  /**
   * 복호화된 토큰과 함께 조회 (자동 트래킹용)
   */
  static async findByIdWithToken(id) {
    try {
      const tracking = await this.findById(id);
      if (tracking && tracking.auth_token) {
        tracking.decrypted_token = decryptToken(tracking.auth_token);
      }
      return tracking;
    } catch (error) {
      logger.logError(error, { model: 'PortfolioTracking', operation: 'findByIdWithToken', id });
      throw error;
    }
  }

  static async findByPortfolioId(portfolioId) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM portfolio_trackings 
        WHERE portfolio_id = $1 
        ORDER BY created_at DESC
      `);
      const trackings = await stmt.all(portfolioId);
      return trackings;
    } catch (error) {
      logger.logError(error, { model: 'PortfolioTracking', operation: 'findByPortfolioId', portfolioId });
      throw error;
    }
  }

  static async findAll() {
    try {
      const stmt = db.prepare('SELECT * FROM portfolio_trackings ORDER BY created_at DESC');
      const trackings = await stmt.all();
      return trackings;
    } catch (error) {
      logger.logError(error, { model: 'PortfolioTracking', operation: 'findAll' });
      throw error;
    }
  }

  static async findPendingChecks() {
    try {
      // 마지막 확인이 없거나 1분 이상 지난 항목들 (테스트용, 프로덕션에서는 1시간으로 변경)
      const stmt = db.prepare(`
        SELECT * FROM portfolio_trackings 
        WHERE last_checked_at IS NULL 
           OR last_checked_at < NOW() - INTERVAL '1 minute'
        ORDER BY last_checked_at ASC NULLS FIRST
      `);
      const trackings = await stmt.all();
      
      // 복호화된 토큰 추가
      return trackings.map(t => ({
        ...t,
        decrypted_token: t.auth_token ? decryptToken(t.auth_token) : null,
      }));
    } catch (error) {
      logger.logError(error, { model: 'PortfolioTracking', operation: 'findPendingChecks' });
      throw error;
    }
  }

  static async updateStatus(id, status) {
    try {
      const stmt = db.prepare(`
        UPDATE portfolio_trackings 
        SET last_status = $1, 
            last_checked_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `);

      await stmt.run(status, id);
      logger.logDatabase('UPDATE', 'portfolio_trackings', { id, status });

      return await this.findById(id);
    } catch (error) {
      logger.logError(error, { model: 'PortfolioTracking', operation: 'updateStatus', id });
      throw error;
    }
  }

  static async update(id, updateData) {
    try {
      const { url, logicPrompt, authToken, authType } = updateData;
      const fields = [];
      const values = [];
      let paramIndex = 1;

      if (url !== undefined) {
        fields.push(`url = $${paramIndex++}`);
        values.push(url);
      }
      if (logicPrompt !== undefined) {
        fields.push(`logic_prompt = $${paramIndex++}`);
        values.push(logicPrompt);
      }
      if (authToken !== undefined) {
        fields.push(`auth_token = $${paramIndex++}`);
        values.push(authToken ? encryptToken(authToken) : null);
      }
      if (authType !== undefined) {
        fields.push(`auth_type = $${paramIndex++}`);
        values.push(authType);
      }

      if (fields.length === 0) {
        return await this.findById(id);
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const sql = `
        UPDATE portfolio_trackings 
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
      `;

      await db.run(sql, values);
      logger.logDatabase('UPDATE', 'portfolio_trackings', { id });

      return await this.findById(id);
    } catch (error) {
      logger.logError(error, { model: 'PortfolioTracking', operation: 'update', id });
      throw error;
    }
  }

  static async delete(id) {
    try {
      const stmt = db.prepare('DELETE FROM portfolio_trackings WHERE id = $1');
      const result = await stmt.run(id);
      logger.logDatabase('DELETE', 'portfolio_trackings', { id, changes: result.changes });
      return result.changes > 0;
    } catch (error) {
      logger.logError(error, { model: 'PortfolioTracking', operation: 'delete', id });
      throw error;
    }
  }
}

module.exports = PortfolioTracking;
