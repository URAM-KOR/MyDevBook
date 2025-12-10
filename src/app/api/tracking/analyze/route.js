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

      // HTML인 경우 정리해서 보내기
      let cleanedData = data;
      
      if (data.includes('<html') || data.includes('<!DOCTYPE')) {
        // HTML 정리: script, style, head, 주석 제거
        cleanedData = data
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, '')
          .replace(/<!--[\s\S]*?-->/g, '')
          .replace(/<[^>]+>/g, ' ')  // 태그 제거
          .replace(/\s+/g, ' ')       // 연속 공백 제거
          .trim();
        
        logger.info('HTML cleaned', { originalLength: data.length, cleanedLength: cleanedData.length });
      }

      // 데이터 요약 (정리된 데이터에서 더 많이)
      const truncatedData = cleanedData.substring(0, 30000);

      const systemPrompt = targetKey 
        ? `당신은 API 응답, JSON, HTML, 웹 페이지 등 모든 형식의 데이터에서 특정 값을 추출하는 전문가입니다.

사용자가 찾는 값: "${targetKey}"

데이터가 HTML이라면:
- 태그 안의 텍스트, 속성값, 메타데이터 등에서 찾으세요
- 날짜, 숫자, 상태 등이 포함된 텍스트를 찾으세요

데이터가 JSON이라면:
- 관련된 키의 값을 찾으세요

**반드시 값을 찾아서 응답하세요. "찾을 수 없다"고 하지 마세요.**
데이터 어딘가에 관련 정보가 있을 것입니다.

응답 형식 (JSON):
{
  "currentValue": "찾은 값 (예: 2024-12-10, 1234개, $45.67)",
  "analysis": "어디서 찾았는지 한 줄 설명"
}`
        : `당신은 API 응답, JSON, HTML 등 모든 형식의 데이터에서 핵심 정보를 추출하는 전문가입니다.

데이터에서 가장 중요하고 추적할 만한 값을 찾아주세요.

응답 형식 (JSON):
{
  "currentValue": "핵심 값 (예: 1,234개, $45.67, 정상)",
  "analysis": "한 줄 설명"
}`;

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
              ? `"${targetKey}"과 관련된 값을 데이터에서 찾아주세요. 반드시 찾아야 합니다.\n\nURL: ${url}\n\n데이터:\n${truncatedData}`
              : `URL: ${url}\n\n데이터:\n${truncatedData}`
          }
        ],
        max_tokens: 500,
        temperature: 0.2,
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

