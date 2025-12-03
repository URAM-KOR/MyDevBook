const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'mydevbook.db');

// 데이터 디렉토리 생성
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  logger.info(`Created database directory: ${dbDir}`);
}

const db = new Database(dbPath);

// WAL 모드 활성화 (성능 향상)
db.pragma('journal_mode = WAL');

logger.info(`Database connected: ${dbPath}`);

module.exports = db;

