# CLAUDE.md — Travel Butler

> 이 파일은 Claude Code가 이 레포에서 작업할 때 읽는 작업 지침서입니다.
> PM(Cowork Claude)이 설계·일정을, **Claude Code(이 레포)가 실제 구현·라이브 테스트·커밋·배포**를 담당합니다.

## 0. 역할 분담
- **PM (Cowork)**: 마스터플랜·백로그·리서치·디자인 결정·스펙 초안·리뷰. (워크스페이스의 `*.md` 문서들)
- **Claude Code (여기)**: 티켓 실행, 코드 통합, `netlify dev` 등 로컬 실행·검증, 실제 Claude API 호출로 품질 확인, 커밋·푸시·배포.
- Cowork는 사용자 localhost·실제 Netlify 함수·`CLAUDE_API_KEY`에 접근할 수 없으므로, 라이브 검증과 배포는 반드시 Claude Code가 수행.

## 1. 제품 한 줄
"AI 버틀러가 전세계 도시별 맞춤 일정을 즉석 생성하고, 가족이 실시간으로 함께 조율하는 여행 앱." 자녀 동반 가족 여행자 타깃.

## 2. 확정 사항 (변경 시 PM과 합의)
- 앱 이름: **Travel Butler** (구 "Trip Butler" 표기 정리 완료)
- 수익 모델: **Freemium** (라이트 무료 + 풀기능 유료) — 세부 경계는 Phase 3에서 확정
- 1차 플랫폼: **Android 먼저** (iOS 후속), Capacitor 패키징 예정
- 출시: 기한 없음 / **품질 우선** (마일스톤 게이트)
- **글로벌/다국어**: 처음부터 다국어. 현재 **한·영·일·중(간체)**. 번체는 후속(`zh-TW` 추가).
- 언어→기본통화 자동: ko→KRW, ja→JPY, zh→CNY, en→USD (설정 분리 가능)
- 디자인: **웜 & 프리미엄(에디토리얼)** — 크림 #FAF6F0 / 잉크 #2B2724 / 테라코타 #C7613F, 세리프(Fraunces+Noto Serif KR/JP/SC) 제목 + Pretendard 본문, 모바일 우선
- 일정 생성 모델: **Haiku 유지**(품질은 프롬프트·검증으로 보완) — 사유는 §4
- 콘텐츠 신뢰성 v1: 면책 + 지도 딥링크(Places 실존검증은 후속)

## 3. 레포 구조
- 정적 PWA, 빌드 없음(`netlify.toml` publish="."), Netlify 자동 배포.
- `/` (루트) = 런던 가족앱(`index.html`, `js/app.js`, `data/*.json`, `js/tube-stations.js`). **레거시** — 향후 엔진 본체로 대체 예정.
- `/lab` = **Travel Butler 범용 엔진**(현재 개발 주력). `lab/index.html` + `lab/app.js` + `lab/i18n.js`.
- `netlify/functions/butler.js` = Claude API 프록시(공유 백엔드). itinerary/route/general 3종 프롬프트 + 강건한 JSON 파서(`parseAiJson`/`repairTruncatedJson`).
- `CLAUDE_API_KEY`는 Netlify 환경변수(레포에 없음, 안전).

## 4. 하드 제약 (반드시 인지)
1. **Netlify 무료 함수 10초 타임아웃** → itinerary 모델을 Sonnet→Haiku로 강제(`butler.js selectModel`). Sonnet은 30s+ 걸려 504. 품질은 프롬프트/검증으로 끌어올린다. 바꾸려면 백그라운드 함수/스트리밍 등 별도 설계 필요(PM과 합의).
2. **Firebase 보안 규칙 개방 상태**(`js/firebase-config.js` 주석). 현재 프로젝트 `hwang-london-2026`은 런던 가족용. 상용은 **Travel Butler 전용 새 Firebase 프로젝트**를 파고 규칙을 잠근다(아래 B4).
3. 정적 PWA라 번들러 없음. ESM/바닐라 + Alpine.js(CDN) + 자체 CSS. 의존성 최소.

## 5. 현재 상태 — PM 초안 위치 ⚠️ (이 레포에는 아직 없음, **통합 필요**)
> Sprint 1~3 변경분은 **이 git 레포가 아니라 Cowork 워크스페이스 별도 복사본**에 있습니다.
> **소스 경로**: `C:\Users\edwar\OneDrive\문서\Claude\Projects\AI 여행 어플 제작하기\london-app\`
> (PM이 GitHub URL로 새로 클론해 작업한 복사본 — 커밋/푸시 안 됨. 그래서 현재 레포 최신은 여전히 c24933f.)
> **할 일**: 위 경로의 아래 파일들을 이 레포의 동일 경로로 복사 → 라이브 검증 → 커밋.

위 복사본에 들어있는 Sprint 1~3 결과:
- **Sprint1 — 환각 방지**(`butler.js` itinerary 프롬프트): "실존·유명 장소만, 불확실하면 제외", 식당 환각 방지(지역+음식 폴백), 자가 점검 단계.
- **Sprint2 — 웜&프리미엄 리디자인**(`lab/index.html`): 런던 styles.css/Tailwind 의존 제거, 자체 디자인 시스템. "Trip Butler"→"Travel Butler".
- **Sprint3 — 다국어**: `lab/i18n.js`(신규, 한·영·일·중 사전+로케일/통화 메타), `lab/app.js`(언어 상태·브라우저 감지·수동전환·언어별 통화·날짜 로케일·스키마 `nameLocal`/`cityLocal`), `butler.js`(출력언어 지시 + 스키마 일반화).

> ⚠️ 위 변경은 node 문법검증까지만 됨. **실제 Claude API 호출로 생성 품질·다국어·환각을 검증하지 못함**(Cowork 환경 제약). Claude Code가 `netlify dev`로 띄워 한·영·일·중 각각 도쿄/파리 생성 → 결과 확인 필요.

## 6. 즉시 다음 티켓 (우선순위)
1. **[검증·배포]** Sprint1~3 변경을 로컬에서 띄워 4개 언어 생성 테스트. 환각(특히 식당)·언어 일관성·통화/날짜 로케일·언어 스위처 확인 → 문제 없으면 커밋·푸시.
2. **[B4 영속화] (Phase 1 핵심)** 생성 결과를 Firebase에 저장→재접속 시 캐시 로드(재생성 차단). **선행: Travel Butler 전용 Firebase 프로젝트 생성**(사용자 콘솔 작업) + Auth 준비. 데이터 모델은 처음부터 다중여행 구조 `/users/{uid}/trips/{tripId}/...` (Phase 2와 묶어 설계).
3. **[언어 전환 시 재생성 UX]** 현재 언어 변경은 UI만 즉시 갱신, 기존 일정 내용은 유지. "이 언어로 다시 생성" 버튼 여부 결정(캐싱 설계와 연동) — PM과 합의.

## 7. 백로그 / 상세 문서 (워크스페이스, PM 관리)
- `Travel_Butler_마스터플랜.md` — 6개 작업영역·Phase 로드맵·비용·리스크
- `Travel_Butler_Phase1-2_백로그.md` — 에픽 A~F, 30개 티켓, 의존성·완료기준
- `design-directions.html` — 디자인 4종 비교(1번 채택)

## 8. 작업 규칙
- 변경은 **티켓 단위 작은 커밋**. 커밋 메시지에 티켓 ID(B4 등) 표기.
- 사용자 표시 문자열은 **반드시 `lab/i18n.js`에 키 추가**(하드코딩 금지). 4개 언어 모두 채운다.
- `butler.js` itinerary 스키마(`name`/`nameLocal`/`cityLocal`/`countryLocal`)와 `lab/app.js` 렌더 헬퍼(`placeTitle`/`cityTitle` 등)는 한 쌍 — 한쪽 바꾸면 양쪽 동기화.
- 비용/품질에 영향 주는 변경(모델·max_tokens·프롬프트 구조)은 PM과 합의.
- 부수효과 큰 작업(배포, 결제, 권한/규칙 변경)은 사용자 확인 후.
