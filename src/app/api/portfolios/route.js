import Portfolio from '@/models/Portfolio.js';
import PortfolioTracking from '@/models/PortfolioTracking.js';
import { getImageUrl } from '@/utils/imageHelper.js';
import { verifyToken } from '@/utils/jwt.js';
import logger from '@/utils/logger.js';

// 날씨(관리) 상태 결정
// healthy: 잘 관리됨 ✨
// alert: 변화 감지! 🔔
// hungry: 관리 필요 (3일 이상) 😢
// cobweb: 오래 방치됨 (7일 이상) 🕸️
// infested: 심각하게 방치됨 (14일 이상) 🪳
function getWeatherStatus(tracking) {
  if (!tracking) return 'healthy'; // 트래킹 없으면 건강
  
  // 변화 감지 여부 확인
  const status = tracking.last_status?.toLowerCase() || '';
  if (status.includes('detect') || status.includes('변화') || status.includes('alert') || status.includes('changed')) {
    return 'alert';
  }
  
  // 마지막 확인 시간 기준
  if (!tracking.last_checked_at) return 'cobweb'; // 한 번도 확인 안 됨
  
  const lastChecked = new Date(tracking.last_checked_at);
  const now = new Date();
  const daysDiff = (now - lastChecked) / (1000 * 60 * 60 * 24);
  
  if (daysDiff >= 14) return 'infested';  // 🪳 14일 이상
  if (daysDiff >= 7) return 'cobweb';     // 🕸️ 7일 이상
  if (daysDiff >= 3) return 'hungry';     // 😢 3일 이상
  
  return 'healthy'; // ✨ 잘 관리됨
}

// GET: 포트폴리오 조회
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    let portfolios;
    if (userId) {
      portfolios = Portfolio.findByUserId(userId);
    } else {
      portfolios = Portfolio.findAll();
    }

    // 이미지 URL 처리 + 트래킹 정보 추가
    const portfoliosWithDetails = portfolios.map(portfolio => {
      const trackings = PortfolioTracking.findByPortfolioId(portfolio.id);
      const tracking = trackings.length > 0 ? trackings[0] : null;
      
      return {
        ...portfolio,
        image_url: getImageUrl(portfolio.image_url, portfolio.title),
        tracking: tracking,
        weather_status: getWeatherStatus(tracking),
      };
    });

    return Response.json(portfoliosWithDetails);
  } catch (error) {
    logger.logError(error, { endpoint: '/api/portfolios', method: 'GET' });
    return Response.json({ error: 'Failed to fetch portfolios' }, { status: 500 });
  }
}

// POST: 포트폴리오 등록
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
    const { title, content, status, order, image_url, tracking_url, tracking_prompt } = body;

    if (!title) {
      return Response.json({ error: 'Title is required' }, { status: 400 });
    }

    // order가 없거나 0이면 자동으로 마지막 순서 + 1로 설정
    let finalOrder = order;
    if (!order || order === 0) {
      const maxOrder = Portfolio.getMaxOrder(payload.userId);
      finalOrder = maxOrder + 1;
    }

    // 포트폴리오 생성
    const portfolio = Portfolio.create({
      userId: payload.userId,
      title,
      content: content || null,
      status: status || 'active',
      order: finalOrder,
      imageUrl: image_url || null,
    });

    // 트래킹 정보가 있으면 함께 생성
    let tracking = null;
    if (tracking_url && tracking_prompt) {
      tracking = PortfolioTracking.create({
        portfolioId: portfolio.id,
        url: tracking_url,
        logicPrompt: tracking_prompt,
      });
    }

    // 이미지 URL 처리
    const portfolioWithDetails = {
      ...portfolio,
      image_url: getImageUrl(portfolio.image_url, portfolio.title),
      tracking: tracking,
      weather_status: getWeatherStatus(tracking),
    };

    return Response.json(portfolioWithDetails, { status: 201 });
  } catch (error) {
    logger.logError(error, { endpoint: '/api/portfolios', method: 'POST' });
    return Response.json({ error: 'Failed to create portfolio' }, { status: 500 });
  }
}
