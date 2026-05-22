# 실행 가능 여부 테스트

> 생성: 2026-05-21

## 1. 의존성 / 빌드

| 항목 | 결과 |
|---|---|
| package.json | ❌ 없음 → **의도된 설계** (빌드/번들 불필요) |
| npm install 필요? | ❌ 불필요 |
| 빌드 스텝 | ❌ 없음 (정적 파일 그대로 서빙) |
| 런타임 의존성 | CDN 3종 (Tailwind, Alpine.js, Pretendard) — 인터넷 필요 |

⚠️ **오프라인 주의**: Tailwind/Alpine/Pretendard가 외부 CDN이라 **최초 로드는 온라인 필요**. SW가 동일 출처 파일만 캐시하므로(외부 CDN 미가로채기), 완전 오프라인 첫 실행 시 스타일·반응성 깨질 수 있음. 한 번 로드되면 브라우저 HTTP 캐시로 어느 정도 동작. → Phase 2에서 CDN 자산 로컬 번들 검토 권장.

## 2. 로컬 서버 실행

| 항목 | 결과 |
|---|---|
| `python -m http.server 8124` | ✅ 정상 기동 |
| GET /index.html | ✅ **200** |
| GET /data/days.json | ✅ **200** |
| 미리보기 렌더링 | ✅ 홈/Day/Zone/카드/체크리스트/도구/응급 전 화면 정상 |

> `file://` 직접 열기는 fetch(JSON) CORS로 불가 → 반드시 로컬 서버 필요 (README에 명시됨).

## 3. 콘솔 에러 체크

| 항목 | 결과 |
|---|---|
| 브라우저 콘솔 (error 레벨) | ✅ **0건** (preview_console_logs error 필터 = "No console logs") |
| JSON 파싱 (9파일) | ✅ 전부 성공 |
| Alpine 초기화 | ✅ (x-cloak 해제, 화면 렌더) |

## 4. 배포 준비 (Netlify)

| 항목 | 결과 |
|---|---|
| netlify.toml (publish=".") | ✅ |
| robots.txt (검색 차단) | ✅ |
| 빌드 명령 불필요 | ✅ (drag&drop 또는 Git 연동 즉시 배포 가능) |
| Functions 디렉터리 예약 | ✅ (Phase 2 대비) |

## 판정
**즉시 실행·배포 가능** ✅. 로컬 서버 200 응답, 콘솔 에러 0, 전 화면 렌더. 유일한 주의점은 **CDN 의존(완전 오프라인 첫 실행 취약)** — Phase 2 보완 권장.
