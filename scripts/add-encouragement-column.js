#!/usr/bin/env node

/**
 * encouragement_message 컬럼 추가 스크립트
 * node scripts/add-encouragement-column.js
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// 현재 파일의 디렉토리
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 프로젝트 루트로 이동
process.chdir(join(__dirname, '..'));

// .env 파일 로드
try {
  const envPath = join(__dirname, '..', '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
} catch (error) {
  console.warn('⚠️  .env 파일을 읽을 수 없습니다:', error.message);
}

const db = (await import('../src/utils/db.js')).default;
const logger = (await import('../src/utils/logger.js')).default;

async function main() {
  try {
    logger.info('Adding encouragement_message column to portfolios table...');
    
    await db.run(
      'ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS encouragement_message TEXT',
      []
    );
    
    logger.info('✅ encouragement_message column added successfully');
    console.log('✅ 컬럼 추가 완료!');
    
    await db.close();
  } catch (error) {
    logger.logError(error, { action: 'add-encouragement-column' });
    console.error('❌ 컬럼 추가 실패:', error.message);
    process.exit(1);
  }
}

main();

