const { Pool } = require('pg');
const logger = require('./logger');

// PostgreSQL 연결 설정
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'fairyquest',
  user: process.env.DB_USER || 'fairyquest_user',
  password: process.env.DB_PASSWORD || 'fairyquest_pass_2024',
  max: 20, // 최대 연결 수
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 연결 테스트
pool.on('connect', () => {
  logger.info('PostgreSQL connected');
});

pool.on('error', (err) => {
  logger.logError(err, { component: 'PostgreSQL' });
});

// SQLite와 호환되는 인터페이스 제공
const db = {
  // 쿼리 실행 (SELECT 등)
  query: async (text, params) => {
    try {
      const result = await pool.query(text, params);
      return {
        rows: result.rows,
        get: (index) => result.rows[index] || null,
        all: () => result.rows,
      };
    } catch (error) {
      logger.logError(error, { query: text.substring(0, 100) });
      throw error;
    }
  },

  // 단일 행 반환
  get: async (text, params) => {
    const result = await db.query(text, params);
    return result.rows[0] || null;
  },

  // 모든 행 반환
  all: async (text, params) => {
    const result = await db.query(text, params);
    return result.rows;
  },

  // 실행 (INSERT, UPDATE, DELETE)
  run: async (text, params) => {
    try {
      const result = await pool.query(text, params);
      return {
        changes: result.rowCount || 0,
        lastInsertRowid: result.rows[0]?.id || null,
      };
    } catch (error) {
      logger.logError(error, { query: text.substring(0, 100) });
      throw error;
    }
  },

  // 여러 쿼리 실행 (트랜잭션)
  exec: async (sql) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // 여러 쿼리를 세미콜론으로 분리하여 실행
      const queries = sql.split(';').filter(q => q.trim());
      for (const query of queries) {
        if (query.trim()) {
          await client.query(query);
        }
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.logError(error, { query: sql.substring(0, 100) });
      throw error;
    } finally {
      client.release();
    }
  },

  // Prepared statement (SQLite 호환)
  prepare: (sql) => {
    // SQLite의 ? 플레이스홀더를 PostgreSQL의 $1, $2로 변환
    let paramIndex = 1;
    const convertedSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    
    return {
      get: async (...params) => {
        const result = await db.query(convertedSql, params);
        return result.rows[0] || null;
      },
      all: async (...params) => {
        const result = await db.query(convertedSql, params);
        return result.rows;
      },
      run: async (...params) => {
        return await db.run(convertedSql, params);
      },
    };
  },

  // 연결 종료
  close: async () => {
    await pool.end();
  },

  // pool 직접 접근 (initDb에서 사용)
  pool,
};

logger.info(`PostgreSQL connected: ${process.env.DB_NAME || 'fairyquest'}`);

module.exports = db;
