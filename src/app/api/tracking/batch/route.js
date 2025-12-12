import logger from '@/utils/logger.js';

// 배치 API - cron으로 호출하여 모든 트래킹 체크
// GET /api/tracking/batch?secret=YOUR_SECRET
export async function GET(request) {
  try {
    // 간단한 시크릿 키 인증 (cron job에서 호출 시)
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    if (secret !== process.env.BATCH_SECRET && process.env.NODE_ENV === 'production') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Batch tracking check started');

    const PortfolioTracking = (await import('@/models/PortfolioTracking.js')).default;
    const Notification = (await import('@/models/Notification.js')).default;
    
    // 체크가 필요한 트래킹 목록 조회
    const trackings = PortfolioTracking.findPendingChecks();
    
    logger.info(`Found ${trackings.length} trackings to check`);

    const results = [];

    for (const tracking of trackings) {
      try {
        const result = await checkTracking(tracking);
        results.push(result);
        
        // 알림 조건 충족 시 알림 생성 + Push 전송
        if (result.shouldAlert) {
          Notification.create({
            userId: result.userId,
            portfolioId: tracking.portfolio_id,
            type: 'alert',
            title: `🔔 알림: ${result.targetKey}`,
            message: `현재 값: ${result.newValue}\n조건: ${tracking.logic_prompt}`,
          });
          
          // Push 알림 전송
          await sendPushNotification(result.userId, {
            title: `🔔 ${result.targetKey}`,
            body: `현재 값: ${result.newValue}`,
            url: `/portfolios`,
            portfolioId: tracking.portfolio_id,
          });
          
          logger.info('Alert notification created and pushed', { 
            portfolioId: tracking.portfolio_id, 
            newValue: result.newValue 
          });
        }
        
        // 상태 업데이트
        PortfolioTracking.updateStatus(tracking.id, result.newValue ? 'checked' : 'error');
        
        // current_value 업데이트
        if (result.newValue) {
          const db = (await import('@/utils/db.js')).default;
          db.prepare('UPDATE portfolio_trackings SET current_value = ? WHERE id = ?')
            .run(result.newValue, tracking.id);
        }
        
      } catch (error) {
        logger.logError(error, { trackingId: tracking.id });
        results.push({ trackingId: tracking.id, error: error.message });
      }
    }

    logger.info('Batch tracking check completed', { 
      total: trackings.length, 
      alerts: results.filter(r => r.shouldAlert).length 
    });

    return Response.json({
      success: true,
      checked: trackings.length,
      results,
    });

  } catch (error) {
    logger.logError(error, { endpoint: '/api/tracking/batch', method: 'GET' });
    return Response.json({ error: 'Batch check failed' }, { status: 500 });
  }
}

// 개별 트래킹 체크
async function checkTracking(tracking) {
  const Portfolio = (await import('@/models/Portfolio.js')).default;
  const portfolio = Portfolio.findById(tracking.portfolio_id);
  
  if (!portfolio) {
    return { trackingId: tracking.id, error: 'Portfolio not found' };
  }

  // 1. URL에서 데이터 가져오기
  let pageData;
  try {
    const puppeteer = (await import('puppeteer')).default;
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto(tracking.url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    pageData = await page.evaluate(() => document.body.innerText);
    await browser.close();
  } catch (error) {
    return { trackingId: tracking.id, error: `Failed to fetch: ${error.message}` };
  }

  // 2. GPT로 현재 값 분석
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const targetKey = tracking.target_key || '핵심 값';
  const truncatedData = pageData.substring(0, 30000);

  const systemPrompt = `당신은 텍스트에서 특정 값을 정확하게 추출하는 전문가입니다.

**중요: 데이터에 있는 값을 그대로 복사해서 반환하세요. 절대 추측하거나 변환하지 마세요.**

사용자가 찾는 값: "${targetKey}"

규칙:
1. 데이터에서 "${targetKey}"와 관련된 부분을 찾으세요
2. 찾은 값을 **있는 그대로** 복사하세요 (예: "4 days ago"면 "4 days ago"로)
3. 번역하거나 변환하지 마세요
4. 가장 최신/대표적인 값을 선택하세요

응답 형식 (JSON만, 다른 텍스트 없이):
{"currentValue": "데이터에서 찾은 원본 값"}`;

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `"${targetKey}"을 찾아서 데이터에 있는 그대로 반환하세요.\n\n데이터:\n${truncatedData}`
      }
    ],
    max_tokens: 200,
    temperature: 0,
  });

  const responseText = completion.choices[0]?.message?.content || '';
  let newValue;
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      newValue = parsed.currentValue;
    }
  } catch {
    newValue = responseText;
  }

  // 3. 알림 조건 확인 (값 변경 여부와 관계없이 항상 체크)
  let shouldAlert = false;
  if (tracking.logic_prompt && newValue) {
    // GPT로 알림 조건 체크
    const alertCheck = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `현재 값이 알림 조건을 충족하는지 확인하세요.
조건: ${tracking.logic_prompt}
현재 값: ${newValue}

조건을 충족하면 "YES", 아니면 "NO"만 응답하세요.`
        }
      ],
      max_tokens: 10,
      temperature: 0,
    });
    
    const alertResponse = alertCheck.choices[0]?.message?.content?.trim().toUpperCase();
    shouldAlert = alertResponse === 'YES';
  }

  return {
    trackingId: tracking.id,
    portfolioId: tracking.portfolio_id,
    userId: portfolio.user_id,
    targetKey,
    oldValue: tracking.current_value,
    newValue,
    shouldAlert,
  };
}

// Push 알림 전송
async function sendPushNotification(userId, payload) {
  try {
    const webpush = (await import('web-push')).default;
    const PushSubscription = (await import('@/models/PushSubscription.js')).default;

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:test@example.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const subscriptions = PushSubscription.findByUserId(userId);
    
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          JSON.stringify(payload)
        );
        logger.info('Push notification sent', { userId });
      } catch (error) {
        logger.logError(error, { endpoint: sub.endpoint });
        // 만료된 구독 삭제
        if (error.statusCode === 404 || error.statusCode === 410) {
          PushSubscription.delete(sub.id);
        }
      }
    }
  } catch (error) {
    logger.logError(error, { action: 'sendPushNotification', userId });
  }
}

