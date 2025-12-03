// 데이터베이스 초기화 스크립트
const { initDatabase } = require('../src/utils/initDb');

console.log('Initializing database...');
initDatabase();
console.log('Database initialized successfully!');
process.exit(0);

