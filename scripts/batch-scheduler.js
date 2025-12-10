/**
 * 배치 스케줄러 - 1분마다 트래킹 체크 실행
 * 실행: node scripts/batch-scheduler.js
 */

const BATCH_URL = 'http://localhost:3001/api/tracking/batch';
const BATCH_SECRET = process.env.BATCH_SECRET || 'test-secret';
const INTERVAL_MS = 60 * 1000; // 1분

async function runBatch() {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] 🔄 배치 실행 중...`);
  
  try {
    const response = await fetch(`${BATCH_URL}?secret=${BATCH_SECRET}`);
    const result = await response.json();
    
    if (result.success) {
      console.log(`[${timestamp}] ✅ 체크: ${result.checked}개, 알림: ${result.results?.filter(r => r.shouldAlert).length || 0}개`);
    } else {
      console.log(`[${timestamp}] ❌ 에러:`, result.error);
    }
  } catch (error) {
    console.log(`[${timestamp}] ❌ 요청 실패:`, error.message);
  }
}

console.log('🚀 배치 스케줄러 시작 (1분 간격)');
console.log(`📍 URL: ${BATCH_URL}`);
console.log('');

// 즉시 1회 실행
runBatch();

// 1분마다 실행
setInterval(runBatch, INTERVAL_MS);

console.log('Ctrl+C로 종료');

