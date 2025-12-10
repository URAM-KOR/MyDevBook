import { verifyToken } from '@/utils/jwt.js';
import logger from '@/utils/logger.js';

// POST: URL 접근 가능 여부 확인
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
    const { url } = body;

    if (!url) {
      return Response.json({ error: 'URL is required' }, { status: 400 });
    }

    // URL 형식 검증
    try {
      new URL(url);
    } catch {
      return Response.json({
        success: false,
        error: 'URL 형식이 올바르지 않습니다.',
      });
    }

    logger.info('URL check started', { url });

    // URL 접근 시도 (타임아웃 10초)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json, text/html, */*',
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMsg = '접근할 수 없습니다';
        if (response.status === 404) errorMsg = '페이지를 찾을 수 없습니다 (404)';
        if (response.status === 403) errorMsg = '접근이 거부되었습니다 (403)';
        if (response.status === 401) errorMsg = '인증이 필요합니다 (401)';
        if (response.status >= 500) errorMsg = '서버 오류가 발생했습니다';

        return Response.json({
          success: false,
          error: errorMsg,
          statusCode: response.status,
        });
      }

      const data = await response.text();
      
      if (!data || data.trim() === '') {
        return Response.json({
          success: false,
          error: '빈 응답을 받았습니다.',
        });
      }

      logger.info('URL check successful', { url, dataLength: data.length });

      return Response.json({
        success: true,
        data: data,
        dataLength: data.length,
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      let errorMsg = '네트워크 오류가 발생했습니다';
      if (fetchError.name === 'AbortError') {
        errorMsg = '응답 시간이 초과되었습니다 (10초)';
      }

      return Response.json({
        success: false,
        error: errorMsg,
      });
    }

  } catch (error) {
    logger.logError(error, { endpoint: '/api/tracking/check-url', method: 'POST' });
    return Response.json({ error: 'Failed to check URL' }, { status: 500 });
  }
}

