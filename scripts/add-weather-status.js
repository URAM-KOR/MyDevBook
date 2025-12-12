/**
 * Migration: Add weather_status column to portfolios table
 * 
 * Run: node scripts/add-weather-status.js
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'mydevbook.db');
const db = new Database(dbPath);

try {
  // Check if column exists
  const tableInfo = db.prepare("PRAGMA table_info(portfolios)").all();
  const hasColumn = tableInfo.some(col => col.name === 'weather_status');
  
  if (hasColumn) {
    console.log('✅ weather_status column already exists');
  } else {
    db.prepare("ALTER TABLE portfolios ADD COLUMN weather_status TEXT DEFAULT 'healthy'").run();
    console.log('✅ Added weather_status column to portfolios table');
  }
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}

