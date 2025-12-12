#!/usr/bin/env node

/**
 * 배치 트래킹 체크 스크립트
 * 크론에서 직접 실행: node scripts/batch-tracking.js
 * 
 * 환경 변수:
 * - NODE_ENV: production
 * - DB_PATH: 데이터베이스 경로
 * - OPENAI_API_KEY: OpenAI API 키
 * - VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT: Web Push 설정
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// 현재 파일의 디렉토리
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 프로젝트 루트로 이동
process.chdir(join(__dirname, '..'));

// .env 파일 로드 (dotenv 없이 직접 읽기)
try {
  const envPath = join(__dirname, '..', '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
} catch (error) {
  console.warn('⚠️  .env 파일을 읽을 수 없습니다:', error.message);
}

// Next.js 경로 별칭 설정을 위한 경로 매핑
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// 모듈 임포트 (상대 경로 사용)
const logger = (await import('../src/utils/logger.js')).default;
const PortfolioTracking = (await import('../src/models/PortfolioTracking.js')).default;
const Notification = (await import('../src/models/Notification.js')).default;
const Portfolio = (await import('../src/models/Portfolio.js')).default;
const PushSubscription = (await import('../src/models/PushSubscription.js')).default;
const db = (await import('../src/utils/db.js')).default;

// 개별 트래킹 체크
async function checkTracking(tracking) {
  const portfolio = Portfolio.findById(tracking.portfolio_id);
  
  if (!portfolio) {
    return { trackingId: tracking.id, error: 'Portfolio not found' };
  }

  // 1. URL에서 데이터 가져오기
  let pageData;
  try {
    const puppeteer = (await import('puppeteer')).default;
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    
    // 캐시 비활성화 + User-Agent 설정
    await page.setCacheEnabled(false);
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    await page.goto(tracking.url, { waitUntil: 'networkidle2', timeout: 30000 });
    // 동적 페이지 렌더링 대기
    await new Promise(resolve => setTimeout(resolve, 3000));

    // GitHub 저장소일 경우: 마지막 커밋 시간 힌트 추가 (relative-time)
    let githubCommitHint = '';
    if (tracking.url.includes('github.com')) {
      try {
        const commitTime = await page.$eval('relative-time', el => el.innerText.trim());
        if (commitTime) {
          githubCommitHint = `LATEST_COMMIT_TIME: ${commitTime}\n`;
        }
      } catch (e) {
        // 힌트 추출 실패 시 무시
      }
    }
    
    // 모든 텍스트 추출 (Shadow DOM 포함, 범용)
    pageData = await page.evaluate(() => {
      function getAllText(node) {
        let text = '';
        
        // Shadow DOM이 있으면 그 안의 텍스트도 추출
        if (node.shadowRoot) {
          text += getAllText(node.shadowRoot);
        }
        
        // 자식 노드 순회
        for (const child of node.childNodes) {
          if (child.nodeType === Node.TEXT_NODE) {
            text += child.textContent;
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            // script, style, noscript 태그는 제외 (사용자에게 안 보이는 코드)
            const tagName = child.tagName?.toLowerCase();
            if (tagName !== 'script' && tagName !== 'style' && tagName !== 'noscript') {
              text += getAllText(child);
            }
          }
        }
        
        return text;
      }
      
      return getAllText(document.body);
    });
    pageData = `${githubCommitHint}${pageData}`;
    await browser.close();
  } catch (error) {
    return { trackingId: tracking.id, error: `Failed to fetch: ${error.message}` };
  }

  // 2. GPT로 현재 값 분석
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const targetKey = tracking.target_key || '핵심 값';
  const truncatedData = pageData.substring(0, 30000);

  const systemPrompt = `당신은 텍스트에서 특정 값을 정확하게 추출하는 전문가입니다.

**중요: 데이터에 있는 값을 그대로 복사해서 반환하세요. 절대 추측하거나 변환하지 마세요.**

사용자가 찾는 값: "${targetKey}"

규칙:
1. 데이터에서 "${targetKey}"와 관련된 부분을 찾으세요
2. 찾은 값을 **있는 그대로** 복사하세요 (예: "4 days ago"면 "4 days ago"로)
3. 번역하거나 변환하지 마세요
4. 가장 최신/대표적인 값을 선택하세요

응답 형식 (JSON만, 다른 텍스트 없이):
{"currentValue": "데이터에서 찾은 원본 값"}`;

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `"${targetKey}"을 찾아서 데이터에 있는 그대로 반환하세요.\n\n데이터:\n${truncatedData}`
      }
    ],
    max_tokens: 200,
    temperature: 0,
  });

  const responseText = completion.choices[0]?.message?.content || '';
  let newValue;
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      newValue = parsed.currentValue;
    }
  } catch {
    newValue = responseText;
  }

  // 3. 알림 조건 확인 + 상태 판단 (값 변경 여부와 관계없이 항상 체크)
  let shouldAlert = false;
  let weatherStatus = 'healthy';
  
  if (tracking.logic_prompt && newValue) {
    // GPT로 알림 조건 체크 + 상태 판단 (JSON 응답 강제)
    const alertCheck = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `포트폴리오 건강 상태를 판단하세요.

추적 대상: ${targetKey}
현재 값: ${newValue}
알림 조건: ${tracking.logic_prompt}

상태 선택:
- healthy: 정상, 문제없음
- alert: 알림 조건 충족됨
- hungry: 며칠~1주일 방치
- cobweb: 1~2주 방치
- infested: 2주 이상 방치

반드시 JSON으로 응답: {"shouldAlert": boolean, "status": "상태값"}`
        }
      ],
      max_tokens: 50,
      temperature: 0,
      response_format: { type: "json_object" },
    });
    
    const alertResponse = alertCheck.choices[0]?.message?.content || '{}';
    try {
      const parsed = JSON.parse(alertResponse);
      shouldAlert = parsed.shouldAlert === true;
      // 유효한 상태값인지 검증
      const validStatuses = ['healthy', 'alert', 'hungry', 'cobweb', 'infested'];
      weatherStatus = validStatuses.includes(parsed.status) ? parsed.status : 'healthy';
    } catch {
      // JSON 파싱 실패 시 기본값 유지
      shouldAlert = false;
      weatherStatus = 'healthy';
    }
  }

  return {
    trackingId: tracking.id,
    portfolioId: tracking.portfolio_id,
    userId: portfolio.user_id,
    targetKey,
    oldValue: tracking.current_value,
    newValue,
    shouldAlert,
    weatherStatus,
  };
}

// Push 알림 전송
async function sendPushNotification(userId, payload) {
  try {
    const webpush = (await import('web-push')).default;

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:test@example.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const subscriptions = PushSubscription.findByUserId(userId);
    
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          JSON.stringify(payload)
        );
        logger.info('Push notification sent', { userId });
      } catch (error) {
        logger.logError(error, { endpoint: sub.endpoint });
        // 만료된 구독 삭제
        if (error.statusCode === 404 || error.statusCode === 410) {
          PushSubscription.delete(sub.id);
        }
      }
    }
  } catch (error) {
    logger.logError(error, { action: 'sendPushNotification', userId });
  }
}

// 메인 실행 함수
async function main() {
  try {
    logger.info('Batch tracking check started');

    // 체크가 필요한 트래킹 목록 조회
    const trackings = PortfolioTracking.findPendingChecks();
    
    logger.info(`Found ${trackings.length} trackings to check`);

    const results = [];

    for (const tracking of trackings) {
      try {
        const result = await checkTracking(tracking);
        results.push(result);
        
        // 알림 조건 충족 시 알림 생성 + Push 전송
        if (result.shouldAlert) {
          Notification.create({
            userId: result.userId,
            portfolioId: tracking.portfolio_id,
            type: 'alert',
            title: `🔔 알림: ${result.targetKey}`,
            message: `현재 값: ${result.newValue}\n조건: ${tracking.logic_prompt}`,
          });
          
          // Push 알림 전송
          await sendPushNotification(result.userId, {
            title: `🔔 ${result.targetKey}`,
            body: `현재 값: ${result.newValue}`,
            url: `/portfolios`,
            portfolioId: tracking.portfolio_id,
          });
          
          logger.info('Alert notification created and pushed', { 
            portfolioId: tracking.portfolio_id, 
            newValue: result.newValue 
          });
        }
        
        // 상태 업데이트
        PortfolioTracking.updateStatus(tracking.id, result.newValue ? 'checked' : 'error');
        
        // current_value 업데이트
        if (result.newValue) {
          db.prepare('UPDATE portfolio_trackings SET current_value = ? WHERE id = ?')
            .run(result.newValue, tracking.id);
        }
        
        // weather_status 업데이트 (Portfolio 테이블)
        if (result.weatherStatus) {
          db.prepare('UPDATE portfolios SET weather_status = ? WHERE id = ?')
            .run(result.weatherStatus, tracking.portfolio_id);
        }
        
      } catch (error) {
        logger.logError(error, { trackingId: tracking.id });
        results.push({ trackingId: tracking.id, error: error.message });
      }
    }

    logger.info('Batch tracking check completed', { 
      total: trackings.length, 
      alerts: results.filter(r => r.shouldAlert).length 
    });

    console.log(`✅ 배치 완료: ${trackings.length}개 체크, ${results.filter(r => r.shouldAlert).length}개 알림`);
    process.exit(0);
  } catch (error) {
    logger.logError(error, { action: 'batch-tracking' });
    console.error('❌ 배치 실행 실패:', error.message);
    process.exit(1);
  }
}

// 실행
main();

