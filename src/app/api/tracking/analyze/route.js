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
    const { url, data } = body;

    if (!url || !data) {
      return Response.json({ error: 'URL and data are required' }, { status: 400 });
    }

    logger.info('GPT analysis started', { url, dataLength: data.length });

    try {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // 데이터 요약 (너무 길면 잘라서)
      const truncatedData = data.substring(0, 3000);

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `당신은 API 응답이나 웹 페이지 데이터를 분석하여 핵심 정보를 추출하는 전문가입니다.
주어진 데이터에서 가장 중요하고 추적할 만한 값을 찾아서 간결하게 설명해주세요.

응답 형식:
- currentValue: 핵심 수치나 상태 (예: "스타 수: 1,234개", "가격: $45.67", "상태: 정상")
- analysis: 한 줄 요약 설명

JSON 형식으로만 응답하세요.`
          },
          {
            role: 'user',
            content: `URL: ${url}\n\n데이터:\n${truncatedData}`
          }
        ],
        max_tokens: 300,
        temperature: 0.3,
      });

      const responseText = completion.choices[0]?.message?.content || '';
      
      // JSON 파싱 시도
      let result;
      try {
        // JSON 블록 추출
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          result = { currentValue: responseText, analysis: '' };
        }
      } catch {
        result = { currentValue: responseText, analysis: '' };
      }

      logger.info('GPT analysis completed', { url, currentValue: result.currentValue });

      return Response.json({
        success: true,
        currentValue: result.currentValue || '분석 결과를 확인할 수 없습니다',
        analysis: result.analysis || '',
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

