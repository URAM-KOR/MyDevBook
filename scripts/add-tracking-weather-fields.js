#!/usr/bin/env node

/**
 * Migration: Add weather_status and encouragement_message columns to portfolio_trackings table
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const db = require('../src/utils/db.js');
const logger = require('../src/utils/logger.js');

async function addColumns() {
  try {
    logger.info('Adding weather_status and encouragement_message columns to portfolio_trackings table...');
    
    await db.exec(`
      ALTER TABLE portfolio_trackings 
      ADD COLUMN IF NOT EXISTS weather_status VARCHAR(50) DEFAULT 'healthy',
      ADD COLUMN IF NOT EXISTS encouragement_message TEXT
    `);
    
    logger.info('✅ weather_status and encouragement_message columns added successfully');
  } catch (error) {
    logger.logError(error, { action: 'addTrackingWeatherFields' });
    throw error;
  } finally {
    db.close();
  }
}

addColumns();

