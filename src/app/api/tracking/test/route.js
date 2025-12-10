import { verifyToken } from '@/utils/jwt.js';
import logger from '@/utils/logger.js';

// POST: 트래킹 테스트 실행
export async function POST(request) {
  try {
    // 인증 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { url, prompt } = body;

    if (!url || !prompt) {
      return Response.json({ error: 'URL and prompt are required' }, { status: 400 });
    }

    logger.info('Tracking test started', { url, promptLength: prompt.length });

    // 1. URL에서 데이터 가져오기
    let urlData;
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'MyDevBook Tracker/1.0',
        },
      });
      
      if (!response.ok) {
        return Response.json({
          success: false,
          step: 'fetch',
          error: `URL 응답 오류: ${response.status} ${response.statusText}`,
        });
      }
      
      urlData = await response.text();
    } catch (fetchError) {
      return Response.json({
        success: false,
        step: 'fetch',
        error: `URL 접근 실패: ${fetchError.message}`,
      });
    }

    // 2. GPT로 분석
    const { analyzeStatus } = await import('@/utils/gpt.js');
    const result = await analyzeStatus(url, prompt);

    if (result.status === 'error') {
      return Response.json({
        success: false,
        step: 'analyze',
        error: result.message,
        urlDataPreview: urlData.substring(0, 500),
      });
    }

    // 3. 성공 응답
    return Response.json({
      success: true,
      result: {
        status: result.status,
        analysis: result.raw,
        urlDataPreview: urlData.substring(0, 500),
      },
    });

  } catch (error) {
    logger.logError(error, { endpoint: '/api/tracking/test', method: 'POST' });
    return Response.json({ error: 'Failed to test tracking' }, { status: 500 });
  }
}

