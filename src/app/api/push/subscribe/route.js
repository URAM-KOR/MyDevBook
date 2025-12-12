import { verifyToken } from '@/utils/jwt.js';
import logger from '@/utils/logger.js';

// POST: Push 구독 등록
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

    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint) {
      return Response.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    const PushSubscription = (await import('@/models/PushSubscription.js')).default;
    
    // 기존 구독 삭제 후 새로 등록
    const existing = PushSubscription.findByUserId(payload.userId);
    for (const sub of existing) {
      PushSubscription.delete(sub.id);
    }

    const saved = PushSubscription.create({
      userId: payload.userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    });

    logger.info('Push subscription saved', { userId: payload.userId });

    return Response.json({ success: true, id: saved.id });
  } catch (error) {
    logger.logError(error, { endpoint: '/api/push/subscribe', method: 'POST' });
    return Response.json({ error: 'Failed to save subscription' }, { status: 500 });
  }
}

