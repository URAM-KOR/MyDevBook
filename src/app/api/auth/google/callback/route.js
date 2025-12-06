export async function GET(request) {
  try {
    // 동적 import로 CommonJS 모듈 로드
    const { OAuth2Client } = await import('google-auth-library');
    const User = (await import('@/models/User')).default;
    const { createToken } = await import('@/utils/jwt');
    const logger = (await import('@/utils/logger')).default;

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return Response.redirect(new URL('/?error=no_code', request.url).toString());
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

    if (!clientId || !clientSecret) {
      logger.error('Google OAuth credentials not configured');
      return Response.redirect(new URL('/?error=config', request.url).toString());
    }

    // OAuth2 클라이언트 생성
    const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);

    // 인증 코드를 액세스 토큰으로 교환
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // 사용자 정보 가져오기
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    const { sub: providerId, name, email, picture } = payload;

    // 기존 사용자 확인 또는 새 사용자 생성
    let user = User.findByProviderId(providerId);
    
    if (!user) {
      // 새 사용자 생성
      user = User.create({
        name,
        email,
        providerId,
        provider: 'google',
      });
      logger.info('New user created', { userId: user.id, email });
    } else {
      // 기존 사용자 정보 업데이트 (이름이 변경되었을 수 있음)
      if (user.name !== name) {
        user = User.update(user.id, { name });
        logger.info('User updated', { userId: user.id });
      }
    }

    // JWT 토큰 생성
    const token = await createToken({
      userId: user.id,
      email: user.email,
      provider: user.provider,
    });

    // 토큰과 사용자 정보를 쿼리 파라미터로 전달하여 리디렉션
    const frontendUrl = new URL('/', request.url);
    frontendUrl.searchParams.set('token', token);
    frontendUrl.searchParams.set('user', JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      provider: user.provider,
      provider_id: user.provider_id,
    }));

    return Response.redirect(frontendUrl.toString());
  } catch (error) {
    logger.logError(error, { endpoint: '/api/auth/google/callback' });
    return Response.redirect(new URL('/?error=auth_failed', request.url).toString());
  }
}

