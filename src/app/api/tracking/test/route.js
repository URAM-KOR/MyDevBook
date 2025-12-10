import { verifyToken } from '@/utils/jwt.js';
import logger from '@/utils/logger.js';

// 에러 타입별 메시지
const errorMessages = {
  NETWORK_ERROR: {
    emoji: '🌐',
    title: '네트워크 오류',
    description: 'URL에 접근할 수 없습니다.',
    suggestion: 'URL이 올바른지, 서버가 실행 중인지 확인해주세요.',
  },
  TIMEOUT: {
    emoji: '⏱️',
    title: '시간 초과',
    description: 'API 응답이 너무 오래 걸립니다.',
    suggestion: '네트워크 상태를 확인하거나, 다른 API를 시도해보세요.',
  },
  FORBIDDEN: {
    emoji: '🚫',
    title: '접근 금지 (403)',
    description: '이 API에 접근할 권한이 없습니다.',
    suggestion: 'API 키나 인증이 필요한지 확인해주세요.',
  },
  UNAUTHORIZED: {
    emoji: '🔐',
    title: '인증 필요 (401)',
    description: 'API 인증이 필요합니다.',
    suggestion: 'API 키를 헤더에 추가해야 할 수 있습니다.',
  },
  NOT_FOUND: {
    emoji: '🔍',
    title: '찾을 수 없음 (404)',
    description: '요청한 리소스가 존재하지 않습니다.',
    suggestion: 'URL 경로가 올바른지 확인해주세요.',
  },
  SERVER_ERROR: {
    emoji: '💥',
    title: '서버 오류 (5xx)',
    description: '대상 서버에서 오류가 발생했습니다.',
    suggestion: '잠시 후 다시 시도하거나, API 상태를 확인해주세요.',
  },
  INVALID_URL: {
    emoji: '❌',
    title: '잘못된 URL',
    description: 'URL 형식이 올바르지 않습니다.',
    suggestion: 'https:// 또는 http://로 시작하는 올바른 URL을 입력해주세요.',
  },
  CORS_ERROR: {
    emoji: '🛡️',
    title: 'CORS 오류',
    description: '브라우저 보안 정책으로 접근이 차단되었습니다.',
    suggestion: '서버 측에서 호출하므로 대부분 문제없지만, API가 IP 제한이 있을 수 있습니다.',
  },
  EMPTY_RESPONSE: {
    emoji: '📭',
    title: '빈 응답',
    description: 'API가 빈 응답을 반환했습니다.',
    suggestion: '올바른 API 엔드포인트인지 확인해주세요.',
  },
  GPT_ERROR: {
    emoji: '🤖',
    title: 'AI 분석 오류',
    description: 'GPT 분석 중 오류가 발생했습니다.',
    suggestion: 'OpenAI API 키가 설정되어 있는지 확인해주세요.',
  },
  GPT_QUOTA: {
    emoji: '💳',
    title: 'API 할당량 초과',
    description: 'OpenAI API 사용량 한도에 도달했습니다.',
    suggestion: 'OpenAI 대시보드에서 사용량을 확인해주세요.',
  },
};

function getErrorType(error, response) {
  const message = error?.message?.toLowerCase() || '';
  
  if (message.includes('invalid url') || message.includes('url')) {
    return 'INVALID_URL';
  }
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'TIMEOUT';
  }
  if (message.includes('network') || message.includes('fetch failed') || message.includes('econnrefused')) {
    return 'NETWORK_ERROR';
  }
  if (message.includes('cors')) {
    return 'CORS_ERROR';
  }
  if (message.includes('quota') || message.includes('rate limit')) {
    return 'GPT_QUOTA';
  }
  
  if (response) {
    if (response.status === 401) return 'UNAUTHORIZED';
    if (response.status === 403) return 'FORBIDDEN';
    if (response.status === 404) return 'NOT_FOUND';
    if (response.status >= 500) return 'SERVER_ERROR';
  }
  
  return 'NETWORK_ERROR';
}

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
    const { url, prompt, auth_token, auth_type } = body;

    if (!url || !prompt) {
      return Response.json({ error: 'URL and prompt are required' }, { status: 400 });
    }

    // URL 형식 검증
    try {
      new URL(url);
    } catch {
      const errorInfo = errorMessages.INVALID_URL;
      return Response.json({
        success: false,
        step: 'validate',
        errorType: 'INVALID_URL',
        ...errorInfo,
      });
    }

    logger.info('Tracking test started', { url, promptLength: prompt.length, hasAuth: !!auth_token });

    // 1. URL에서 데이터 가져오기 (타임아웃 설정)
    let urlData;
    let fetchResponse;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃
      
      // 인증 헤더 설정
      const headers = {
        'User-Agent': 'MyDevBook Tracker/1.0',
        'Accept': 'application/json, text/plain, */*',
      };
      
      // GitHub 토큰 또는 Bearer 토큰 추가
      if (auth_token) {
        if (auth_type === 'github') {
          headers['Authorization'] = `Bearer ${auth_token}`;
        } else if (auth_type === 'bearer') {
          headers['Authorization'] = `Bearer ${auth_token}`;
        }
      }
      
      fetchResponse = await fetch(url, {
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!fetchResponse.ok) {
        const errorType = getErrorType(null, fetchResponse);
        const errorInfo = errorMessages[errorType];
        return Response.json({
          success: false,
          step: 'fetch',
          errorType,
          ...errorInfo,
          statusCode: fetchResponse.status,
        });
      }
      
      urlData = await fetchResponse.text();
      
      if (!urlData || urlData.trim() === '') {
        const errorInfo = errorMessages.EMPTY_RESPONSE;
        return Response.json({
          success: false,
          step: 'fetch',
          errorType: 'EMPTY_RESPONSE',
          ...errorInfo,
        });
      }
      
    } catch (fetchError) {
      const errorType = getErrorType(fetchError, null);
      const errorInfo = errorMessages[errorType];
      return Response.json({
        success: false,
        step: 'fetch',
        errorType,
        ...errorInfo,
        detail: fetchError.message,
      });
    }

    // 2. GPT로 분석
    try {
      const { analyzeStatus } = await import('@/utils/gpt.js');
      const result = await analyzeStatus(url, prompt);

      if (result.status === 'error') {
        const isQuotaError = result.message?.toLowerCase().includes('quota') || 
                            result.message?.toLowerCase().includes('rate');
        const errorType = isQuotaError ? 'GPT_QUOTA' : 'GPT_ERROR';
        const errorInfo = errorMessages[errorType];
        
        return Response.json({
          success: false,
          step: 'analyze',
          errorType,
          ...errorInfo,
          detail: result.message,
          urlDataPreview: urlData.substring(0, 300),
        });
      }

      // 3. 성공 응답
      return Response.json({
        success: true,
        result: {
          status: result.status,
          analysis: result.raw,
          urlDataPreview: urlData.substring(0, 500),
          urlDataLength: urlData.length,
        },
      });

    } catch (gptError) {
      const errorInfo = errorMessages.GPT_ERROR;
      return Response.json({
        success: false,
        step: 'analyze',
        errorType: 'GPT_ERROR',
        ...errorInfo,
        detail: gptError.message,
        urlDataPreview: urlData.substring(0, 300),
      });
    }

  } catch (error) {
    logger.logError(error, { endpoint: '/api/tracking/test', method: 'POST' });
    return Response.json({ error: 'Failed to test tracking' }, { status: 500 });
  }
}
