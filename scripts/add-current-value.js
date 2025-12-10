/**
 * Migration: portfolio_trackings 테이블에 current_value 컬럼 추가
 */
const db = require('../src/utils/db');

console.log('Adding current_value column to portfolio_trackings table...');

try {
  db.exec(`
    ALTER TABLE portfolio_trackings 
    ADD COLUMN current_value TEXT;
  `);
  console.log('✅ current_value column added');
} catch (e) {
  if (e.message.includes('duplicate column')) {
    console.log('⏭️ current_value column already exists');
  } else {
    console.error('❌ Error:', e.message);
  }
}

console.log('Migration completed!');

