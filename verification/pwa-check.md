# PWA 설정 검증 (PRD §10 대조)

> 생성: 2026-05-21 · 대상: manifest.json, service-worker.js, icons/

## 1. manifest.json 필수 필드

보유 필드: `name, short_name, description, version, start_url, display, background_color, theme_color, orientation, scope, lang, icons, categories`

| 필드 | 값 | 판정 |
|---|---|---|
| name | "우리 가족 런던 트립" | ✅ |
| short_name | "런던 트립" | ✅ |
| description | 있음 | ✅ |
| start_url | "/" | ✅ |
| display | "standalone" | ✅ |
| background_color | "#FFF9F5" | ✅ |
| theme_color | "#C8102E" | ✅ |
| orientation | "portrait" | ✅ |
| scope | "/" | ✅ |
| lang | "ko-KR" | ✅ |
| categories | ["travel","lifestyle"] | ✅ |
| icons | 2개 (SVG) | ⚠️ 아래 참조 |

**필수 필드 전부 충족** ✅ (PWA 설치 가능 조건 만족: name, icons, start_url, display)

## 2. 아이콘 (⚠️ PRD §10.1과 불일치)

| PRD 요구 | 현재 |
|---|---|
| PNG 8종: 72/96/128/144/152/192/384/512 | ❌ SVG 2종만 (`icon.svg`, `icon-maskable.svg`, sizes="any") |

- ✅ 장점: SVG는 무한 확대 + 단일 파일. 최신 Chrome/Android는 SVG 아이콘 지원.
- ⚠️ 위험: **구형 iOS Safari는 apple-touch-icon으로 SVG를 제대로 렌더 못 할 수 있음** → 홈 화면 아이콘이 흐리거나 누락 가능. 가족 폰이 아이폰 2대이므로 **실기기 확인 필요**.
- 권장: 최소 180(apple-touch), 192, 512 PNG 추가.

## 3. Service Worker 캐시 전략 (PRD §10.2)

| 전략 | 구현 | 위치 |
|---|---|---|
| 정적 자산 사전 캐시 (install) | ✅ | STATIC_ASSETS 18개, `Promise.allSettled`로 일부 실패 허용 |
| 캐시 버전 관리 + 구버전 삭제 (activate) | ✅ | CACHE_VERSION = v1.0.1 |
| API/Functions: Network-first | ✅ | `/.netlify/functions/*` → 오프라인 시 JSON 안내 |
| 앱 셸(HTML): Network-first | ✅ | (PRD 대비 **개선**: 업데이트 즉시 반영) |
| 기타 정적: Stale-while-revalidate | ✅ | (PRD의 Cache-first 대비 **개선**: 오프라인 + 점진 업데이트) |
| 외부 CDN 요청 미가로채기 | ✅ | origin 체크 |

**평가**: PRD가 요구한 Cache-first/Network-first 이원 전략을 충족하고, 오히려 **업데이트 전파 문제를 막도록 개선**됨(검증 중 cache-first로 인한 stale 버그 발견·수정).

## 4. PWA 메타/등록

| 항목 | 구현 |
|---|---|
| manifest 링크 | ✅ index.html L11 |
| theme-color 메타 | ✅ #C8102E |
| apple-mobile-web-app-capable | ✅ |
| apple-touch-icon | ⚠️ SVG 참조 (PNG 권장) |
| SW 등록 | ✅ js/pwa.js, load 시 register |
| beforeinstallprompt 처리 | ✅ window.promptInstall() 보관 |

## 판정
- 설치 가능 PWA 요건: ✅ 충족
- SW 캐시 전략: ✅ 충족 + 개선
- **보완 필수**: PNG 아이콘(특히 apple-touch 180px) 추가 + 아이폰 실기기 설치 테스트
