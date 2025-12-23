const db = require('./db');
const logger = require('./logger');

async function initDatabase() {
  logger.info('Initializing database tables...');

  // Users 테이블
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      provider_id VARCHAR(255) NOT NULL,
      provider VARCHAR(50) NOT NULL DEFAULT 'google',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Portfolios 테이블 (사용자가 직접 관리하는 필드만)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS portfolios (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      content TEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'active',
      "order" INTEGER NOT NULL DEFAULT 0,
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Migration for existing tables
  await db.exec(`
    ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS description TEXT;
  `);

  // Portfolio_Trackings 테이블 (GPT 응답으로 업데이트되는 필드만)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS portfolio_trackings (
      id VARCHAR(255) PRIMARY KEY,
      portfolio_id VARCHAR(255) NOT NULL,
      url TEXT NOT NULL,
      target_key TEXT,
      logic_prompt TEXT NOT NULL,
      auth_token TEXT,
      auth_type VARCHAR(50) DEFAULT 'none',
      -- GPT 응답으로 업데이트되는 필드
      current_value TEXT,
      weather_status VARCHAR(50) DEFAULT 'healthy',
      encouragement_message TEXT,
      -- 알림 설정
      notification_enabled BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
    )
  `);

  // Notifications 테이블
  await db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      portfolio_id VARCHAR(255),
      tracking_id VARCHAR(255),
      type VARCHAR(50) NOT NULL,
      title TEXT,
      message TEXT,
      payload JSONB,
      read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      sent_at TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
      FOREIGN KEY (tracking_id) REFERENCES portfolio_trackings(id) ON DELETE CASCADE
    )
  `);

  // Push_Subscriptions 테이블
  await db.exec(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      endpoint TEXT NOT NULL,
      keys JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 인덱스 생성
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
    CREATE INDEX IF NOT EXISTS idx_portfolio_trackings_portfolio_id ON portfolio_trackings(portfolio_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
  `);

  logger.info('Database initialized successfully');
  logger.logDatabase('init', 'all_tables');
}

module.exports = { initDatabase };
