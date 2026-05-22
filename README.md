# 우리 가족 런던 트립 🇬🇧

황씨 가족 7박 8일 런던 여행 (2026.06.15~06.22) PWA 어플 — **Travel Butler**

> **Phase 1 (MVP) 완료**: PWA 기반 · 홈 화면 · Day 화면 · 활동 카드 시스템 + 체크리스트·시차·응급·다크모드

---

## 🛠️ 사용 기술

- **HTML / CSS / Vanilla JS** (빌드 스텝 없음)
- **Tailwind CSS** (CDN) — 유틸리티 레이아웃
- **Alpine.js** (CDN) — 가벼운 반응성·뷰 전환
- **PWA** — Service Worker(오프라인 캐시) + Manifest
- **Pretendard** 폰트 (CDN)
- 배포: **Netlify** (정적 호스팅)

> 빌드 도구가 없어 파일을 그대로 올리면 동작합니다. (모바일 우선, 가족 따뜻함 톤)

---

## 📂 폴더 구조

```
/런던여행
├── index.html            # SPA 셸 (모든 화면)
├── manifest.json         # PWA 매니페스트
├── service-worker.js     # 오프라인 캐시
├── netlify.toml          # Netlify 설정 (publish=., functions 디렉터리 예약)
├── robots.txt            # 검색엔진 차단 (가족 비공개)
├── /icons                # icon.svg, icon-maskable.svg
├── /css
│   └── styles.css        # 디자인 시스템 (테마·다크모드·컴포넌트·애니메이션)
├── /js
│   ├── app.js            # 메인 Alpine 앱 (라우팅·카운트다운·활동 추가·저장)
│   ├── storage.js        # LocalStorage 래퍼
│   └── pwa.js            # 서비스 워커 등록 + 설치 프롬프트
└── /data                 # 시드 데이터 (오프라인)
    ├── days.json         # Day 1-8 (컨셉·호텔·날짜)
    ├── zones.json        # Zone A-F
    ├── confirmed.json    # 항공·호텔·윔블던 확정
    ├── attractions.json  # 명소
    ├── restaurants.json  # 식당
    ├── shops.json        # 매장
    ├── pubs.json         # 펍
    ├── checklist.json    # 체크리스트
    └── emergency.json    # 비상 연락처·영어 표현
```

---

## ✅ Phase 1 구현 기능

| 화면 | 내용 |
|---|---|
| **홈** | D-Day 카운터(출발 전/여행 중/종료 자동), Butler 입력(Phase 2 안내), 오늘의 추천(Phase 2 안내), Day 1-8 그리드(오늘 자동 강조) |
| **Day** | 날짜·호텔·컨셉, 확정 일정(항공/윔블던), 내가 추가한 활동, Zone 선택 그리드 |
| **Zone** | 분류 필터(전체/명소/식당/매장/펍), 큐레이션 활동 카드 |
| **활동 카드** | 시드 정보 전부, ★평점·자녀 적합도·가격, 추천 이유, 매너 가이드 바텀시트, 지도 열기, 오늘에 추가/빼기 |
| **체크리스트** | 진행률 바, 단계별 항목 체크(저장됨) |
| **도구** | 런던·서울 실시간 시차(작동), 환율·날씨(Phase 3 안내) |
| **응급** | 999/111/101, 대사관, 호텔, 응급 영어 표현 (탭하면 전화 연결) |
| **공통** | 다크모드, LocalStorage 저장, 모바일 하단 네비, PWA 설치 |

활동 추가·체크 상태·다크모드는 **LocalStorage**에 저장되어 새로고침 후에도 유지됩니다.

---

## 💻 로컬에서 실행

빌드가 필요 없습니다. 폴더에서 정적 서버만 띄우면 됩니다.

```bash
# Python (대부분 설치되어 있음)
python -m http.server 8000
# → http://localhost:8000 접속

# 또는 Node
npx serve .
```

> `file://`로 직접 열면 `fetch`로 JSON을 못 읽으니 **반드시 로컬 서버**로 열어주세요.

---

## 🚀 Netlify 배포

1. **GitHub 저장소 생성 후 push**
   ```bash
   git init
   git add .
   git commit -m "Phase 1 MVP"
   git remote add origin https://github.com/<사용자명>/london-family-trip.git
   git push -u origin main
   ```
2. **Netlify** → Add new site → Import from Git → 저장소 선택
3. 빌드 설정: **Build command 비움**, **Publish directory = `.`** (netlify.toml에 이미 설정됨)
4. 배포 완료 → `https://<랜덤이름>.netlify.app`
5. 가족 카톡으로 URL 공유 → iOS는 Safari "홈 화면에 추가", Android는 Chrome "홈 화면에 추가"

> 드래그&드롭 배포: Netlify 대시보드에 이 폴더를 그대로 끌어다 놓아도 됩니다.

---

## 📱 PWA 설치

- **iOS (엄마·자녀)**: Safari로 접속 → 공유 버튼 → "홈 화면에 추가"
- **Android (아빠 갤럭시)**: Chrome으로 접속 → "홈 화면에 추가" 팝업

---

## 🗺️ 다음 단계 (PRD 기준)

- **Phase 2 — AI 통합**: Travel Butler 자연어 질의응답, 오늘의 추천, 매너 AI, 응급 AI
  - `netlify/functions/butler.js` 등 서버리스 추가, 환경변수 `CLAUDE_API_KEY` 설정
- **Phase 3 — 동선 최적화 + 실시간**: Opus 동선 최적화, TfL 튜브, 실시간 날씨·환율
- **Phase 4 — 게임·추억**: 골든벨, 일기 자동 정리, 예산 분석

> `netlify.toml`의 `[functions]` 디렉터리는 Phase 2에서 바로 쓸 수 있게 미리 예약해 두었습니다.

---

## 📝 참고

- 활동 카드 이미지는 현재 **이모지 + Zone 컬러 그라데이션**으로 대체되어 있습니다. 실제 사진을 쓰려면 `/images`에 WebP를 추가하고 각 데이터의 `image` 필드를 채우세요.
- PWA 아이콘은 SVG입니다. 일부 구형 iOS에서 더 또렷한 홈 화면 아이콘이 필요하면 PNG(192/512px)로 변환해 `manifest.json`에 추가하세요.
- 시드 데이터(80+ 아이템)는 PRD의 대표 항목 위주로 구성되어 있으며, 같은 JSON 스키마로 자유롭게 추가할 수 있습니다.
