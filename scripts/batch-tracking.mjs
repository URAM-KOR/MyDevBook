#!/usr/bin/env node

/**
 * 배치 트래킹 체크 스크립트
 * 크론에서 직접 실행: node scripts/batch-tracking.mjs
 * 
 * 환경 변수:
 * - NODE_ENV: production
 * - DB_HOST: PostgreSQL 호스트 (기본값: localhost)
 * - DB_PORT: PostgreSQL 포트 (기본값: 5432)
 * - DB_NAME: PostgreSQL 데이터베이스 이름 (기본값: fairyquest)
 * - DB_USER: PostgreSQL 사용자 (기본값: fairyquest_user)
 * - DB_PASSWORD: PostgreSQL 비밀번호
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

// CommonJS 모듈 임포트 (require 사용)
const logger = require('../src/utils/logger.js');
const PortfolioTracking = require('../src/models/PortfolioTracking.js');
const Notification = require('../src/models/Notification.js');
const Portfolio = require('../src/models/Portfolio.js');
const PushSubscription = require('../src/models/PushSubscription.js');
const db = require('../src/utils/db.js');

// 개별 트래킹 체크
async function checkTracking(tracking) {
  const portfolio = await Portfolio.findById(tracking.portfolio_id);
  
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
    await browser.close();
  } catch (error) {
    return { trackingId: tracking.id, error: `Failed to fetch: ${error.message}` };
  }

  // 2. GPT로 현재 값 추출 + 상태 판단 (한 번에 처리)
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const targetKey = tracking.target_key || '핵심 값';
  const truncatedData = pageData.substring(0, 30000);
  const currentDate = new Date().toISOString().split('T')[0];

  let newValue = null;
  let shouldAlert = false;
  let weatherStatus = '';
  let statusReason = '';
  let encouragementMessage = null;

  if (tracking.logic_prompt) {
    // 현재 값 추출 + 상태 판단 + 격려 메시지 생성을 한 번에 처리
    const model = process.env.OPENAI_MODEL || 'o1-preview';
    const analysisParams = {
      model: model,
      messages: [
        {
          role: 'system',
          content: `당신은 포트폴리오 데이터를 분석하고 건강 상태를 판단하며, 사용자에게 자극적인 격려 메시지를 제공하는 전문가입니다.

포트폴리오 제목: ${portfolio.title}
추적 대상: ${targetKey}
알림 조건: ${tracking.logic_prompt}
현재 날짜: ${currentDate}

**작업 순서:**

1단계: 현재 값 추출
- 데이터에서 "${targetKey}"와 관련된 정보를 찾으세요
- 찾은 값을 **있는 그대로** 복사하세요 (예: "4 days ago"면 "4 days ago"로, "150"이면 "150"으로)
- 번역하거나 변환하지 마세요

2단계: 알림 조건 해석 및 평가
- 알림 조건 "${tracking.logic_prompt}"의 의미를 정확히 파악하세요
- 조건은 다양한 형태일 수 있습니다:
  * 기간 조건: "이틀이상 지나면", "3일 이상" 등
  * 수치 조건: "100 이상이면", "50개 넘으면" 등
  * 상태 조건: "변경되면", "완료되면" 등
  * 기타 사용자가 정의한 조건
- 추출한 현재 값이 이 조건을 충족하는지 논리적으로 판단하세요

3단계: 알림 조건 충족 여부 판단
- 조건 충족 → shouldAlert: true
- 조건 미충족 → shouldAlert: false

4단계: 상태 결정
- 현재 값의 특성과 상황의 심각도를 종합적으로 판단하여 상태를 결정하세요
- **shouldAlert가 true인 경우 (조건 충족)**:
  * 조건이 방금 충족됨 (경미한 이탈) → "alert"
  * 조건이 약간 초과됨 (중간 정도 이탈) → "hungry"
  * 조건이 상당히 초과됨 (큰 이탈) → "cobweb"
  * 조건이 매우 초과됨 (극심한 이탈) → "infested"
  * 예: "2일 이상" 조건에서 "last week" (일주일 전)는 상당히 초과이므로 "cobweb" 또는 "infested"
  * 예: "100 이상" 조건에서 "150"은 약간 초과이므로 "hungry"
- **shouldAlert가 false인 경우 (조건 미충족)**:
  * 최근/정상적/양호한 상태 → "healthy"
  * 약간 부족/미흡한 상태 → "hungry"
  * 상당히 부족/문제가 있는 상태 → "cobweb"
  * 매우 부족/심각한 상태 → "infested"
- **범용성**: 기간뿐만 아니라 수치, 상태 등 모든 종류의 조건에 적용 가능하도록 판단하세요
- **중요**: 조건이 충족되고 한참 넘었으면 더 심각한 상태를 선택하세요. 무조건 "alert"만 선택하지 마세요

5단계: 격려 메시지 생성
- 판단된 상태(status)에 따라 자극적이고 마음을 긁는 메시지를 작성하세요
- 상태가 안 좋을수록 더 자극적으로 작성하세요
- 사용자가 "아, 이렇게 살면 안 되겠구나"라고 생각하게 만드세요
- **매번 다른 표현으로 작성하세요. 같은 문구를 반복하지 마세요**

상태별 톤 가이드 (예시는 참고용, 매번 다른 표현 사용):
- healthy: "잘하고 있어요! 계속 이렇게만!" / "훌륭해요! 이 기세 유지하세요!" (격려, 다양한 표현)
- alert: "조건 충족됐어요. 이제 뭐 할 거예요?" / "이미 조건 넘었는데요?" / "조건 충족했어요. 다음은?" (자극적 질문, 다양한 표현)
- hungry: "이미 목표를 이뤄서 안 하고 있나요?" / "목표 달성했으니 이제 안 해도 되나요?" / "이미 끝났다고 생각하시나요?" (의심과 자극, 다양한 표현)
- cobweb: "이렇게 살 거예요? 정말요?" / "이대로 괜찮다고 생각하세요?" / "이 상태로 만족하시나요?" (강한 자극과 질문, 다양한 표현)
- infested: "이미 포기한 거 아니에요? 이대로 괜찮아요?" / "정말 이렇게 계속할 거예요?" / "포기하신 건가요?" (매우 강한 자극, 다양한 표현)

**중요:** 
- 알림 조건이 충족되면 shouldAlert: true로 설정하세요.
- 하지만 status는 조건 충족 정도에 따라 적절히 선택하세요. 무조건 "alert"만 선택하지 마세요.
- 조건의 의미를 정확히 이해하고 논리적으로 판단하세요.
- encouragementMessage는 한 문장으로 간결하고 자극적으로 (30자 이내) 작성하세요.
- encouragementMessage는 매번 다른 표현으로 작성하세요. 같은 문구를 반복하지 마세요.

JSON 응답 (reason은 30자 이내, encouragementMessage는 30자 이내):
{"currentValue": "추출한 현재 값", "shouldAlert": boolean, "status": "상태값", "reason": "짧은 이유", "encouragementMessage": "자극적인 격려 메시지"}`
        },
        {
          role: 'user',
          content: `데이터를 분석하여 현재 값을 추출하고 상태를 판단한 후, 자극적인 격려 메시지를 생성하세요.\n\n데이터:\n${truncatedData}`
        }
      ],
      response_format: { type: "json_object" },
    };

    // o1, gpt-5 모델은 max_completion_tokens 사용, 다른 모델은 max_tokens 사용
    if (model.startsWith('o1') || model.startsWith('gpt-5')) {
      analysisParams.max_completion_tokens = 250;
    } else {
      analysisParams.max_tokens = 250;
      analysisParams.temperature = 0.7; // 격려 메시지 다양성을 위해 temperature 증가
    }

    const analysisResult = await openai.chat.completions.create(analysisParams);
    const responseText = analysisResult.choices[0]?.message?.content || '{}';
    
    logger.info('GPT 분석 응답 수신', { 
      portfolioId: tracking.portfolio_id,
      responseLength: responseText.length,
      responsePreview: responseText.substring(0, 200)
    });
    
    try {
      const parsed = JSON.parse(responseText);
      
      logger.info('GPT 응답 파싱 성공', { 
        portfolioId: tracking.portfolio_id,
        parsedKeys: Object.keys(parsed),
        parsed: JSON.stringify(parsed)
      });
      
      // currentValue 검증
      if (!parsed.currentValue || typeof parsed.currentValue !== 'string') {
        logger.error('currentValue 검증 실패', { 
          portfolioId: tracking.portfolio_id,
          currentValue: parsed.currentValue,
          type: typeof parsed.currentValue,
          fullResponse: JSON.stringify(parsed)
        });
        throw new Error(`currentValue 필드가 없거나 유효하지 않습니다. 값: ${parsed.currentValue}, 타입: ${typeof parsed.currentValue}`);
      }
      newValue = parsed.currentValue;
      
      // 필수 필드 검증
      if (typeof parsed.shouldAlert !== 'boolean') {
        logger.error('shouldAlert 검증 실패', { 
          portfolioId: tracking.portfolio_id,
          shouldAlert: parsed.shouldAlert,
          type: typeof parsed.shouldAlert,
          fullResponse: JSON.stringify(parsed)
        });
        throw new Error(`Invalid shouldAlert value: ${parsed.shouldAlert} (type: ${typeof parsed.shouldAlert})`);
      }
      if (!parsed.status || typeof parsed.status !== 'string') {
        logger.error('status 검증 실패', { 
          portfolioId: tracking.portfolio_id,
          status: parsed.status,
          type: typeof parsed.status,
          fullResponse: JSON.stringify(parsed)
        });
        throw new Error(`Invalid status value: ${parsed.status} (type: ${typeof parsed.status})`);
      }
      
      shouldAlert = parsed.shouldAlert === true;
      // 유효한 상태값인지 검증
      const validStatuses = ['healthy', 'alert', 'hungry', 'cobweb', 'infested'];
      if (!validStatuses.includes(parsed.status)) {
        logger.error('status 값이 유효하지 않음', { 
          portfolioId: tracking.portfolio_id,
          status: parsed.status,
          validStatuses,
          fullResponse: JSON.stringify(parsed)
        });
        throw new Error(`Invalid status: ${parsed.status}. Must be one of: ${validStatuses.join(', ')}`);
      }
      weatherStatus = parsed.status;
      statusReason = parsed.reason || '';
      
      // encouragementMessage 추출 (선택적)
      encouragementMessage = parsed.encouragementMessage || null;
      
      logger.info('GPT 분석 결과 추출 완료', { 
        portfolioId: tracking.portfolio_id,
        newValue,
        shouldAlert,
        weatherStatus,
        statusReason,
        encouragementMessage
      });
    } catch (parseError) {
      const errorMessage = parseError instanceof Error 
        ? parseError.message 
        : 'JSON 파싱 실패';
      logger.error('GPT 응답 파싱 실패', { 
        portfolioId: tracking.portfolio_id,
        error: errorMessage,
        responseText: responseText,
        responseLength: responseText.length
      });
      throw new Error(`분석 응답 파싱 실패: ${errorMessage}. 응답: ${responseText.substring(0, 500)}`);
    }
  } else {
    // 알림 조건이 없으면 현재 값 추출 + 상태 판단 + 격려 메시지 생성을 한 번에 처리
    const model = process.env.OPENAI_MODEL || 'o1-preview';
    const analysisParams = {
      model: model,
      messages: [
        {
          role: 'system',
          content: `당신은 포트폴리오 데이터를 분석하고 건강 상태를 판단하며, 사용자에게 자극적인 격려 메시지를 제공하는 전문가입니다.

포트폴리오 제목: ${portfolio.title}
추적 대상: ${targetKey}
알림 조건: 없음 (상태만 판단)
현재 날짜: ${currentDate}

**작업 순서:**

1단계: 현재 값 추출
- 데이터에서 "${targetKey}"와 관련된 정보를 찾으세요
- 찾은 값을 **있는 그대로** 복사하세요 (예: "4 days ago"면 "4 days ago"로, "150"이면 "150"으로)
- 번역하거나 변환하지 마세요

2단계: 상태 결정 (알림 조건 없음)
- 현재 값의 특성에 따라 상태를 판단하세요:
  * 최근/정상적 활동 → "healthy"
  * 약간 지연/부족 → "hungry"
  * 오래 지연/부족 → "cobweb"
  * 매우 오래 지연/부족 → "infested"
- 알림 조건이 없으므로 shouldAlert는 항상 false입니다

3단계: 격려 메시지 생성
- 판단된 상태(status)에 따라 자극적이고 마음을 긁는 메시지를 작성하세요
- 상태가 안 좋을수록 더 자극적으로 작성하세요
- 사용자가 "아, 이렇게 살면 안 되겠구나"라고 생각하게 만드세요

상태별 톤 가이드:
- healthy: "잘하고 있어요! 계속 이렇게만!" (격려)
- alert: "조건 충족됐어요. 이제 뭐 할 거예요?" (자극적 질문)
- hungry: "이미 목표를 이뤄서 안 하고 있나요?" (의심과 자극)
- cobweb: "이렇게 살 거예요? 정말요?" (강한 자극과 질문)
- infested: "이미 포기한 거 아니에요? 이대로 괜찮아요?" (매우 강한 자극)

**중요:** 
- encouragementMessage는 한 문장으로 간결하고 자극적으로 (30자 이내) 작성하세요.

JSON 응답 (reason은 30자 이내, encouragementMessage는 30자 이내):
{"currentValue": "추출한 현재 값", "shouldAlert": false, "status": "상태값", "reason": "짧은 이유", "encouragementMessage": "자극적인 격려 메시지"}`
        },
        {
          role: 'user',
          content: `데이터를 분석하여 현재 값을 추출하고 상태를 판단한 후, 자극적인 격려 메시지를 생성하세요.\n\n데이터:\n${truncatedData}`
        }
      ],
      response_format: { type: "json_object" },
    };

    // o1, gpt-5 모델은 max_completion_tokens 사용, 다른 모델은 max_tokens 사용
    if (model.startsWith('o1') || model.startsWith('gpt-5')) {
      analysisParams.max_completion_tokens = 250;
    } else {
      analysisParams.max_tokens = 250;
      analysisParams.temperature = 0.7; // 격려 메시지 다양성을 위해 temperature 증가
    }

    const analysisResult = await openai.chat.completions.create(analysisParams);
    const responseText = analysisResult.choices[0]?.message?.content || '{}';
    
    logger.info('GPT 분석 응답 수신 (알림 조건 없음)', { 
      portfolioId: tracking.portfolio_id,
      responseLength: responseText.length,
      responsePreview: responseText.substring(0, 200)
    });
    
    try {
      const parsed = JSON.parse(responseText);
      
      logger.info('GPT 응답 파싱 성공 (알림 조건 없음)', { 
        portfolioId: tracking.portfolio_id,
        parsedKeys: Object.keys(parsed),
        parsed: JSON.stringify(parsed)
      });
      
      // currentValue 검증
      if (!parsed.currentValue || typeof parsed.currentValue !== 'string') {
        logger.error('currentValue 검증 실패 (알림 조건 없음)', { 
          portfolioId: tracking.portfolio_id,
          currentValue: parsed.currentValue,
          type: typeof parsed.currentValue,
          fullResponse: JSON.stringify(parsed)
        });
        throw new Error(`currentValue 필드가 없거나 유효하지 않습니다. 값: ${parsed.currentValue}, 타입: ${typeof parsed.currentValue}`);
      }
      newValue = parsed.currentValue;
      
      // 필수 필드 검증
      if (typeof parsed.shouldAlert !== 'boolean') {
        logger.error('shouldAlert 검증 실패 (알림 조건 없음)', { 
          portfolioId: tracking.portfolio_id,
          shouldAlert: parsed.shouldAlert,
          type: typeof parsed.shouldAlert,
          fullResponse: JSON.stringify(parsed)
        });
        throw new Error(`Invalid shouldAlert value: ${parsed.shouldAlert} (type: ${typeof parsed.shouldAlert})`);
      }
      if (!parsed.status || typeof parsed.status !== 'string') {
        logger.error('status 검증 실패 (알림 조건 없음)', { 
          portfolioId: tracking.portfolio_id,
          status: parsed.status,
          type: typeof parsed.status,
          fullResponse: JSON.stringify(parsed)
        });
        throw new Error(`Invalid status value: ${parsed.status} (type: ${typeof parsed.status})`);
      }
      
      shouldAlert = false; // 알림 조건이 없으므로 항상 false
      // 유효한 상태값인지 검증
      const validStatuses = ['healthy', 'alert', 'hungry', 'cobweb', 'infested'];
      if (!validStatuses.includes(parsed.status)) {
        logger.error('status 값이 유효하지 않음 (알림 조건 없음)', { 
          portfolioId: tracking.portfolio_id,
          status: parsed.status,
          validStatuses,
          fullResponse: JSON.stringify(parsed)
        });
        throw new Error(`Invalid status: ${parsed.status}. Must be one of: ${validStatuses.join(', ')}`);
      }
      weatherStatus = parsed.status;
      statusReason = parsed.reason || '';
      
      // encouragementMessage 추출 (선택적)
      encouragementMessage = parsed.encouragementMessage || null;
      
      logger.info('GPT 분석 결과 추출 완료 (알림 조건 없음)', { 
        portfolioId: tracking.portfolio_id,
        newValue,
        shouldAlert,
        weatherStatus,
        statusReason,
        encouragementMessage
      });
    } catch (parseError) {
      const errorMessage = parseError instanceof Error 
        ? parseError.message 
        : 'JSON 파싱 실패';
      logger.error('GPT 응답 파싱 실패 (알림 조건 없음)', { 
        portfolioId: tracking.portfolio_id,
        error: errorMessage,
        responseText: responseText,
        responseLength: responseText.length
      });
      throw new Error(`분석 응답 파싱 실패: ${errorMessage}. 응답: ${responseText.substring(0, 500)}`);
    }
  }

  // 포트폴리오 이미지 URL 가져오기
  const { getImageUrl } = require('../src/utils/imageHelper.js');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';
  let portfolioImageUrl = getImageUrl(portfolio.image_url, portfolio.title);
  
  // 상대 경로인 경우 절대 URL로 변환
  if (portfolioImageUrl && !portfolioImageUrl.startsWith('http')) {
    portfolioImageUrl = `${baseUrl}${portfolioImageUrl}`;
  }

  return {
    trackingId: tracking.id,
    portfolioId: tracking.portfolio_id,
    portfolioTitle: portfolio.title,
    portfolioImageUrl: portfolioImageUrl,
    userId: portfolio.user_id,
    targetKey,
    oldValue: tracking.current_value,
    newValue,
    shouldAlert,
    weatherStatus,
    encouragementMessage,
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

    const subscriptions = await PushSubscription.findByUserId(userId);
    
    logger.info('Sending push notification', { 
      userId, 
      subscriptionCount: subscriptions.length,
      payload: JSON.stringify(payload)
    });
    
    if (subscriptions.length === 0) {
      logger.warn('No push subscriptions found for user', { userId });
      return;
    }
    
    let successCount = 0;
    let failCount = 0;
    
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          JSON.stringify(payload)
        );
        successCount++;
        logger.info('Push notification sent successfully', { 
          userId, 
          endpoint: sub.endpoint.substring(0, 50) + '...' 
        });
      } catch (error) {
        failCount++;
        logger.logError(error, { 
          endpoint: sub.endpoint.substring(0, 50) + '...',
          statusCode: error.statusCode,
          message: error.message
        });
        // 만료된 구독 삭제
        if (error.statusCode === 404 || error.statusCode === 410) {
          logger.info('Deleting expired push subscription', { subscriptionId: sub.id });
          await PushSubscription.delete(sub.id);
        }
      }
    }
    
    logger.info('Push notification summary', { 
      userId, 
      total: subscriptions.length,
      success: successCount,
      failed: failCount
    });
  } catch (error) {
    logger.logError(error, { action: 'sendPushNotification', userId });
  }
}

// 권한 체크 함수
function checkPermissions() {
  // 실행 사용자 확인
  if (process.platform !== 'win32') {
    const { execSync } = require('child_process');
    try {
      const currentUser = execSync('whoami', { encoding: 'utf-8' }).trim();
      const currentUid = process.getuid ? process.getuid() : null;
      
      logger.info('Batch script executed by', { user: currentUser, uid: currentUid });
      
      // root 사용자로 실행되는 것 방지 (선택적)
      if (currentUid === 0) {
        logger.warn('Root 사용자로 실행 중입니다. 보안상 권장되지 않습니다.');
      }
    } catch (error) {
      logger.warn('사용자 정보를 가져올 수 없습니다', { error: error.message });
    }
  }
  
  // 필수 환경 변수 확인
  const requiredEnvVars = ['OPENAI_API_KEY', 'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missingVars = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missingVars.length > 0) {
    throw new Error(`필수 환경 변수가 설정되지 않았습니다: ${missingVars.join(', ')}`);
  }
  
  // BATCH_SECRET 확인 (선택적, 설정되어 있으면 검증)
  const batchSecret = process.env.BATCH_SECRET;
  if (batchSecret && batchSecret === 'your-batch-secret-key') {
    logger.warn('BATCH_SECRET이 기본값입니다. 보안을 위해 변경해주세요.');
  }
  
  return true;
}

// 메인 실행 함수
async function main() {
  try {
    // 권한 체크
    checkPermissions();
    
    logger.info('Batch tracking check started');

    // 체크가 필요한 트래킹 목록 조회
    const trackings = await PortfolioTracking.findPendingChecks();
    
    logger.info(`Found ${trackings.length} trackings to check`);

    const results = [];

    for (const tracking of trackings) {
      try {
        const result = await checkTracking(tracking);
        results.push(result);
        
        // 알림 조건 충족 시 알림 생성 + Push 전송 (notification_enabled가 true일 때만)
        if (result.shouldAlert && tracking.notification_enabled !== false) {
          try {
            // 격려/쓴소리 문구가 있으면 메시지에 포함
            let notificationMessage = `현재 값: ${result.newValue}\n조건: ${tracking.logic_prompt}`;
            if (result.encouragementMessage) {
              notificationMessage += `\n\n✨ ${result.encouragementMessage}`;
            }
            
            await Notification.create({
              userId: result.userId,
              portfolioId: tracking.portfolio_id,
              type: 'alert',
              title: `🔔 ${result.portfolioTitle}`,
              message: notificationMessage,
            });
            
            // Push 알림 전송 (격려 문구 포함)
            let pushBody = `현재 값: ${result.newValue}`;
            if (result.encouragementMessage) {
              pushBody += `\n\n${result.encouragementMessage}`;
            }
            
            await sendPushNotification(result.userId, {
              title: `🔔 ${result.portfolioTitle}`,
              body: pushBody,
              url: `/portfolios`,
              portfolioId: tracking.portfolio_id,
              image: result.portfolioImageUrl, // 포트폴리오 이미지 추가
            });
            
            logger.info('Alert notification created and pushed', { 
              portfolioId: tracking.portfolio_id, 
              newValue: result.newValue,
              encouragementMessage: result.encouragementMessage
            });
          } catch (notificationError) {
            // 알림 전송 실패해도 계속 진행 (격려 문구 생성 실패와 무관하게)
            logger.logError(notificationError, { 
              action: 'sendNotification', 
              portfolioId: tracking.portfolio_id,
              shouldAlert: result.shouldAlert
            });
          }
        }
        
        // updated_at 업데이트 (메타데이터 필드 제거로 간소화)
        await db.prepare('UPDATE portfolio_trackings SET updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(tracking.id);
        logger.info('트래킹 업데이트 시간 갱신', { 
          trackingId: tracking.id,
          portfolioId: tracking.portfolio_id
        });
        
        // current_value 업데이트
        if (result.newValue) {
          const oldValue = await db.prepare('SELECT current_value FROM portfolio_trackings WHERE id = ?').get(tracking.id);
          const updateResult = await db.prepare('UPDATE portfolio_trackings SET current_value = ? WHERE id = ?')
            .run(result.newValue, tracking.id);
          logger.info('current_value 업데이트', { 
            trackingId: tracking.id,
            portfolioId: tracking.portfolio_id,
            oldValue: oldValue?.current_value,
            newValue: result.newValue,
            changes: updateResult.changes
          });
        } else {
          logger.warn('current_value가 없어서 업데이트하지 않음', { 
            trackingId: tracking.id,
            portfolioId: tracking.portfolio_id
          });
        }
        
        // weather_status 업데이트 (PortfolioTracking 테이블)
        if (result.weatherStatus) {
          const oldWeatherStatus = await db.prepare('SELECT weather_status FROM portfolio_trackings WHERE id = ?').get(tracking.id);
          const updateResult = await db.prepare('UPDATE portfolio_trackings SET weather_status = ? WHERE id = ?')
            .run(result.weatherStatus, tracking.id);
          logger.info('weather_status 업데이트', { 
            trackingId: tracking.id,
            portfolioId: tracking.portfolio_id,
            oldWeatherStatus: oldWeatherStatus?.weather_status,
            newWeatherStatus: result.weatherStatus,
            changes: updateResult.changes
          });
        } else {
          logger.warn('weatherStatus가 없어서 업데이트하지 않음', { 
            trackingId: tracking.id,
            portfolioId: tracking.portfolio_id
          });
        }
        
        // encouragement_message 업데이트 (PortfolioTracking 테이블)
        if (result.encouragementMessage) {
          const oldEncouragement = await db.prepare('SELECT encouragement_message FROM portfolio_trackings WHERE id = ?').get(tracking.id);
          const updateResult = await db.prepare('UPDATE portfolio_trackings SET encouragement_message = ? WHERE id = ?')
            .run(result.encouragementMessage, tracking.id);
          logger.info('encouragement_message 업데이트', { 
            trackingId: tracking.id,
            portfolioId: tracking.portfolio_id,
            oldEncouragement: oldEncouragement?.encouragement_message,
            newEncouragement: result.encouragementMessage,
            changes: updateResult.changes
          });
        } else {
          logger.info('encouragementMessage가 없어서 업데이트하지 않음', { 
            trackingId: tracking.id,
            portfolioId: tracking.portfolio_id
          });
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
  } catch (error) {
    logger.logError(error, { action: 'batch-tracking' });
    console.error('❌ 배치 실행 실패:', error.message);
    process.exit(1);
  } finally {
    db.close();
  }
}

// 실행
main();

