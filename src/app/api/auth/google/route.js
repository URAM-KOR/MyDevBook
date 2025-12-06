export async function GET() {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';
    
    if (!clientId) {
      return Response.json({ error: 'Google OAuth not configured' }, { status: 500 });
    }

    // Google OAuth 인증 URL 생성
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');

    // Google 로그인 페이지로 리디렉션
    return Response.redirect(authUrl.toString());
  } catch (error) {
    const logger = (await import('@/utils/logger')).default;
    logger.logError(error, { endpoint: '/api/auth/google' });
    return Response.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

