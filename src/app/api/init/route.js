export async function GET() {
  try {
    // 동적 import로 CommonJS 모듈 로드
    const { initDatabase } = await import('@/utils/initDb');
    initDatabase();
    return Response.json({ message: 'Database initialized successfully' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

