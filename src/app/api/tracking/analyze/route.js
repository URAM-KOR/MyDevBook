import { verifyToken } from '@/utils/jwt.js';
import logger from '@/utils/logger.js';

// POST: GPT로 현재 값 분석
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
    const { url, data, targetKey } = body;

    if (!url || !data) {
      return Response.json({ error: 'URL and data are required' }, { status: 400 });
    }

    const model = process.env.OPENAI_MODEL || 'o1-preview';
    logger.info('GPT analysis started', { url, dataLength: data.length, targetKey, model });

    try {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // 데이터 요약 (Puppeteer가 이미 텍스트만 추출함)
      const truncatedData = data.substring(0, 30000);

      // 현재 UTC 시간 가져오기
      const now = new Date();
      const currentTime = now.toISOString(); // ISO 8601 형식 (UTC)
      
      // UTC 날짜 문자열 생성 (예: "Dec 13, 2025")
      const utcYear = now.getUTCFullYear();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const utcMonth = monthNames[now.getUTCMonth()];
      const utcDay = now.getUTCDate();
      const currentDateStr = `${utcMonth} ${utcDay}, ${utcYear}`;

      const systemPrompt = `당신은 웹 페이지에서 특정 정보를 찾는 전문가입니다.

**응답 형식 (반드시 JSON만):**
{"currentValue": "찾은 값 또는 '값 없음'"}
`;

      // 각 요청은 독립적으로 처리됩니다 (이전 대화 히스토리 없음)
      const completionParams = {
        model: model,  // 추론형 모델 사용
        messages: [
          // 시스템 프롬프트 (각 요청마다 새로 생성)
          {
            role: 'system',
            content: systemPrompt
          },
          // 사용자 요청 (각 요청마다 새로 생성, 이전 대화 없음)
          {
            role: 'user',
            content: targetKey 
              ? `다음은 웹 페이지에서 Ctrl+A로 복사한 텍스트입니다. "${targetKey}"와 관련된 값을 찾아주세요.

현재 시간: ${currentDateStr}

페이지 텍스트:
${truncatedData}`
              : `다음은 웹 페이지에서 Ctrl+A로 복사한 텍스트입니다. 핵심 정보를 추출하세요.

현재 시간: ${currentDateStr}

페이지 텍스트:
${truncatedData}`
          }
        ],
      };

      // o1, gpt-5 모델은 max_completion_tokens 사용, 다른 모델은 max_tokens 사용
      if (model.startsWith('o1') || model.startsWith('gpt-5')) {
        completionParams.max_completion_tokens = 200;
      } else {
        completionParams.max_tokens = 200;
        completionParams.temperature = 0;  // 정확한 추출을 위해 0
      }

      const completion = await openai.chat.completions.create(completionParams);

      const responseText = completion.choices[0]?.message?.content || '';
      
      // 응답이 비어있는 경우 에러 처리
      if (!responseText || responseText.trim() === '') {
        logger.error('GPT API returned empty response', { 
          url, 
          targetKey,
          model,
          completion: JSON.stringify(completion),
        });
        
        return Response.json({
          success: false,
          error: 'GPT API가 응답을 반환하지 않았습니다. 모델을 확인해주세요.',
        });
      }
      
      // JSON 파싱 시도
      let result;
      try {
        // JSON 블록 추출
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          result = { currentValue: responseText };
        }
      } catch (parseError) {
        logger.error('Failed to parse GPT response', { 
          url, 
          targetKey,
          model,
          rawResponse: responseText.substring(0, 500),
          error: parseError.message,
        });
        result = { currentValue: responseText };
      }

      logger.info('GPT analysis completed', { 
        url, 
        targetKey,
        model,
        currentValue: result.currentValue,
        rawResponse: responseText.substring(0, 200), // 디버깅용
        dataPreview: truncatedData.substring(0, 500), // 디버깅용
      });

      // "값 없음"이면 에러로 처리하지 않고 성공으로 반환 (사용자가 확인할 수 있도록)
      return Response.json({
        success: true,
        currentValue: result.currentValue || '분석 결과를 확인할 수 없습니다',
        isNotFound: result.currentValue === '값 없음' || result.currentValue?.toLowerCase().includes('없'),
      });

    } catch (gptError) {
      logger.logError(gptError, { api: 'OpenAI', url });
      
      let errorMsg = 'GPT 분석 중 오류가 발생했습니다';
      if (gptError.message?.includes('quota')) {
        errorMsg = 'API 사용량 한도에 도달했습니다';
      } else if (gptError.message?.includes('API key')) {
        errorMsg = 'OpenAI API 키가 설정되지 않았습니다';
      }

      return Response.json({
        success: false,
        error: errorMsg,
      });
    }

  } catch (error) {
    logger.logError(error, { endpoint: '/api/tracking/analyze', method: 'POST' });
    return Response.json({ error: 'Failed to analyze data' }, { status: 500 });
  }
}

