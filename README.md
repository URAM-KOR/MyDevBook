# MyDevBook

포트폴리오 관리 및 상태 추적 서비스

## 기술 스택

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (부분), JavaScript
- **Styling:** Tailwind CSS
- **Database:** SQLite + LiteFS
- **Authentication:** Google OAuth (jose JWT)
- **AI:** OpenAI GPT API
- **Logging:** Winston

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`을 참고하여 `.env` 파일을 생성하고 필요한 값들을 설정하세요.

```bash
cp .env.example .env
```

필수 환경 변수:
- `GOOGLE_CLIENT_ID`: Google OAuth 클라이언트 ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth 클라이언트 Secret
- `OPENAI_API_KEY`: OpenAI API 키
- `JWT_SECRET`: JWT 서명용 시크릿 키

선택 환경 변수:
- `LOG_LEVEL`: 로그 레벨 (default: `info`)
- `LOG_DIR`: 로그 파일 저장 경로 (default: `./logs`)

### 3. 데이터베이스 초기화

```bash
# 개발 서버 실행 후
curl http://localhost:3000/api/init
```

또는 브라우저에서 `http://localhost:3000/api/init` 접속

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 프로젝트 구조

```
/src
  /app          # Next.js App Router (페이지 및 API 라우트)
  /components   # UI 컴포넌트
  /pages        # 추가 페이지 (필요시)
  /utils        # 공통 유틸 함수
  /api          # API 호출 모듈
  /tests        # 테스트 파일
```

## 주요 기능

- ✅ Google OAuth 인증
- ✅ 포트폴리오 CRUD
- ✅ GPT 기반 상태 추적
- ✅ Web Push 알림
- ✅ 실시간 상태 모니터링

## 로깅

프로젝트는 Winston을 사용한 구조화된 로깅을 지원합니다.

- **로그 레벨**: `error`, `warn`, `info`, `debug` (환경 변수 `LOG_LEVEL`로 설정)
- **로그 파일**: `logs/error.log` (에러만), `logs/combined.log` (전체)
- **콘솔 출력**: 개발 환경에서 자동으로 콘솔에도 출력

```javascript
const logger = require('@/utils/logger');

logger.info('정보 메시지');
logger.error('에러 메시지');
logger.logError(error, { context: '추가 정보' });
logger.logDatabase('SELECT', 'users', { userId: '123' });
```

## 개발 가이드라인

자세한 내용은 `_docs/5.DevGuideline.md` 참고

- Indentation: 2 spaces
- Variables: camelCase
- Functions: verbNoun()
- Classes: PascalCase
- Constants: UPPER_SNAKE_CASE

