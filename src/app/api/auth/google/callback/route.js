export async function GET(request) {
  // 동적 import로 CommonJS 모듈 로드 (try 밖에서)
  const { OAuth2Client } = await import('google-auth-library');
  const User = (await import('@/models/User')).default;
  const { createToken } = await import('@/utils/jwt');
  const logger = (await import('@/utils/logger')).default;

  // 앱 기본 URL (환경변수에서 가져오기)
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return Response.redirect(`${appUrl}/?error=no_code`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${appUrl}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      logger.error('Google OAuth credentials not configured');
      return Response.redirect(`${appUrl}/?error=config`);
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
    const fallbackName = name || (email ? email.split('@')[0] : '사용자');

    // 기존 사용자 확인 또는 새 사용자 생성
    let user = await User.findByProviderId(providerId);
    
    if (!user) {
      // 새 사용자 생성
      user = await User.create({
        name: name || fallbackName,
        email,
        providerId,
        provider: 'google',
      });
      logger.info('New user created', { userId: user.id, email });
    } else {
      // 기존 사용자 정보 업데이트 (이름이 변경되었을 수 있음)
      if (user.name !== (name || fallbackName)) {
        user = await User.update(user.id, { name: name || fallbackName });
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
    const frontendUrl = new URL('/', appUrl);
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
    return Response.redirect(`${appUrl}/?error=auth_failed`);
  }
}

// 빌드 시 정적 생성 방지
export const dynamic = 'force-dynamic';
