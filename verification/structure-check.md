# 구조 검증 (PRD §3.5 대조)

> 생성: 2026-05-21 · 대상: PRD.md 섹션 3.5 "폴더 구조"

## ⚠️ 핵심 결론 (먼저 읽어주세요)

현재 프로젝트는 PRD §3.5가 제시한 **`/public` + `/src` (빌드 기반) 구조를 따르지 않고**, 빌드 스텝이 없는 **평면 정적 구조**로 구현되었습니다.

- **이유**: 사용 기술이 Vanilla JS + Tailwind CDN + Alpine.js (번들러·빌드 없음)이고, Netlify에 파일을 그대로 올리면 동작해야 하므로 `/src` 모듈 구조(import 기반)는 부적합.
- **영향**: 아래 "누락"으로 표시된 `/src/...` 항목 다수는 *기능 누락이 아니라 위치·구성 차이* 또는 *Phase 2/3 범위*입니다. PM 판단을 위해 둘을 구분해 표기했습니다.

---

## ✅ 존재하는 항목 (기능적으로 대응됨)

| PRD §3.5 항목 | 현재 위치 | 비고 |
|---|---|---|
| `/public/index.html` | `index.html` (루트) | SPA 셸, 전 화면 포함 |
| `/public/manifest.json` | `manifest.json` | ✅ |
| `/public/service-worker.js` | `service-worker.js` | ✅ |
| `/public/icons` | `icons/` | SVG 2종 (PNG 8종 아님 → pwa-check 참조) |
| `/src/data/days.json` | `data/days.json` | ✅ |
| `/src/data/zones.json` | `data/zones.json` | ✅ |
| `/src/data/attractions.json` | `data/attractions.json` | ✅ |
| `/src/data/restaurants.json` | `data/restaurants.json` | ✅ |
| `/src/data/shops.json` | `data/shops.json` | ✅ |
| `/src/data/checklist.json` | `data/checklist.json` | ✅ |
| `/src/data/emergency.json` | `data/emergency.json` | ✅ |
| `/src/data/confirmed.json` | `data/confirmed.json` | ✅ |
| `/src/services/storage.js` | `js/storage.js` | ✅ |
| `/src/services/pwa.js` | `js/pwa.js` | ✅ |
| `/src/styles/*.css (4파일)` | `css/styles.css` (1파일 통합) | theme·components·animations 모두 포함 |
| `netlify.toml` | `netlify.toml` | ✅ (functions 디렉터리 예약) |
| `README.md` | `README.md` | ✅ |

## ❌ 누락된 항목

### 누락 A — Phase 1 범위인데 빠진 것 (보완 권장)
| 항목 | 영향도 | 설명 |
|---|---|---|
| `data/etiquette.json` | 中 | PRD는 별도 매너 데이터 파일을 명시. 현재는 각 활동 JSON에 `etiquette` 배열로 **인라인 내장**. 동작은 하나 PRD §8.4 F27(카테고리: pub/michelin/market/museum…) 구조와 불일치. |
| `/public/images` | 低 | 실제 사진 폴더 없음. 현재 이모지+Zone컬러 그라데이션으로 대체. |
| PNG 아이콘 8종 | 中 | 72~512 PNG 대신 SVG 2종. (pwa-check.md 참조) |

### 누락 B — Phase 2/3/4 범위 (지금 없는 게 정상)
| 항목 | 해당 Phase |
|---|---|
| `/src/services/butler.js, weather.js, tfl.js, exchange.js, geolocation.js` | 2~3 |
| `/netlify/functions/butler.js, weather.js, tfl.js, exchange.js` | 2~3 |
| `/src/utils/dateUtils.js, distanceCalc.js, routeOptimizer.js` | 3 (동선 최적화) |
| `/src/pages/* (game, butler, plan, progress, memories)` | 2~4 |
| `/src/components/* (개별 컴포넌트 파일)` | 전 Phase (현재 index.html 내 인라인 구현) |
| `package.json` | 빌드/의존성 없음 → 불필요 (Phase 2 Functions 도입 시 생성) |

## ⚠️ PRD에 없지만 추가된 항목

| 항목 | 사유 |
|---|---|
| `data/pubs.json` | PRD §3.5 /data 목록엔 없으나 §7에 "펍 8개" 명시 → 별도 파일로 분리 (적절) |
| `js/app.js` | 메인 Alpine 앱 로직 (PRD 구조엔 명시 안 됐으나 필수) |
| `css/styles.css` | 4개 분리 대신 1개 통합 |
| `robots.txt` | 검색엔진 차단 (PRD §11.2 "검색 엔진 차단" 요구 → 적절) |
| `.claude/launch.json` | 로컬 미리보기 서버 설정 (개발 보조) |

## 판정
- **기능적 구조**: 충족 ✅ (Phase 1에 필요한 모든 파일 존재)
- **PRD §3.5 문자 그대로의 구조**: 불일치 ⚠️ (의도된 아키텍처 변경)
- **권장**: PRD §3.5를 "평면 정적 구조"로 갱신하거나, 본 변경을 PM이 승인 처리.
