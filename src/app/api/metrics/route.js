import { NextResponse } from 'next/server';

// 메트릭 활성화 여부 (환경 변수로 제어)
const ENABLE_METRICS = process.env.ENABLE_METRICS === 'true';

export async function GET() {
  // 메트릭이 비활성화된 경우
  if (!ENABLE_METRICS) {
    return NextResponse.json(
      { message: 'Metrics are disabled in this environment' },
      { status: 404 }
    );
  }

  // 메트릭 활성화된 경우만 prom-client 로드
  const client = await import('prom-client');

  // 싱글톤 레지스트리 (한 번만 초기화)
  if (!global.metricsRegister) {
    global.metricsRegister = new client.Registry();

    // 기본 Node.js 메트릭 수집
    client.collectDefaultMetrics({
      register: global.metricsRegister,
      prefix: 'fairyquest_',
    });

    // 커스텀 메트릭 정의
    new client.Counter({
      name: 'fairyquest_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
      registers: [global.metricsRegister],
    });

    new client.Histogram({
      name: 'fairyquest_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
      registers: [global.metricsRegister],
    });

    new client.Gauge({
      name: 'fairyquest_active_users',
      help: 'Number of active users',
      registers: [global.metricsRegister],
    });

    const appInfo = new client.Gauge({
      name: 'fairyquest_app_info',
      help: 'Application information',
      labelNames: ['version', 'node_env'],
      registers: [global.metricsRegister],
    });

    // 앱 정보 설정
    appInfo.set({ version: '1.0.0', node_env: process.env.NODE_ENV || 'development' }, 1);
  }

  try {
    const metrics = await global.metricsRegister.metrics();
    
    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': global.metricsRegister.contentType,
      },
    });
  } catch (error) {
    console.error('Error generating metrics:', error);
    return NextResponse.json({ error: 'Failed to generate metrics' }, { status: 500 });
  }
}

// 빌드 시 정적 생성 방지
export const dynamic = 'force-dynamic';
