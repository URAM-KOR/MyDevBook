#!/usr/bin/env node

/**
 * Migration: Add notification_enabled column to portfolio_trackings table
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const db = require('../src/utils/db.js');
const logger = require('../src/utils/logger.js');

async function addColumn() {
  try {
    logger.info('Adding notification_enabled column to portfolio_trackings table...');
    
    await db.exec(`
      ALTER TABLE portfolio_trackings 
      ADD COLUMN IF NOT EXISTS notification_enabled BOOLEAN DEFAULT true
    `);
    
    // 기존 데이터는 logic_prompt가 있으면 enabled, 없으면 disabled로 설정
    await db.exec(`
      UPDATE portfolio_trackings 
      SET notification_enabled = (logic_prompt IS NOT NULL AND logic_prompt != '')
    `);
    
    logger.info('✅ notification_enabled column added successfully');
  } catch (error) {
    logger.logError(error, { action: 'addNotificationEnabled' });
    throw error;
  } finally {
    db.close();
  }
}

addColumn();

