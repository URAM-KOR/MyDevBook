import { verifyToken } from '@/utils/jwt.js';
import User from '@/models/User.js';
import logger from '@/utils/logger.js';

export async function GET(request) {
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

    // 사용자 정보 조회
    const user = await User.findById(payload.userId);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json({
      valid: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        provider: user.provider,
        provider_id: user.provider_id,
      },
    });
  } catch (error) {
    logger.logError(error, { endpoint: '/api/auth/verify' });
    return Response.json({ error: 'Token verification failed' }, { status: 500 });
  }
}

