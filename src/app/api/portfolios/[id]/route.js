import Portfolio from '@/models/Portfolio.js';
import { getImageUrl } from '@/utils/imageHelper.js';
import { verifyToken } from '@/utils/jwt.js';
import logger from '@/utils/logger.js';

// GET: 특정 포트폴리오 조회
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const portfolio = Portfolio.findById(id);

    if (!portfolio) {
      return Response.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // 이미지 URL 처리
    const portfolioWithImage = {
      ...portfolio,
      image_url: getImageUrl(portfolio.image_url, portfolio.title),
    };

    return Response.json(portfolioWithImage);
  } catch (error) {
    logger.logError(error, { endpoint: '/api/portfolios/[id]', method: 'GET' });
    return Response.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
  }
}

// PUT: 포트폴리오 수정
export async function PUT(request, { params }) {
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

    const { id } = params;
    const portfolio = Portfolio.findById(id);

    if (!portfolio) {
      return Response.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // 본인 포트폴리오인지 확인
    if (portfolio.user_id !== payload.userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, status, order, image_url } = body;

    const updatedPortfolio = Portfolio.update(id, {
      title,
      content,
      status,
      order,
      imageUrl: image_url,
    });

    // 이미지 URL 처리
    const portfolioWithImage = {
      ...updatedPortfolio,
      image_url: getImageUrl(updatedPortfolio.image_url, updatedPortfolio.title),
    };

    return Response.json(portfolioWithImage);
  } catch (error) {
    logger.logError(error, { endpoint: '/api/portfolios/[id]', method: 'PUT' });
    return Response.json({ error: 'Failed to update portfolio' }, { status: 500 });
  }
}

// DELETE: 포트폴리오 삭제
export async function DELETE(request, { params }) {
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

    const { id } = params;
    const portfolio = Portfolio.findById(id);

    if (!portfolio) {
      return Response.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // 본인 포트폴리오인지 확인
    if (portfolio.user_id !== payload.userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 관련 트래킹 먼저 삭제 (Foreign Key 제약)
    const PortfolioTracking = (await import('@/models/PortfolioTracking.js')).default;
    const trackings = PortfolioTracking.findByPortfolioId(id);
    for (const tracking of trackings) {
      PortfolioTracking.delete(tracking.id);
    }

    const deleted = Portfolio.delete(id);

    if (!deleted) {
      return Response.json({ error: 'Failed to delete portfolio' }, { status: 500 });
    }

    return Response.json({ message: 'Portfolio deleted successfully' });
  } catch (error) {
    logger.logError(error, { endpoint: '/api/portfolios/[id]', method: 'DELETE' });
    return Response.json({ error: 'Failed to delete portfolio' }, { status: 500 });
  }
}

