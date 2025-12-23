#!/usr/bin/env node

/**
 * Migration: Remove last_status and last_checked_at columns from portfolio_trackings table
 * (These are batch process metadata fields, not GPT response fields)
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const db = require('../src/utils/db.js');
const logger = require('../src/utils/logger.js');

async function removeColumns() {
  try {
    logger.info('Removing last_status and last_checked_at columns from portfolio_trackings table...');
    
    await db.exec(`
      ALTER TABLE portfolio_trackings 
      DROP COLUMN IF EXISTS last_status,
      DROP COLUMN IF EXISTS last_checked_at
    `);
    
    logger.info('✅ last_status and last_checked_at columns removed successfully');
  } catch (error) {
    logger.logError(error, { action: 'removeTrackingMetaFields' });
    throw error;
  } finally {
    db.close();
  }
}

removeColumns();

