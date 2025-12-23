import Portfolio from '@/models/Portfolio.js';
import PortfolioTracking from '@/models/PortfolioTracking.js';
import { getImageUrl } from '@/utils/imageHelper.js';
import { verifyToken } from '@/utils/jwt.js';
import logger from '@/utils/logger.js';


// GET: 포트폴리오 조회
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    let portfolios;
    if (userId) {
      portfolios = await Portfolio.findByUserId(userId);
    } else {
      portfolios = await Portfolio.findAll();
    }

    // 이미지 URL 처리 + 트래킹 정보 추가
    const portfoliosWithDetails = await Promise.all(portfolios.map(async (portfolio) => {
      const trackings = await PortfolioTracking.findByPortfolioId(portfolio.id);
      const tracking = trackings.length > 0 ? trackings[0] : null;
      
      return {
        ...portfolio,
        image_url: getImageUrl(portfolio.image_url, portfolio.title),
        tracking: tracking,
        // 트래킹의 weather_status와 encouragement_message 사용 (GPT 응답으로 업데이트됨)
        weather_status: tracking?.weather_status || 'healthy',
        encouragement_message: tracking?.encouragement_message || null,
        // 편집 시 사용할 플랫 필드
        tracking_url: tracking?.url || null,
        tracking_prompt: tracking?.logic_prompt || null,
        auth_type: tracking?.auth_type || 'none',
        current_value: tracking?.current_value || null,
        target_key: tracking?.target_key || null,
        notification_enabled: tracking?.notification_enabled !== false,
      };
    }));

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
    const { title, content, status, order, image_url, tracking_url, tracking_prompt, auth_token, auth_type, current_value, target_key } = body;

    if (!title) {
      return Response.json({ error: 'Title is required' }, { status: 400 });
    }

    // order가 없거나 0이면 자동으로 마지막 순서 + 1로 설정
    let finalOrder = order;
    if (!order || order === 0) {
      const maxOrder = await Portfolio.getMaxOrder(payload.userId);
      finalOrder = maxOrder + 1;
    }

    // 포트폴리오 생성
    const portfolio = await Portfolio.create({
      userId: payload.userId,
      title,
      content: content || null,
      status: status || 'active',
      order: finalOrder,
      imageUrl: image_url || null,
    });

    // 트래킹 정보가 있으면 함께 생성
    let tracking = null;
    if (tracking_url) {
      tracking = await PortfolioTracking.create({
        portfolioId: portfolio.id,
        url: tracking_url,
        logicPrompt: tracking_prompt || null,
        authToken: auth_token || null,
        authType: auth_type || 'none',
        currentValue: current_value || null,
        targetKey: target_key || null,
      });
    }

    // 이미지 URL 처리
    const portfolioWithDetails = {
      ...portfolio,
      image_url: getImageUrl(portfolio.image_url, portfolio.title),
      tracking: tracking,
      weather_status: tracking?.weather_status || 'healthy',
      encouragement_message: tracking?.encouragement_message || null,
    };

    return Response.json(portfolioWithDetails, { status: 201 });
  } catch (error) {
    logger.logError(error, { endpoint: '/api/portfolios', method: 'POST' });
    return Response.json({ error: 'Failed to create portfolio' }, { status: 500 });
  }
}
