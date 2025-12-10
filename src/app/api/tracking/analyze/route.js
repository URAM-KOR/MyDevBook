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

    logger.info('GPT analysis started', { url, dataLength: data.length, targetKey });

    try {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // 데이터 요약 (Puppeteer가 이미 텍스트만 추출함)
      const truncatedData = data.substring(0, 30000);

      const systemPrompt = targetKey 
        ? `당신은 텍스트에서 특정 값을 정확하게 추출하는 전문가입니다.

**중요: 데이터에 있는 값을 그대로 복사해서 반환하세요. 절대 추측하거나 변환하지 마세요.**

사용자가 찾는 값: "${targetKey}"

규칙:
1. 데이터에서 "${targetKey}"와 관련된 부분을 찾으세요
2. 찾은 값을 **있는 그대로** 복사하세요 (예: "4 days ago"면 "4 days ago"로)
3. 번역하거나 변환하지 마세요
4. 가장 최신/대표적인 값을 선택하세요

응답 형식 (JSON만, 다른 텍스트 없이):
{"currentValue": "데이터에서 찾은 원본 값", "analysis": "어디서 찾았는지"}`
        : `당신은 텍스트에서 핵심 정보를 정확하게 추출하는 전문가입니다.

**중요: 데이터에 있는 값을 그대로 복사해서 반환하세요.**

응답 형식 (JSON만):
{"currentValue": "핵심 값", "analysis": "한 줄 설명"}`;

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: targetKey 
              ? `"${targetKey}"을 찾아서 데이터에 있는 그대로 반환하세요.\n\n데이터:\n${truncatedData}`
              : `데이터:\n${truncatedData}`
          }
        ],
        max_tokens: 200,
        temperature: 0,  // 정확한 추출을 위해 0
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

