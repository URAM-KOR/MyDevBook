// 포트폴리오 테이블에 image_url 컬럼 추가 마이그레이션
const db = require('../src/utils/db');
const logger = require('../src/utils/logger');

try {
  // image_url 컬럼이 있는지 확인
  const tableInfo = db.pragma('table_info(portfolios)');
  const hasImageUrl = tableInfo.some(col => col.name === 'image_url');

  if (!hasImageUrl) {
    db.exec(`
      ALTER TABLE portfolios 
      ADD COLUMN image_url TEXT
    `);
    logger.info('Added image_url column to portfolios table');
    console.log('✅ image_url 컬럼이 추가되었습니다.');
  } else {
    console.log('ℹ️ image_url 컬럼이 이미 존재합니다.');
  }
} catch (error) {
  logger.logError(error, { script: 'add-image-to-portfolio' });
  console.error('❌ 에러 발생:', error.message);
  process.exit(1);
}

process.exit(0);

