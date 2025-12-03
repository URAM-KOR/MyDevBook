export async function GET() {
  try {
    const logger = (await import('@/utils/logger')).default;
    logger.info('Database initialization started');
    
    // 동적 import로 CommonJS 모듈 로드
    const { initDatabase } = await import('@/utils/initDb');
    initDatabase();
    
    logger.info('Database initialization completed');
    return Response.json({ message: 'Database initialized successfully' });
  } catch (error) {
    const logger = (await import('@/utils/logger')).default;
    logger.logError(error, { endpoint: '/api/init' });
    return Response.json({ error: error.message }, { status: 500 });
  }
}

