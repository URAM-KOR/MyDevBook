#!/usr/bin/env node

/**
 * Migration: Remove weather_status and encouragement_message columns from portfolios table
 * (These fields are now managed in portfolio_trackings table)
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const db = require('../src/utils/db.js');
const logger = require('../src/utils/logger.js');

async function removeColumns() {
  try {
    logger.info('Removing weather_status and encouragement_message columns from portfolios table...');
    
    await db.exec(`
      ALTER TABLE portfolios 
      DROP COLUMN IF EXISTS weather_status,
      DROP COLUMN IF EXISTS encouragement_message
    `);
    
    logger.info('✅ weather_status and encouragement_message columns removed successfully');
  } catch (error) {
    logger.logError(error, { action: 'removePortfolioWeatherFields' });
    throw error;
  } finally {
    db.close();
  }
}

removeColumns();

