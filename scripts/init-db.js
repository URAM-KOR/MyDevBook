// 데이터베이스 초기화 스크립트
const { initDatabase } = require('../src/utils/initDb');

(async () => {
  try {
    console.log('Initializing database...');
    await initDatabase();
    console.log('Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
})();

