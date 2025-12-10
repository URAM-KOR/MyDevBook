import { verifyToken } from '@/utils/jwt.js';
import logger from '@/utils/logger.js';

// POST: URL 접근 가능 여부 확인 (Puppeteer로 렌더링 후 텍스트 추출)
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
    const { url } = body;

    if (!url) {
      return Response.json({ error: 'URL is required' }, { status: 400 });
    }

    // URL 형식 검증
    try {
      new URL(url);
    } catch {
      return Response.json({
        success: false,
        error: 'URL 형식이 올바르지 않습니다.',
      });
    }

    logger.info('URL check started with Puppeteer', { url });

    // API URL인지 확인 (JSON 응답 예상)
    const isApiUrl = url.includes('/api/') || 
                     url.includes('api.') || 
                     url.endsWith('.json');

    if (isApiUrl) {
      // API는 fetch로 처리
      return await fetchApiUrl(url);
    } else {
      // 웹 페이지는 Puppeteer로 처리
      return await fetchWithPuppeteer(url);
    }

  } catch (error) {
    logger.logError(error, { endpoint: '/api/tracking/check-url', method: 'POST' });
    return Response.json({ error: 'Failed to check URL' }, { status: 500 });
  }
}

// API URL은 fetch로 처리
async function fetchApiUrl(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return Response.json({
        success: false,
        error: `HTTP ${response.status} 오류`,
        statusCode: response.status,
      });
    }

    const data = await response.text();
    
    logger.info('API URL fetch successful', { url, dataLength: data.length });

    return Response.json({
      success: true,
      data: data,
      dataLength: data.length,
      method: 'fetch',
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: error.name === 'AbortError' ? '응답 시간 초과 (10초)' : '접근 실패',
    });
  }
}

// 웹 페이지는 Puppeteer로 처리
async function fetchWithPuppeteer(url) {
  let browser = null;
  
  try {
    const puppeteer = (await import('puppeteer')).default;
    
    logger.info('Launching Puppeteer browser');
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();
    
    // 타임아웃 설정
    page.setDefaultTimeout(30000);
    
    // User-Agent 설정
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    logger.info('Navigating to URL', { url });
    
    // 페이지 로드 (네트워크 idle 대기)
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // 추가 대기 (동적 콘텐츠 로드)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 페이지 텍스트 추출 (Ctrl+A 복사한 것처럼)
    const textContent = await page.evaluate(() => {
      // body 내의 모든 텍스트 추출
      return document.body.innerText;
    });

    await browser.close();
    browser = null;

    logger.info('Puppeteer extraction successful', { url, dataLength: textContent.length });

    return Response.json({
      success: true,
      data: textContent,
      dataLength: textContent.length,
      method: 'puppeteer',
    });

  } catch (error) {
    if (browser) {
      await browser.close();
    }
    
    logger.logError(error, { api: 'puppeteer', url });
    
    let errorMsg = '페이지 로드 실패';
    if (error.message?.includes('timeout')) {
      errorMsg = '페이지 로드 시간 초과 (30초)';
    } else if (error.message?.includes('net::')) {
      errorMsg = '네트워크 오류';
    }

    return Response.json({
      success: false,
      error: errorMsg,
      detail: error.message,
    });
  }
}
