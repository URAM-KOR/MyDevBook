/**
 * Migration: portfolio_trackings 테이블에 auth 컬럼 추가
 */
const db = require('../src/utils/db');

console.log('Adding auth columns to portfolio_trackings table...');

try {
  // auth_token 컬럼 추가
  db.exec(`
    ALTER TABLE portfolio_trackings 
    ADD COLUMN auth_token TEXT;
  `);
  console.log('✅ auth_token column added');
} catch (e) {
  if (e.message.includes('duplicate column')) {
    console.log('⏭️ auth_token column already exists');
  } else {
    console.error('❌ Error adding auth_token:', e.message);
  }
}

try {
  // auth_type 컬럼 추가
  db.exec(`
    ALTER TABLE portfolio_trackings 
    ADD COLUMN auth_type TEXT DEFAULT 'none';
  `);
  console.log('✅ auth_type column added');
} catch (e) {
  if (e.message.includes('duplicate column')) {
    console.log('⏭️ auth_type column already exists');
  } else {
    console.error('❌ Error adding auth_type:', e.message);
  }
}

console.log('Migration completed!');

