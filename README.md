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

  # 로드맵

### 1. 전체 리스트 상태 요약 + 상태 애니메이션 (우선순위 1위)
- **목표**: 로그인 후 바로 보이는 메인 대시보드 완성  
- **주요 요소**  
  - “오늘의 나의 정원” 또는 “오늘의 상태” 요약 화면  
  - 각 목표 카드: AI 판단 결과(점수, status) + 귀여운 애니메이션  
    (예: BeePal 날아다니기, EggPal 반짝이기, BuzzPal 윙윙~)  
  - 전체 요약: “오늘 5개 중 4개 잘했어요! (80%)” + 원형 그래프 / 별점  
- **효과**: 이 기능 하나만으로도 “와, 이 앱 진짜 귀엽고 나를 챙겨주는구나” 하는 느낌이 확 듦  
- **예상 기간**: 1~3일  
- **완료 후**: 바로 친구 5명한테 테스트 요청 가능 → MVP 수준 완성!

### 2. 배포 + 도메인 (우선순위 2위)
- **목표**: 실제 사용자에게 공개할 수 있는 상태 만들기  
- **주요 작업**  
  - Vercel에 배포  
  - PWA 설정 완료 (next-pwa 또는 기본 manifest)  
  - 도메인 구매: eggpal.app, beepal.app, mayflypal.app, buzzpal.app 중 선택  
    → .app 도메인이 모바일 친화적이라 10대들에게 가장 좋음  
  - Privacy Policy + Terms of Service 페이지 추가 (무료 템플릿 사용, 10분 소요)  
- **완료 후**: 친구·지인 5~10명에게 링크 공유 → 피드백 수집 시작  
- **예상 기간**: 3~7일

### 3. 다른 유저 상태 보기 + 공유 기능 (커뮤니티 시작)
- **목표**: 혼자 쓰는 앱 → 친구·다른 사람과 함께 쓰는 앱으로 확장  
- **주요 기능**  
  - 내 상태 공개 토글 (기본 off → on 시 공개)  
  - 공개된 사용자 목록 페이지 (/explore or /friends)  
  - 클릭 시 해당 유저의 “오늘의 정원” 또는 카드들 보기  
  - 공유 버튼: “내 오늘 상태 공유하기”  
    → 카드 캡처 + 캐릭터 + “EggPal과 함께 90% 달성!” 문구로 이미지 생성  
    → 인스타, 카톡, 트위터 등으로 공유  
- **효과**: 10대들이 “나 오늘 100% 했어~” 하면서 SNS에 올릴 확률 100%  
- **예상 기간**: 1~2주

### 4. AI 판단 + 피드백 + 격려 응원 (이미 거의 완성)
- **현재 상태**: 프롬프트 잘 만들어져 있음  
- **추가 개선 포인트**  
  - 캐릭터가 직접 말하는 느낌으로 응원 메시지  
    예: “에그팔이 말해요: 와, 오늘도 90% 달성했어요! 정말 대단해요~ 🥚✨”  
    “버즈팔이 윙윙~: 아직 40%밖에 안 됐어요… 오늘 조금만 더 해볼까요? 🦟”  
- **예상 기간**: 이미 거의 끝났으니 1~2일 안에 마무리 가능

### 5. 다른 사용자와의 상호작용 (2차 업데이트)
- **초기**: “좋아요” 버튼만  
- **다음 단계**: 댓글, 응원 메시지 추가  
- **재미 요소**: “버즈팔이 대신 응원해줬어요!” 같은 알림  
- **예상 기간**: 2~4주 (사용자 피드백 보고 천천히)

### 추천 실행 순서 & 타임라인
1. **1~3일**: 메인 대시보드 + 상태 애니메이션 완성 → 친구 5명 테스트  
2. **3~7일**: 배포 + 도메인 + PWA → 공식 런칭  
3. **1~2주**: 공개 토글 + 공유 기능 → SNS 홍보 시작  
4. **2~4주**: 다른 사람 상태 보기 + 좋아요/댓글 → 커뮤니티 활성화
