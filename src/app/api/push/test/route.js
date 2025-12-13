import { verifyToken } from '@/utils/jwt.js';
import logger from '@/utils/logger.js';

// POST: 테스트 알림 전송
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    const webpush = (await import('web-push')).default;
    const PushSubscription = (await import('@/models/PushSubscription.js')).default;

    // VAPID 설정
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:test@example.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    // 사용자의 구독 조회
    const subscriptions = await PushSubscription.findByUserId(payload.userId);

    if (subscriptions.length === 0) {
      return Response.json({ 
        success: false, 
        error: '알림 구독이 없습니다. 먼저 알림을 허용해주세요.' 
      });
    }

    const notificationPayload = JSON.stringify({
      title: '🔔 테스트 알림',
      body: '알림이 정상적으로 동작합니다!',
      url: '/portfolios',
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: sub.keys,
        };

        await webpush.sendNotification(pushSubscription, notificationPayload);
        sent++;
        logger.info('Test notification sent', { userId: payload.userId });
      } catch (error) {
        failed++;
        logger.logError(error, { endpoint: sub.endpoint });
        
        // 만료된 구독 삭제
        if (error.statusCode === 404 || error.statusCode === 410) {
          await PushSubscription.delete(sub.id);
        }
      }
    }

    return Response.json({ 
      success: true, 
      sent, 
      failed,
      message: `${sent}개의 알림을 전송했습니다.`
    });
  } catch (error) {
    logger.logError(error, { endpoint: '/api/push/test', method: 'POST' });
    return Response.json({ error: 'Failed to send test notification' }, { status: 500 });
  }
}

