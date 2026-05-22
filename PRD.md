# 우리 가족 런던 트립 — PRD

> **London Family Trip 2026 — Travel Butler**
> 황씨 가족 7박 8일 런던 여행 (2026.06.15 ~ 06.22) PWA 어플
> 작성일: 2026.05.21 | 버전: 1.0

---

## 📑 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [사용자 + 사용 시나리오](#2-사용자--사용-시나리오)
3. [기술 스택 + 아키텍처](#3-기술-스택--아키텍처)
4. [디자인 시스템](#4-디자인-시스템)
5. [페이지 구조 + 화면 플로우](#5-페이지-구조--화면-플로우)
6. [데이터 모델](#6-데이터-모델)
7. [Zone별 시드 콘텐츠](#7-zone별-시드-콘텐츠)
8. [기능 명세 (46개)](#8-기능-명세)
9. [외부 API 명세](#9-외부-api-명세)
10. [PWA 설정](#10-pwa-설정)
11. [보안](#11-보안)
12. [개발 단계 + 우선순위](#12-개발-단계)
13. [배포 가이드](#13-배포-가이드)
14. [부록](#14-부록)

---

## 1. 프로젝트 개요

### 1.1 프로젝트 정보

| 항목 | 내용 |
|---|---|
| 앱 이름 | **우리 가족 런던 트립** |
| 부제 | London Family Trip 2026 — Travel Butler |
| 여행 기간 | 2026.06.15 (월) ~ 06.22 (월), 7박 8일 |
| 사용자 | 황씨 가족 3인 (아빠·엄마·자녀 만 12세) |
| 앱 형태 | PWA (Progressive Web App) |
| 배포 | Netlify (무료, 가족 비공개) |
| 운영비 | 약 ₩25,000 / 7박 8일 (API 사용료) |

### 1.2 핵심 컨셉 — "Travel Butler"

**일반 여행 어플**: 정보 검색 + 고정 일정표
**우리 어플**: AI 여행 집사 (실시간 + 개인 맞춤 + 풍부한 자유도)

### 1.3 작동 원칙

1. **Zone First**: Day별 활동 자유 선택 → AI 동선 최적화 → 실시간 변경
2. **풀 온라인 + 오프라인 대비**: 시드 데이터 (80+) + Claude API Web Search
3. **자유도 ⭐⭐⭐⭐⭐**: 어떤 시점에든 변경·추가·삭제 가능
4. **카드 UI 통일**: 시드 데이터 + AI 응답 = 동일 컴포넌트
5. **가족 따뜻함**: 디자인 톤 + 인터랙션

### 1.4 확정된 사실 (변경 X)

#### 비행기
- 출국: 6/15 (월) KE907 ICN 10:55 → LHR 17:20
- 귀국: 6/22 (월) KE908 LHR 19:35 → ICN+1 16:15
- PNR: 114417930970

#### 호텔
- 6/15-18 (3박): Citadines Holborn-Covent Garden (₩261만)
- 6/18-22 (4박): The Royal Horseguards Hotel (₩336만, 조식 포함)

#### 예약 완료
- Wimbledon Tour + Museum (Day 2, 6/16 화 14:30) ✅

### 1.5 가족 구성

| 멤버 | 특징 |
|---|---|
| 아빠 (에드워드) | 분석·데이터, 가성비+가족 컨디션 균형, P 성향 |
| 엄마 (유효정) | 안전·편안함 중시 |
| 자녀 (만 12세) | 국제학교, 영어 능숙, BP 디베이트 대회 참가, 도시 화려함 좋아함 |

---

## 2. 사용자 + 사용 시나리오

### 2.1 페르소나

#### 👨 주 사용자 — 아빠 (에드워드)
- 역할: 여행 기획·결정·정보 통합
- 어플 사용: 메인, Zone 선택, AI 입력, 골든벨 출제
- 디지털 능력: 코딩 X, 어플 사용 ⭐

#### 👩 보조 사용자 — 엄마 (유효정)
- 역할: 안전·편안함 중시
- 어플 사용: 일정 확인, 식당 후기, 골든벨 답변

#### 👧 자녀 사용자 — 자녀 (만 12세)
- 특징: 국제학교, 영어 능숙, BP 디베이터
- 어플 사용: 인터랙티브, 골든벨 답변, 영어 학습

### 2.2 폰별 역할

| 폰 | 사용자 | 역할 |
|---|---|---|
| 갤럭시 S26 | 아빠 | 메인 컨트롤, Zone 선택, AI 입력, 출제자 |
| 아이폰 | 엄마 | 일정·식당·매장 확인, 답변자 |
| 아이폰 | 자녀 | 자녀 흥미 우선, 답변자, 영어 학습 |

### 2.3 핵심 사용 시나리오

#### 시나리오 1: 출국 전 (D-30 ~ D-1)
```
어플 URL 받음 → 가족 정보 입력 → D-Day 카운터 확인
체크리스트 확인 (예약·서류·환불)
Day별 사전 보기 → 자녀와 함께 흥미 콘텐츠 탐색
Travel Butler에게 사전 질문 ("Matilda 좋은 좌석", "ETA 신청")
```

#### 시나리오 2: 도착 후 첫날 (Day 1)
```
LHR 도착 17:20 → 호텔 19:30
어플 → "D-Day 0! 환영합니다 🎉"
Day 1 화면 자동 전환
Zone A 선택 → 펍 추천 (호텔 도보 5분)
The Princess Louise 선택 → 매너 팝업 → 지도
```

#### 시나리오 3: 평범한 하루 (Day 3 수)
```
아침 09:00 호텔 → 어플 진입
오늘의 추천 AI 카드 자동 표시
"오늘은 Big Bus + Borough + Matilda. 어제 Wimbledon 피로 ↑"

Zone 선택 → Multi Zone (Big Bus 활용)
활동 카드 추가:
- B Bagel Soho (아침)
- 교통박물관 (오전)
- Big Bus 1일권
- Tower Bridge + Borough Market
- 호텔 키친 (저녁)
- Matilda 19:30 ⭐ 확정

[동선 최적화] → AI 자동 배치
[일정 시작]
```

#### 시나리오 4: 즉흥 결정 (현장)
```
13:00 Tower Bridge 비 시작
어플 → Butler 플로팅 버튼
"비 와서 실내 어디?"

Butler 다중 데이터 종합:
- 위치: Tower Hill
- 날씨: 비
- 시간: 13:00
- 다음 일정: 19:30 Matilda

추천 (실내 명소 카드):
1. Sky Garden (튜브 5분, 무료)
2. Borough Market (지붕 多)
3. Tower of London
선택 → 일정 자동 재최적화
```

#### 시나리오 5: 하루 마무리 (밤)
```
22:30 Matilda 끝 → 호텔 복귀
어플 알림: "오늘의 골든벨 시간! 🎮"

아빠 폰: 출제자 모드
엄마+자녀 폰: 답변자 모드
10문제 Claude AI 자동 생성 (오늘 활동 기반)
실시간 점수 → 결과

자녀 1등 → 내일 점심 선택권
일기 자동 정리 → 취침
```

---

## 3. 기술 스택 + 아키텍처

### 3.1 Frontend (PWA)

| 기술 | 이유 |
|---|---|
| HTML5 + CSS3 + Vanilla JS | Claude Code 친화적, 가벼움 |
| PWA (Service Worker + Manifest) | 오프라인 캐시, iOS·Android 동일 작동 |
| Tailwind CSS (CDN) | 가족 따뜻함 톤 빠른 구현 |
| Alpine.js | 가벼운 반응성 (React 대체) |
| Chart.js | 진행률·점수 시각화 |
| Leaflet.js | 지도 임베드 (가벼움) |
| Pretendard 폰트 | 한글 메인 |

### 3.2 Backend (Serverless)

| 기술 | 이유 |
|---|---|
| Netlify | 정적 호스팅 무료 |
| Netlify Functions | API 키 보호 (프록시) |
| LocalStorage | 사용자 데이터 저장 |
| Firebase Realtime DB (옵션) | 골든벨 3대 폰 동기화 |

### 3.3 External APIs

#### Core API (Claude — 메인)
- **Claude API (Web Search 활성)** — 모든 검색·추천·AI 기능

#### Claude 모델 전략 (최신 + 빠른 반응 우선)

```javascript
const MODEL_STRATEGY = {
  // 메인: Haiku 4.5 (가장 빠름, 95% 호출)
  default: 'claude-haiku-4-5',
  
  // Web Search 필요 시: Sonnet 4.6 (검색 품질 ↑)
  withWebSearch: 'claude-sonnet-4-6',
  
  // 동선 최적화: Opus 4.7 (정확도 우선)
  routeOptimization: 'claude-opus-4-7'
};
```

**응답 속도 (실측 예상)**:
| 작업 | 모델 | 속도 |
|---|---|---|
| 오늘의 추천 | Haiku 4.5 | 0.8초 ⭐ |
| 의사결정 도우미 | Haiku 4.5 | 1초 ⭐ |
| Web Search 통합 | Sonnet 4.6 | 4초 |
| 동선 최적화 | Opus 4.7 | 5초 |
| 골든벨 10문제 | Haiku 4.5 | 2초 ⭐ |

#### Supporting APIs (무료/단순)

| API | 용도 | 무료 한도 |
|---|---|---|
| OpenWeatherMap | 날씨 | 1,000 호출/일 |
| TfL API | 튜브·버스 실시간 | 무제한 |
| exchangerate-api | 환율 | 1,500/월 |
| Google Maps Embed | 지도 표시 | 무료 |
| Google Maps URL Scheme | 길찾기 앱 호출 | 무료 |

#### 사용자 발급 API 키
- ✅ **Claude API 키 1개** (메인)
- ✅ OpenWeatherMap (무료, 선택)
- ❌ Google Places (불필요)
- ❌ Google Maps (Embed/URL만, 키 불필요한 옵션)

### 3.4 아키텍처 다이어그램

```
┌────────────────────────────────────────────────┐
│       사용자 폰 (PWA - iOS·Android 동일)        │
│  - Main UI (Travel Butler + Day + 카드)         │
│  - Service Worker (오프라인 캐시)               │
│  - LocalStorage (선택 활동·체크리스트·메모)    │
└───────────────────┬────────────────────────────┘
                    │ HTTPS
                    ▼
┌────────────────────────────────────────────────┐
│       Netlify CDN (정적 호스팅, 무료)           │
│  - HTML/CSS/JS, 시드 데이터 JSON                │
└───────────────────┬────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────┐
│       Netlify Functions (서버리스)              │
│  - /butler → Claude API (Web Search)            │
│  - /weather → OpenWeatherMap                    │
│  - /tfl → TfL API                               │
│  - /exchange → 환율                              │
│  환경변수: CLAUDE_API_KEY, OPENWEATHER_KEY     │
└────────────────────────────────────────────────┘
```

### 3.5 폴더 구조

```
/우리-가족-런던-트립
├── /public
│   ├── index.html
│   ├── manifest.json
│   ├── service-worker.js
│   ├── /icons
│   └── /images
├── /src
│   ├── /pages (home, day, zone, card, plan, game, butler, checklist, progress, emergency, tools, memories)
│   ├── /components (DayCard, ZoneSelector, ActivityCard, ButlerInput, EtiquettePopup, QuizQuestion, MapEmbed, RouteOptimizer, WeatherWidget, CurrencyWidget)
│   ├── /data (days.json, zones.json, attractions.json, restaurants.json, shops.json, etiquette.json, checklist.json, emergency.json, confirmed.json)
│   ├── /services (butler.js, weather.js, tfl.js, exchange.js, storage.js, geolocation.js, pwa.js)
│   ├── /styles (main.css, theme.css, components.css, animations.css)
│   └── /utils (dateUtils.js, distanceCalc.js, routeOptimizer.js)
├── /netlify/functions (butler.js, weather.js, tfl.js, exchange.js)
├── netlify.toml
├── package.json
└── README.md
```

### 3.6 Travel Butler 핵심 함수

```javascript
// /netlify/functions/butler.js
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

function selectModel(taskType, useWebSearch = false) {
  if (taskType === 'route_optimization') return 'claude-opus-4-7';
  if (useWebSearch) return 'claude-sonnet-4-6';
  return 'claude-haiku-4-5';  // 기본: 빠른 반응
}

export default async (req) => {
  const { query, context, taskType, useWebSearch } = await req.json();
  
  const response = await client.messages.create({
    model: selectModel(taskType, useWebSearch),
    max_tokens: 2000,
    tools: useWebSearch ? [{
      type: 'web_search_20250305',
      name: 'web_search'
    }] : [],
    system: buildSystemPrompt(context),
    messages: [{ role: 'user', content: query }]
  });
  
  return new Response(JSON.stringify({
    content: response.content,
    model: response.model,
    usage: response.usage
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

function buildSystemPrompt(context) {
  return `당신은 황씨 가족의 런던 여행 집사 (Travel Butler) 입니다.

가족 프로필:
- 아빠 (에드워드): 분석·데이터, 가성비 + 가족 컨디션 균형
- 엄마 (유효정): 안전·편안함 중시
- 자녀 (만 12세): 국제학교, 영어 능숙, BP 디베이트 참가, 도시 화려함 좋아함

여행 정보:
- 7박 8일 (2026.6.15-22)
- 호텔: Citadines Holborn (Day 1-3) → Royal Horseguards (Day 4-7)

현재 컨텍스트:
${JSON.stringify(context, null, 2)}

응답 형식 (필수 JSON):
{
  "type": "recommendation" | "comparison" | "insight" | "answer",
  "intro": "한 줄 요약 (50자 이내)",
  "cards": [
    {
      "id": "unique_id",
      "name": "이름",
      "name_ko": "한국어 이름",
      "image": "이미지 URL",
      "rating": 4.5,
      "price": "£20-30",
      "distance": "도보 5분",
      "address": "주소",
      "tags": ["영국 클래식", "자녀 OK"],
      "kidsFriendly": 5,
      "reason": "추천 이유 (한 줄)",
      "actions": [
        { "type": "details", "label": "상세 보기" },
        { "type": "add", "label": "오늘에 추가" },
        { "type": "map", "label": "지도 보기" }
      ]
    }
  ]
}

원칙:
1. 가족 컨디션 우선
2. 자녀 만 12세 친화
3. 자녀 BP 디베이트 학습 가치
4. 가성비 + 가족 만족도 균형
5. 한국어로 답변
6. 빠르고 간결하게 (필요 정보 우선)
7. 절대 순수 텍스트 X, 모든 추천은 카드 구조`;
}
```

### 3.7 보안

```javascript
// ❌ 클라이언트에서 호출
const key = 'sk-ant-xxx';  // 절대 안 됨

// ✅ Netlify Function 프록시
const response = await fetch('/.netlify/functions/butler', {
  method: 'POST',
  body: JSON.stringify({ query, context })
});
// 클라이언트엔 키 노출 X
```

### 3.8 성능 최적화

- 시드 데이터 JSON 사전 로드 (한 번만)
- 이미지 lazy loading + WebP 포맷
- Claude API 응답 캐싱 (같은 질문 5분)
- 디바운스 (Butler 입력 1초 후 호출)
- Code splitting (페이지별 JS 분리)

---

## 4. 디자인 시스템

### 4.1 컨셉 — 가족 따뜻함

- 영국 빅토리안 빨강·골드 + 모던 화이트 베이스
- 살구 톤 포인트
- 사진 위주 (런던 명소)
- 부드러운 그라데이션
- 자연스러운 그림자

### 4.2 컬러 팔레트

```css
:root {
  /* Primary - 영국 클래식 */
  --primary: #C8102E;
  --primary-soft: #E8425C;
  --primary-light: #FFE8EC;
  
  /* Secondary - 네이비 */
  --secondary: #1E3A5F;
  --secondary-soft: #4A6FA5;
  --secondary-light: #E8EFF7;
  
  /* Accent - 골드 */
  --accent: #FFD700;
  --accent-soft: #FFE873;
  
  /* Warm - 가족 따뜻함 ⭐ */
  --warm: #FFA07A;
  --warm-soft: #FFD4C2;
  --warm-light: #FFF4ED;
  
  /* Backgrounds */
  --bg: #FFF9F5;
  --bg-card: #FFFFFF;
  --bg-section: #FFF4ED;
  
  /* Text */
  --text-primary: #2C3E50;
  --text-secondary: #5D6D7E;
  --text-light: #95A5A6;
  
  /* Border + Shadow */
  --border: #F0E6DD;
  --shadow: rgba(200, 16, 46, 0.08);
  
  /* States */
  --success: #27AE60;
  --warning: #F39C12;
  --error: #E74C3C;
  --info: #3498DB;
  
  /* Zone Colors */
  --zone-a: #FF6B9D;  /* Holborn/Covent/Soho */
  --zone-b: #5B8DEF;  /* Westminster */
  --zone-c: #2ECC71;  /* Tower/Borough */
  --zone-d: #9B59B6;  /* Notting Hill */
  --zone-e: #F39C12;  /* Knightsbridge */
  --zone-f: #16A085;  /* Oxford */
  
  /* Butler 전용 */
  --butler-bg: linear-gradient(135deg, #1E3A5F, #4A6FA5);
  --butler-accent: #FFD700;
}

[data-theme="dark"] {
  --bg: #1A1A2E;
  --bg-card: #232342;
  --bg-section: #2A2A4A;
  --text-primary: #F5F5F5;
  --text-secondary: #BDC3C7;
  --border: #3A3A5C;
  --shadow: rgba(0, 0, 0, 0.3);
}
```

### 4.3 타이포그래피

```css
--font-ko: 'Pretendard', 'Noto Sans KR', sans-serif;
--font-en: 'Inter', 'SF Pro Display', sans-serif;
--font-script: 'Caveat', 'Indie Flower', cursive;

--font-display: 32px;
--font-h1: 24px;
--font-h2: 20px;
--font-h3: 18px;
--font-body: 15px;
--font-small: 13px;
--font-tiny: 11px;
```

### 4.4 핵심 컴포넌트 디자인

#### 카드
```css
.card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px var(--shadow);
  border: 1px solid var(--border);
  transition: all 0.3s ease;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px var(--shadow);
}
```

#### Travel Butler 입력
```css
.butler-input {
  background: var(--butler-bg);
  color: white;
  border-radius: 24px;
  padding: 16px 24px;
  position: relative;
  box-shadow: 0 4px 20px rgba(30, 58, 95, 0.3);
}
.butler-input::before {
  content: '🎩';
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
}
```

#### Zone 카드
```css
.zone-card {
  background: linear-gradient(135deg, var(--zone-color), color-mix(in srgb, var(--zone-color) 60%, white));
  border-radius: 20px;
  padding: 24px;
  color: white;
  position: relative;
  overflow: hidden;
}
.zone-card .icon {
  font-size: 48px;
  margin-bottom: 12px;
}
```

#### 활동 카드 (시드 + AI 응답 동일)
```css
.activity-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px var(--shadow);
}
.activity-card .image {
  height: 180px;
  background-size: cover;
  background-position: center;
}
.activity-card .body { padding: 16px; }
.activity-card .badge-curated {
  background: var(--accent);
  color: var(--text-primary);
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 8px;
}
.activity-card .badge-new {
  background: var(--success);
  color: white;
}
```

### 4.5 애니메이션

```css
@keyframes countUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes cardEnter { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes butlerPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); } 50% { box-shadow: 0 0 0 20px rgba(255, 215, 0, 0); } }
@keyframes correctAnswer { 0% { transform: scale(1); } 50% { transform: scale(1.1); background: var(--success); } 100% { transform: scale(1); } }
```

### 4.6 반응형

- 모바일 우선 (320-768px) — 메인
- 태블릿 (768-1024px)
- PC (1024+) — 가족 PC 보기용

---

## 5. 페이지 구조 + 화면 플로우

### 5.1 페이지 맵

```
/                          # 홈
├── /day/:n                # Day 1-8 화면
│   ├── /zone/:z           # Zone 선택 후
│   │   └── /add           # 활동 추가
│   ├── /plan              # 동선 최적화 결과
│   └── /game              # 골든벨
├── /card/:type/:id        # 활동 카드 상세
├── /butler                # Travel Butler 채팅
├── /checklist             # 체크리스트
├── /progress              # 진행률 시각화
├── /memories              # 추억 책자
├── /emergency             # 응급
├── /tools                 # 환율·날씨·튜브맵
└── /settings              # 가족 설정·다크모드
```

### 5.2 핵심 화면 와이어프레임

#### 홈 화면
```
┌────────────────────────────┐
│  🇬🇧 우리 가족 런던 트립    │
│  ────────────────────────  │
│                            │
│  ╔══════════════════════╗  │
│  ║   ✈️ D-28           ║  │
│  ║   여행까지            ║  │
│  ╚══════════════════════╝  │
│                            │
│  🎩 Travel Butler          │
│  ┌──────────────────────┐  │
│  │ 무엇을 도와드릴까요?  │  │
│  └──────────────────────┘  │
│                            │
│  🌟 오늘의 추천             │
│  ┌──────────────────────┐  │
│  │ AI 분석 추천...       │  │
│  └──────────────────────┘  │
│                            │
│  🗓️ 일정 (Day 1-8)         │
│  ┌────┐┌────┐┌────┐┌────┐ │
│  │Day1││Day2││Day3││Day4│ │
│  └────┘└────┘└────┘└────┘ │
│                            │
├────────────────────────────┤
│ 🏠  📅  🎩  ✅  🛠️       │
└────────────────────────────┘
```

#### Day 화면 (Zone 선택 전)
```
┌────────────────────────────┐
│ ← Day 3 - 6/17 (수) ☀️    │
│ Citadines Holborn          │
│                            │
│ 📋 오늘의 계획              │
│ ┌──────────────────────┐  │
│ │ ✅ 19:30 Matilda     │  │
│ │    Cambridge Theatre │  │
│ └──────────────────────┘  │
│                            │
│ + 활동 추가                │
│                            │
│ ────────────────────────── │
│                            │
│ 🗺️ 어디부터 둘러볼까요?    │
│                            │
│ ┌────────┐ ┌────────┐     │
│ │🎭 ZoneA│ │🏛️ ZoneB│     │
│ │ 호텔   │ │Westminstr│   │
│ └────────┘ └────────┘     │
│ ┌────────┐ ┌────────┐     │
│ │🌉 ZoneC│ │🎨 ZoneD│     │
│ │ Tower  │ │ 노팅힐  │     │
│ └────────┘ └────────┘     │
│ ┌────────┐ ┌────────┐     │
│ │👑 ZoneE│ │🚌 Multi│     │
│ │ 해롯   │ │ BigBus │     │
│ └────────┘ └────────┘     │
│                            │
│ 또는 🎩 Butler에게 묻기    │
└────────────────────────────┘
```

#### Zone 선택 후 (활동 추가)
```
┌────────────────────────────┐
│ ← Zone A: Holborn/Covent  │
│                            │
│ 📌 우리 큐레이션 (8개)     │
│ ┌──────────────────────┐  │
│ │ [사진]               │  │
│ │ 🏛️ Transport Museum │  │
│ │ ⭐ 4.7 · 도보 7분   │  │
│ │ 자녀 ⭐⭐⭐⭐⭐      │  │
│ │ [추가] [상세 →]     │  │
│ └──────────────────────┘  │
│                            │
│ 🆕 실시간 발견 (Butler)    │
│ ┌──────────────────────┐  │
│ │ 🍴 The Devonshire    │  │
│ │ ⭐ 4.7 · 신상 펍    │  │
│ │ [추가] [상세 →]     │  │
│ └──────────────────────┘  │
│                            │
│ [더 보기 +]                │
└────────────────────────────┘
```

#### 동선 최적화 결과
```
┌────────────────────────────┐
│ ← Day 3 동선 최적화 ✨     │
│                            │
│ 📊 활동 5개 · 12km · £45   │
│                            │
│ 🏨 09:30 Citadines 출발    │
│   ↓ 도보 5분               │
│ 🥯 09:45 B Bagel Soho     │
│   ↓ 도보 8분               │
│ 🏛️ 10:30 교통박물관 1.5h  │
│   ↓ 도보 5분               │
│ 🚌 12:00 Big Bus 시작      │
│   ↓ 외관 투어              │
│ 🌉 13:30 Tower Bridge     │
│   ↓ 도보 15분              │
│ 🏪 14:00 Borough Market   │
│   ↓ 튜브 15분              │
│ 🏨 16:00 호텔 휴식         │
│   ↓ 도보 5분               │
│ 🎭 19:30 Matilda          │
│                            │
│ [✅ 일정 확정]             │
│ [🔄 다시 최적화]           │
└────────────────────────────┘
```

#### 활동 카드 상세 (시드 + AI 인사이트)
```
┌────────────────────────────┐
│ ← Borough Market          │
│ ┌──────────────────────┐  │
│ │ [사진 풀스크린]       │  │
│ └──────────────────────┘  │
│                            │
│ ⭐ 4.7 (12,034)            │
│                            │
│ 📌 기본 정보 (즉시 표시)   │
│ - 8 Southwark St          │
│ - 수: 10:00-17:00 ✅      │
│ - 무료 입장                │
│ - 자녀 친화 ⭐⭐⭐⭐       │
│                            │
│ "1000년 역사 푸드 마켓"   │
│                            │
│ ━━━━━━━━━━━━━━━━━━━━━━━ │
│                            │
│ 🎩 Butler 인사이트         │
│ (자동 호출 1-3초 후)       │
│                            │
│ ✅ 오늘 운영 정상           │
│ 🌟 추천 메뉴               │
│   - Padella 파스타 ⭐      │
│   - Bread Ahead 도넛       │
│ 📰 최신: 6/17 치즈 시연 14:00│
│ ⚠️ 비 예보 16시, 일찍 방문 │
│                            │
│ 🗺️ 지도                    │
│ [Google Maps Embed]       │
│                            │
│ 🚇 호텔 → 25분/15분/12분  │
│                            │
│ ─────────────────────────  │
│ 🎩 더 알고 싶나요?         │
│ [근처 다른 곳] [비슷한 곳]│
│ [최적 시간] [팁·후기]      │
│ ─────────────────────────  │
│                            │
│ [✅ 방문 실행 →]           │
└────────────────────────────┘
        ↓ 방문 실행 시
┌────────────────────────────┐
│ 🎩 영국 매너 가이드        │
│ Borough Market 방문:       │
│ 1. 시식 OK                 │
│ 2. 카드 결제 多 (현금 X)  │
│ 3. 사진 OK (사람 X)        │
│ 4. 노점 줄 (Padella ↑)    │
│ [확인]                     │
└────────────────────────────┘
```

#### 골든벨 게임
```
┌────────────────────────────┐
│ 🎮 Day 3 골든벨    Q3/10   │
│                            │
│ 어제 본 Tower Bridge는     │
│ 도개교(drawbridge)인가요? │
│                            │
│ ┌──────────┐ ┌──────────┐ │
│ │A. 그렇다 │ │B. 아니다 │ │
│ └──────────┘ └──────────┘ │
│ ┌──────────┐ ┌──────────┐ │
│ │C. 옛날만 │ │D. 1년1회 │ │
│ └──────────┘ └──────────┘ │
│                            │
│ ⏱️ ●●●●●●●●○○ 8초          │
│                            │
│ 점수                       │
│ 👩 엄마: 25                │
│ 👧 자녀: 35 ⭐             │
└────────────────────────────┘
```

### 5.3 화면 플로우

#### 출국 전
```
홈 → 체크리스트 → Day 사전 보기 → Butler 사전 질문
```

#### Day 시작 (아침)
```
홈 → 오늘 Day 자동 표시 → Day 화면
→ 확정 활동 확인 → 활동 추가 시작
→ Zone 선택 OR Butler 질문 OR 추천 받기
→ 활동 카드 둘러보기 → 자유 추가
→ [동선 최적화] → AI 자동 배치 → [확정]
```

#### 현장에서
```
Day 화면 → 다음 활동 → 지도 보기
→ Google Maps 앱 자동 실행 또는 임베드
→ 활동 완료 체크 → 다음 활동
```

#### 즉흥 결정
```
어디서든 → Butler 플로팅 버튼
→ 자연어 질문 → Butler 실시간 검색·추천
→ 선택 → 오늘 계획에 추가 → 동선 재최적화
```

#### 하루 끝
```
호텔 복귀 → 골든벨 알림 → 게임 모드
→ 점수 + 랭킹 → 일기 자동 정리 → 취침
```

### 5.4 Bottom Navigation (5개)

```
┌────────────────────────┐
│ 🏠   📅   🎩   ✅   🛠️ │
│ 홈   Day  Butler 체크  도구│
└────────────────────────┘
```

### 5.5 인터랙션 패턴

- **Swipe Left/Right**: Day 화면 간 이동
- **Pull-to-Refresh**: 추천·날씨 갱신
- **Long Press**: 체크리스트 메모 추가
- **Floating Action Button**: Butler 어디서든 호출
- **Bottom Sheet**: 매너 팝업·지도 상세

### 5.6 푸시 알림 (옵션)

- 매일 아침: "Day N 시작. 오늘은..."
- 예약 시간: "Barrafina 30분 전"
- 골든벨 시간: "오늘의 골든벨 시간!"

---

## 6. 데이터 모델

### 6.1 Day 데이터 모델

```javascript
{
  day: 3,
  date: "2026-06-17",
  dayOfWeek: "수",
  hotel: "citadines_holborn",
  baseZone: "A",
  
  confirmedActivities: [
    {
      id: "matilda",
      time: "19:30",
      type: "musical",
      title: "Matilda the Musical",
      location: "Cambridge Theatre",
      booked: true,
      bookingRef: "..."
    }
  ],
  
  recommendedConcept: "외관 투어 + 마켓 + 뮤지컬",
  weather: null,  // 실시간
  userSelectedActivities: [],
  optimizedRoute: null,
  notes: "Borough Market 식재료 → 호텔 키친"
}
```

### 6.2 Zone 데이터 모델

```javascript
{
  id: "A",
  name: "Holborn / Covent / Soho",
  icon: "🎭",
  color: "#FF6B9D",
  description: "런던 중심부 활기, 호텔 베이스",
  attractions: ["transport_museum", "covent_garden", ...],
  restaurants: ["barrafina", "flat_iron", ...],
  shops: ["hamleys", "lillywhites", ...]
}
```

### 6.3 활동 카드 모델 (핵심)

```javascript
{
  id: "borough_market",
  type: "attraction",  // attraction / restaurant / shop / pub
  zone: "C",
  
  // 시드 데이터 (오프라인)
  basic: {
    name: "Borough Market",
    nameKo: "버러 마켓",
    address: "8 Southwark St, SE1 1TL",
    coordinates: { lat: 51.5055, lng: -0.0907 },
    nearestTube: "London Bridge",
    hours: {
      mon: "X",
      tue: "10:00-17:00",
      wed: "10:00-17:00",
      thu: "10:00-17:00",
      fri: "10:00-18:00",
      sat: "08:00-17:00",
      sun: "X"
    },
    price: "무료 입장",
    image: "/images/borough-market.webp"
  },
  
  // 평점·가족 매칭
  rating: 4.7,
  reviewCount: 12034,
  kidsFriendly: 4,
  parentFriendly: 5,
  ageMin: 5,
  duration: "2-3h",
  bookingNeeded: false,
  
  // 큐레이션 이유
  curated: true,
  curatedReason: "1000년 역사 마켓, 호텔 키친용 식재료 픽업 + 길거리 음식",
  bestTimeOfDay: "오후 (혼잡 ↓)",
  bestDay: [3],
  
  // 매너 (액션 시점 팝업)
  etiquette: [
    "시식 OK (노점 따라)",
    "카드 결제 多 (현금 X)",
    "사진 OK (사람 X)",
    "노점 줄 서기 (Padella ↑)"
  ],
  
  // 호텔 접근
  fromCitadines: { walking: 25, tube: 15, uber: 12 },
  fromHorseguards: { walking: 30, tube: 10, uber: 10 },
  
  // Butler 인사이트 (실시간 자동 호출)
  butlerInsights: {
    autoLoad: true,
    cache: "5분",
    fields: ["todayStatus", "latestReviews", "familyMatch", "recommendations", "crowdPrediction", "nearbyDiscovery"]
  },
  
  // 인터랙티브
  suggestedQuestions: [
    "근처 비슷한 곳",
    "자녀 메뉴 추천",
    "최적 방문 시간",
    "줄 안 서는 팁"
  ]
}
```

### 6.4 LocalStorage 구조

```javascript
{
  family: {
    members: ["edward", "hyojeong", "jiyu"]
  },
  trip: {
    startDate: "2026-06-15",
    endDate: "2026-06-22"
  },
  days: {
    "1": {
      activities: [],
      optimizedRoute: null,
      completed: [],
      notes: "",
      photos: [],
      expenses: 0
    }
    // Day 2-8
  },
  checklist: {
    "eta": false,
    "fraser_refund": false
    // ...
  },
  game: {
    "day1": null,
    "day2": { mom: 45, child: 52 }
    // ...
  },
  settings: {
    theme: "warm",
    darkMode: false,
    notifications: true
  }
}
```

### 6.5 Butler AI 응답 구조 (JSON 강제)

```javascript
{
  type: "recommendation" | "comparison" | "insight" | "answer",
  intro: "한 줄 요약 (50자 이내)",
  cards: [
    {
      id: "unique_id",
      name: "이름",
      image: "이미지 URL",
      rating: 4.5,
      price: "£20-30",
      distance: "도보 5분",
      tags: [...],
      kidsFriendly: 5,
      reason: "추천 이유",
      actions: [
        { type: "details", label: "상세" },
        { type: "add", label: "추가" },
        { type: "map", label: "지도" }
      ]
    }
  ],
  comparison: null | { headers: [], rows: [] },
  context: null | { weather, time, location, ... }
}
```

→ **시드 카드와 AI 카드가 동일한 ActivityCard 컴포넌트로 렌더링되어 시각적 이질감 0**

---

## 7. Zone별 시드 콘텐츠

### 7.1 Zone 정의 (6개)

| Zone | 이름 | 컬러 | 특징 | 호텔 거리 |
|---|---|---|---|---|
| A | Holborn / Covent / Soho | #FF6B9D | 호텔 베이스, 활기 | 도보 |
| B | Westminster / 강변 | #5B8DEF | 격식, 빅벤·교대식 | Horseguards 도보 |
| C | Tower / Borough | #2ECC71 | 강변, 마켓 | 튜브 15분 |
| D | Notting Hill / Portobello | #9B59B6 | 컬러풀, 마켓 | 우버 20분 |
| E | Knightsbridge | #F39C12 | 럭셔리, 해롯 | 튜브 10분 |
| F | Oxford | #16A085 | 학구, 디베이트 | 기차 1h |

### 7.2 시드 콘텐츠 요약 (80+ 아이템)

#### Zone A (Holborn/Covent/Soho) — 25개
- **명소**: 교통박물관, Covent Garden, Trafalgar Sq, National Gallery, Chinatown, Soho, Piccadilly, Leicester Sq, Neal's Yard, Seven Dials
- **식당**: Barrafina, Sabor, Flat Iron, Hawksmoor, Wong Kei, Four Seasons, Dishoom, Poppies, Rules, Simpson's, B Bagel, Padella
- **매장**: Hamleys, M&M, Lego, Lillywhites, Liberty, Hatchards, Foyles, Fortnum & Mason

#### Zone B (Westminster/강변) — 15개
- **명소**: 빅벤, Westminster Abbey, Horse Guards Parade, Buckingham, Royal Mews, St James's Park, National Gallery, Churchill War Rooms, London Eye, South Bank
- **식당**: The Wolseley, Regency Café, Skylon, OXO Tower, Gordon's Wine Bar

#### Zone C (Tower/Borough) — 12개
- **명소**: Tower Bridge, Tower of London, HMS Belfast, St Paul's, Sky Garden, Leadenhall, Borough Market
- **식당**: Coppa Club, Padella, Bread Ahead, Kappacasein, Roast

#### Zone D (Notting Hill/Portobello) — 8개
- **명소**: Portobello Market, Notting Hill 거리, Notting Hill Bookshop
- **식당**: Granger & Co, The Cow, Farm Girl Café, The Ledbury

#### Zone E (Knightsbridge) — 5개
- **매장**: Harrods, Harvey Nichols
- **식당**: Harrods Food Hall, Harrods Tea Rooms

#### Zone F (Oxford) — 10개
- **명소**: Christ Church, Bodleian, Radcliffe Camera, **Oxford Union** ⭐, Covered Market, New College
- **식당**: Eagle and Child, Vaults & Garden

#### 펍 (모든 Zone) — 8개
- The Princess Louise, The Lamb, The Crown, The Lamb and Flag, The Salisbury, The Sherlock Holmes, The Red Lion, The Albert

> **상세 JSON 데이터는 `/data/attractions.json`, `/data/restaurants.json`, `/data/shops.json`로 별도 생성**

---

## 8. 기능 명세

### 8.1 핵심 기능 8개

| # | 기능 | 설명 |
|---|---|---|
| F1 | D-Day 카운터 | 출국 전/여행 중/귀국 후 상태별 표시, 카운트업 애니메이션 |
| F2 | Day별 일정 (8개) | 메인 그리드, 각 Day 컨셉·호텔·확정 활동 |
| F3 | Zone별 콘텐츠 (6개) | A-F 정의, 명소·식당·매장 분류, 컬러 구분 |
| F4 | 활동 카드 시스템 | 명소/식당/매장/펍 4종류, 시드 80+ |
| F5 | 활동 카드 상세 | 시드 정보 + Butler 인사이트 자동 호출, 매너 팝업 |
| F6 | 체크리스트 | 출국 전/직전/도착 후/귀국, 완료/미완료 |
| F7 | 메모 | 자유 텍스트, Day별 일기, AI 자동 정리 |
| F8 | 비상 연락처 | 호텔, 영사관, 응급 999, 의료 NHS 111 |

### 8.2 실시간 정보 기능 7개

| # | 기능 | API | 업데이트 |
|---|---|---|---|
| F9 | 실시간 환율 | exchangerate-api | 1시간 |
| F10 | 실시간 날씨 | OpenWeatherMap | 30분 |
| F11 | 시차 표시 | 자체 | 실시간 |
| F12 | 실시간 튜브·버스 | TfL API | 실시간 |
| F13 | 튜브 맵 | TfL 임베드 | - |
| F14 | 구글맵 연동 | Google Maps Embed + URL Scheme | 실시간 |
| F15 | GUI 시각화 | Chart.js + 자체 | - |

### 8.3 디자인·UX 5개

| # | 기능 |
|---|---|
| F16 | 가족 따뜻함 디자인 톤 |
| F17 | 어플 이름 "우리 가족 런던 트립" |
| F18 | 실제 판매용 어플 수준 퀄리티 |
| F19 | 갤럭시 + 아이폰 호환 (PWA) |
| F20 | 다양한 옵션 풍부히 (Claude 알아서) |

### 8.4 AI 기능 - 기본 8개

#### F21. 오늘의 추천
- Trigger: 앱/Day 진입 시 자동
- 모델: Haiku 4.5
- Input: 날씨, 어제 활동, 확정 활동, 가족 컨디션
- Output: 200자 추천 + 액션 카드

#### F22. 의사결정 도우미
- Trigger: 사용자 자연어 질문
- 모델: Haiku 4.5 (단순) / Sonnet 4.6 (Web Search 필요 시)
- Example: "지금 점심 어디?", "비 와서 실내?"
- Output: 3-5개 옵션 카드

#### F23. 일기 자동 정리
- Trigger: Day 종료 + 메모 입력
- 모델: Haiku 4.5
- Output: Day 일기 카드 + 베스트 모먼트 + 지출 자동 계산

#### F24. 예산 분석
- Trigger: Day 종료
- 모델: Haiku 4.5
- Output: 일일 지출 + 예산 대비 + 남은 일정 권장

#### F25. 줄·혼잡도 예측
- Source: Web Search + AI
- 모델: Sonnet 4.6
- Output: 현재 대기 시간 + 최적 시간 + 대안

#### F26. 사진 캡션 (저장 X)
- Note: S26 AI로 대체, 어플 자체 구현 X

#### F27. 액션 시점 매너 팝업
- Trigger: 활동 카드 "방문 실행" 클릭
- 데이터: etiquette.json (오프라인)
- Display: Bottom Sheet 팝업
- 카테고리: pub, michelin, market, museum, debate, royal, theater

#### F28. 응급 AI 가이드
- Trigger: 응급 버튼
- 모델: Haiku 4.5
- Categories: 의료, 길 잃음, 분실, 도난, 호텔 문제
- Output: 즉시 행동 + 가장 가까운 도움 + 영어 회화 + 영사관

### 8.5 AI 차별화 6개

#### F29. 여행 컨텍스트 통합 추천 (A)
- 전체 컨텍스트 (호텔·시간·날씨·어제·예약·예산) 통합
- Example: "지금 좀 피곤한데 가까운 뭐?"
- 모델: Haiku 4.5

#### F30. 다중 데이터 실시간 종합 판단 (B)
- 날씨+튜브+혼잡도+예약 통합
- Example: "Day 6 비 오면 어디?"
- 모델: Sonnet 4.6 (Web Search)

#### F31. 가족 협상 도우미 (C)
- 세 사람 의견 통합 옵션 추천
- Example: 아빠 펍 / 엄마 카페 / 자녀 베이글
- 모델: Haiku 4.5

#### F32. 남은 일정 자동 최적화 (D)
- Trigger: 일정 변경 시
- Example: "비프웰링턴 못 먹었어"
- Output: 남은 Day에 자동 슬롯 + 예약 가능
- 모델: Opus 4.7

#### F33. 액션 시점 매너 가이드 팝업 (F)
- F27과 통합

#### F34. 여행 진행률 시각화 (G)
- Display: 진행률 바, 명소 체크 지도, 가족 통계, 자녀 영어 그래프
- 모델: 자체 (계산)

### 8.6 게임 기능 3개

#### F35. 런던 골든벨 게임
```javascript
{
  trigger: "Day 종료 후 22:00 알림",
  model: "Haiku 4.5",
  flow: [
    "오늘 활동 데이터 수집",
    "Claude API → 10문제 자동 생성",
    "아빠 폰 = 출제자 / 엄마+자녀 = 답변자",
    "10초/문제 동시 답변",
    "실시간 점수 + 최종 랭킹"
  ],
  questionTypes: ["4지선다", "OX", "사진", "영어"],
  promptTemplate: `
오늘 가족이 다음 활동했어요:
- 명소: ${attractions}
- 식당: ${restaurants}
- 체험: ${experiences}

자녀 만 12세 + 엄마 답변 가능한 골든벨 10문제 생성.
난이도 다양, 영어 표현 일부 포함, BP 디베이트 자녀에게 추가 가치.
JSON 형식으로 응답:
{
  questions: [
    { id, question, options: [], answer, hint, category }
  ]
}
`
}
```

#### F36. 점수·랭킹 시스템
- Scoring: 정답 10점 + 빠른 답 +5 + 자녀 X1.2 + 연속 정답 보너스
- Ranking: 일일 1등 + 누적 + 보상 (다음 활동 선택권)

#### F37. 가족 인터랙션 (3대 폰 동기화)
- Method: Firebase Realtime DB 또는 폴링
- Sync: 문제·타이머·답변·점수 실시간

### 8.7 Travel Butler 4개

#### F38. 자연어 질의응답
- UI: 메인 상단 입력창 + 플로팅 버튼
- 모델: Haiku 4.5 (단순) / Sonnet 4.6 (Web Search)
- Response: JSON 카드 형식

#### F39. 실시간 주변 발견 (위치 기반)
- Trigger: 위치 변경 시 (10m 이동)
- 모델: Sonnet 4.6 (Web Search)
- Output: 큐레이션 + 실시간 발견 통합

#### F40. 큐레이션 + 실시간 통합 표시
- UI: "📌 우리 큐레이션" + "🆕 실시간 발견" 섹션 분리
- Filter: 전체/식당/명소/매장/카페

#### F41. 즉흥 결정 지원
- Trigger: 현장 어디서든 플로팅 버튼
- Context: 현재 위치 + 시간 + 가족 컨디션

### 8.8 계획 흐름 5개

#### F42. Day별 활동 자유 선택
- Zone 선택 → 활동 카드 → 자유 추가
- 또는 Butler → 추천 → 추가

#### F43. Zone 시작 → 활동 추가 → 동선 최적화
- Day 진입 → 확정 활동 표시 → 활동 추가 → [최적화]

#### F44. AI 동선 최적화 ⭐
```javascript
{
  model: "Opus 4.7",
  inputs: {
    selectedActivities: "사용자 선택",
    fixedTimes: "예약 시간",
    hotelBase: "호텔 위치",
    familyPace: "저질 체력"
  },
  output: {
    sequence: "최적 순서",
    times: "시간별 배치",
    transport: "이동 방법",
    breaks: "휴식 시간"
  }
}
```

#### F45. 실시간 변경 + 재최적화
- 사용자 변경 → [재최적화] → AI 재배치

#### F46. 자유도 ⭐⭐⭐⭐⭐
- 어떤 활동이든 추가/삭제
- 어떤 시점에든 변경
- AI 자동 보조

---

## 9. 외부 API 명세

### 9.1 Claude API (메인)

#### Endpoint
- URL: `https://api.anthropic.com/v1/messages`
- Method: POST
- Auth: API Key

#### 모델 선택 매트릭스
```javascript
{
  default: 'claude-haiku-4-5',         // 95% 호출
  withWebSearch: 'claude-sonnet-4-6',  // 검색 품질
  routeOptimization: 'claude-opus-4-7'  // 정확도
}
```

#### Web Search Tool
```json
{
  "tools": [{
    "type": "web_search_20250305",
    "name": "web_search"
  }]
}
```

#### 비용 (7박 8일 예상)
| 기능 | 호출 수 | 모델 | 비용 |
|---|---|---|---|
| 오늘의 추천 | 8회 | Haiku | ₩200 |
| 의사결정 도우미 | 70회 | Haiku | ₩2,000 |
| 매너 팝업 | 50회 | Haiku | ₩1,000 |
| 명소 인사이트 자동 | 100회 | Haiku | ₩3,000 |
| Butler 자연어 (Web Search) | 30회 | Sonnet | ₩3,000 |
| 주변 발견 | 25회 | Sonnet (Web Search) | ₩2,500 |
| 동선 최적화 | 15회 | Opus | ₩2,000 |
| 골든벨 | 8회 | Haiku | ₩400 |
| 일기 정리 | 8회 | Haiku | ₩300 |
| **합계** | **314회** | 하이브리드 | **약 ₩14,400** |

### 9.2 OpenWeatherMap

```javascript
fetch('/.netlify/functions/weather?lat=51.5074&lon=-0.1278')
// 응답:
{
  current: { temp: 17, weather: "Clouds", icon: "..." },
  forecast: [{ date: "2026-06-15", min: 14, max: 19, icon: "..." }]
}
```

### 9.3 TfL Unified API

```javascript
// 노선 상태
fetch('/.netlify/functions/tfl?endpoint=Line/central/Status')

// 응답
{
  line: "Central",
  status: "Good Service",
  disruption: null
}
```

주요 노선: Central, Piccadilly, Jubilee, Victoria, Northern, District, Circle

### 9.4 환율 API

```javascript
fetch('/.netlify/functions/exchange?base=GBP')
// 응답: { rates: { KRW: 2006.5, USD: 1.27 } }
```

### 9.5 Google Maps (인증 불필요)

#### Embed (지도 표시)
```html
<iframe
  src="https://www.google.com/maps?q=${lat},${lng}&output=embed"
  width="100%" height="300"
></iframe>
```

#### URL Scheme (앱 호출)
```javascript
// iOS/Android 동일
window.location.href = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
```

---

## 10. PWA 설정

### 10.1 manifest.json

```json
{
  "name": "우리 가족 런던 트립",
  "short_name": "런던 트립",
  "description": "황씨 가족의 런던 여행 동반자 - Travel Butler",
  "version": "1.0.0",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFF9F5",
  "theme_color": "#C8102E",
  "orientation": "portrait",
  "scope": "/",
  "lang": "ko-KR",
  "icons": [
    { "src": "/icons/icon-72.png", "sizes": "72x72", "type": "image/png" },
    { "src": "/icons/icon-96.png", "sizes": "96x96", "type": "image/png" },
    { "src": "/icons/icon-128.png", "sizes": "128x128", "type": "image/png" },
    { "src": "/icons/icon-144.png", "sizes": "144x144", "type": "image/png" },
    { "src": "/icons/icon-152.png", "sizes": "152x152", "type": "image/png" },
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-384.png", "sizes": "384x384", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "categories": ["travel", "lifestyle"]
}
```

### 10.2 Service Worker

```javascript
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `london-trip-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/styles/theme.css',
  '/scripts/main.js',
  '/data/attractions.json',
  '/data/restaurants.json',
  '/data/shops.json',
  '/data/etiquette.json',
  '/data/confirmed.json',
  '/data/days.json',
  '/data/zones.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // API: Network-first
  if (url.pathname.startsWith('/.netlify/functions/')) {
    event.respondWith(
      fetch(event.request).catch(() => 
        new Response(JSON.stringify({
          error: '오프라인 상태입니다.'
        }), { headers: { 'Content-Type': 'application/json' } })
      )
    );
    return;
  }
  
  // Static: Cache-first
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, resClone);
        });
        return res;
      });
    })
  );
});
```

### 10.3 설치 가이드 (가족)

#### iOS (엄마·자녀)
1. Safari로 어플 URL 접속
2. 하단 공유 버튼 (□↑) 탭
3. "홈 화면에 추가"
4. "추가" 탭

#### Android (아빠 갤럭시)
1. Chrome으로 어플 URL 접속
2. 자동 팝업 "홈 화면에 추가"
3. 또는 메뉴 → "홈 화면에 추가"

---

## 11. 보안

### 11.1 API 키 보호

```bash
# Netlify 환경변수
CLAUDE_API_KEY=sk-ant-xxx
OPENWEATHER_API_KEY=xxx
```

### 11.2 가족 접근 제어

#### 기본: URL Secrecy
- 가족 카톡으로만 URL 공유
- robots.txt에서 검색 엔진 차단

#### 강화 옵션: 4자리 비밀번호
```javascript
const password = prompt("가족 비밀번호 (4자리)");
if (password === '0615') {
  localStorage.setItem('auth_token', 'verified');
}
```

### 11.3 데이터 보호

- 사진 저장 X (인식만 사용 시)
- 위치 권한 명시 요청
- 외부 추적 X (Analytics 없음)
- LocalStorage 민감 정보 없음

---

## 12. 개발 단계

### 12.1 Phase 1 — MVP (D-28 ~ D-14)

목표: 출국 2주 전 사용 가능
- ✅ 홈 화면 (D-Day, Day 그리드)
- ✅ Day 화면 (확정 활동 표시)
- ✅ 활동 카드 시스템 (시드 80개)
- ✅ Zone 선택 → 활동 추가
- ✅ 체크리스트
- ✅ 비상 연락처
- ✅ 환율·날씨·시차 위젯
- ✅ PWA 설치 (iOS·Android)
- ✅ 다크모드

기간: 1-2주

### 12.2 Phase 2 — AI 통합 (D-14 ~ D-7)

목표: 출국 1주 전 AI 풀 활용
- ✅ Travel Butler (자연어 질의응답)
- ✅ 오늘의 추천 (자동)
- ✅ 의사결정 도우미
- ✅ 액션 시점 매너 가이드 팝업
- ✅ 응급 AI 가이드
- ✅ Web Search 활성

기간: 1주

### 12.3 Phase 3 — 동선 최적화 + 실시간 (D-7 ~ 출국)

목표: 출국 직전 완성
- ✅ AI 동선 최적화 (Opus 4.7)
- ✅ 실시간 변경 + 재최적화
- ✅ TfL API 통합 (튜브)
- ✅ Google Maps 통합
- ✅ 진행률 시각화

기간: 1주

### 12.4 Phase 4 — 게임 + 추억 (여행 중·후)

목표: 여행 중 사용
- ✅ 골든벨 게임
- ✅ 일기 자동 정리
- ✅ 예산 분석
- ✅ 가족 협상 도우미
- ✅ 추억 책자 (귀국 후)

기간: 점진 개선

### 12.5 우선순위 매트릭스

| 기능 | 필수도 | 난이도 | Phase |
|---|---|---|---|
| Day별 일정 | ⭐⭐⭐⭐⭐ | 낮음 | 1 |
| 활동 카드 | ⭐⭐⭐⭐⭐ | 중간 | 1 |
| 체크리스트 | ⭐⭐⭐⭐⭐ | 낮음 | 1 |
| Travel Butler | ⭐⭐⭐⭐⭐ | 높음 | 2 |
| 동선 최적화 | ⭐⭐⭐⭐ | 높음 | 3 |
| 골든벨 | ⭐⭐⭐⭐ | 중간 | 4 |
| 진행률 시각화 | ⭐⭐⭐ | 중간 | 3 |
| 추억 책자 | ⭐⭐ | 낮음 | 4 |

---

## 13. 배포 가이드

### 13.1 사전 준비 (사용자 작업)

#### Step 1: Claude API 키 발급
1. https://console.anthropic.com 가입
2. 결제 카드 등록
3. API Keys → Create Key
4. 키 복사 (sk-ant-xxx)

#### Step 2: OpenWeatherMap (무료)
1. https://openweathermap.org 가입
2. API Keys → 기본 키 복사

### 13.2 Netlify 배포

#### Step 1: GitHub 저장소 생성
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/[사용자명]/london-family-trip.git
git push -u origin main
```

#### Step 2: Netlify 가입
1. https://www.netlify.com 가입 (GitHub 연동)
2. "Add new site" → "Import from Git"
3. GitHub 저장소 선택

#### Step 3: 환경변수 설정
```
Site Settings → Environment Variables
- CLAUDE_API_KEY: sk-ant-xxx
- OPENWEATHER_API_KEY: xxx
```

#### Step 4: 자동 배포 완료
- URL: https://[랜덤이름].netlify.app
- 또는 커스텀 도메인 (선택)

#### Step 5: 가족 공유
```
"우리 가족 런던 트립 어플:
https://[URL]

iOS: Safari → 공유 → 홈 화면 추가
Android: Chrome → 메뉴 → 홈 화면 추가"
```

### 13.3 비용

| 항목 | 비용 |
|---|---|
| Netlify 호스팅 | 무료 |
| Netlify Functions | 무료 (125k 호출/월) |
| Claude API | ₩14,000 / 7박 8일 |
| OpenWeatherMap | 무료 |
| TfL API | 무료 |
| Exchange API | 무료 |
| Google Maps | 무료 (Embed/URL) |
| **총 운영비** | **약 ₩14,000 ~ ₩25,000** |

---

## 14. 부록

### 14.1 사용자 매뉴얼 (가족용)

#### 첫 진입
1. URL 접속 → "홈 화면 추가"
2. 가족 비밀번호 입력 (선택)
3. 환영 화면

#### 매일 사용 흐름
- **아침**: 어플 진입 → 오늘 Day 확인 → 활동 추가 → 동선 최적화
- **이동 중**: 지도 확인 → 다음 활동
- **저녁**: 골든벨 게임 → 일기

#### 단축키 (Bottom Nav)
- 🏠 홈
- 📅 Day
- 🎩 Butler (어디서든 호출)
- ✅ 체크리스트
- 🛠️ 도구
- 🆘 응급 (긴급 상황)

### 14.2 데이터 백업

#### 내보내기
```javascript
// 설정 → "데이터 내보내기"
const data = JSON.stringify(localStorage);
// 카톡 또는 이메일 공유
```

#### 복원
```javascript
// 새 폰 → "데이터 가져오기"
// JSON 붙여넣기
```

### 14.3 트러블슈팅

| 문제 | 해결 |
|---|---|
| 인터넷 안 됨 | 시드 데이터 정상 작동, AI X |
| Butler 응답 늦음 | 5-15초 정상, 로딩 인디케이터 |
| 동기화 안 됨 | Firebase 인증 확인 또는 폴링 |
| 지도 안 보임 | Google Maps 앱 설치 권장 (iOS) |

### 14.4 향후 확장 (v2)

- 음성 명령 (Butler 말로 질문)
- 카메라 인식 (메뉴판·표지판)
- AR 명소 정보
- 더 많은 여행지 (Paris, Rome)

### 14.5 참고 자료

#### 외부 문서
- Claude API: https://docs.claude.com
- TfL API: https://api.tfl.gov.uk
- Netlify: https://www.netlify.com
- PWA 가이드: https://web.dev/progressive-web-apps/

#### 가족 결정 사항
- 호텔: Citadines Holborn + Royal Horseguards
- 비행: KE907/908
- 예약 완료: Wimbledon 6/16 14:30
- 뮤지컬: Matilda + Les Mis (Day Seats 또는 일반 예약)
- 가족: 3인 (아빠·엄마·자녀 만 12세 BP 디베이터)

### 14.6 시드 데이터 구조 (별도 JSON)

```
/data
├── days.json           # Day 1-8 일정 골격
├── zones.json          # Zone A-F 정의
├── attractions.json    # 명소 카드 ~30개
├── restaurants.json    # 식당 카드 ~30개
├── shops.json          # 매장 카드 ~15개
├── pubs.json           # 펍 카드 ~8개
├── etiquette.json      # 영국 매너 (카테고리별)
├── checklist.json      # 사전 체크리스트
├── emergency.json      # 응급 정보
└── confirmed.json      # 예약 확정 (Wimbledon 등)
```

각 카드 구조는 섹션 6.3 활동 카드 모델 참조.

---

## 🎯 Claude Code 작업 시작 가이드

### 1단계: 프로젝트 초기화
```bash
mkdir london-family-trip
cd london-family-trip
npm init -y
```

### 2단계: 기본 폴더 구조 생성
섹션 3.5 폴더 구조 참조

### 3단계: PWA 기본 설정
- manifest.json 작성 (섹션 10.1)
- service-worker.js 작성 (섹션 10.2)
- index.html 기본 구조

### 4단계: 시드 데이터 JSON 생성
/data 폴더에 9개 JSON 파일 작성

### 5단계: 디자인 시스템 적용
섹션 4 디자인 시스템 + Tailwind CDN

### 6단계: Phase 1 (MVP) 개발
- 홈 화면
- Day 화면
- 활동 카드
- 체크리스트
- PWA 설치

### 7단계: Netlify Functions
- /butler 함수 (섹션 3.6)
- /weather, /tfl, /exchange 프록시

### 8단계: Phase 2-4 점진 추가

### 9단계: Netlify 배포
섹션 13 배포 가이드

### 10단계: 가족에게 공유
"우리 가족 런던 트립" URL 카톡 공유

---

**END OF PRD**

이 PRD는 황씨 가족의 7박 8일 런던 여행 (2026.06.15-22)을 위한 PWA "우리 가족 런던 트립 - Travel Butler" 어플 개발을 위한 완전한 명세서입니다.

작성: 2026.05.21
버전: 1.0
다음 단계: Claude Code로 전달 → Phase 1 (MVP) 개발 시작
