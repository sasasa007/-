// 우리 가족 런던 트립 — 메인 Alpine 앱
function tripApp() {
  // Firebase 게임 ref·타이머는 Alpine 반응성(Proxy) 밖에 보관 (객체 프록시 충돌 방지)
  let gameRef = null;
  let gameTimer = null;

  return {
    // ---- 상태 ----
    loaded: false,
    view: 'home',
    dayNum: 1,
    zoneId: null,
    cardId: null,
    typeFilter: 'all',
    sheet: null,        // { title, items } 매너 가이드 등
    butlerSheet: false,

    // 데이터
    days: [],
    zones: [],
    confirmed: { flights: [], hotels: [], bookings: [] },
    activities: [],     // 명소+식당+매장+펍 통합
    checklist: [],
    emergency: {},
    etiquette: {},      // 카테고리별 매너 가이드

    // 저장 상태
    store: null,
    darkMode: false,

    // 카운트다운
    cd: { state: 'before', num: 0, label: '', sub: '', tripDay: null },

    // 시계 (도구)
    clock: { london: '', seoul: '' },

    // 날씨 + 환율 위젯
    weather: { loaded: false, tempC: '', desc: '', humidity: '', wind: '', icon: '', forecast: [] },

    // Firebase 실시간 동기화
    sync: { enabled: false, status: 'idle', lastSync: null },  // status: idle|syncing|synced|offline
    _syncTimer: null,
    _isSyncing: false,       // 자체 write로 인한 listener 재진입 방지
    _deviceId: null,
    _lastPushed: {},         // 필드별 마지막 푸시 스냅샷(JSON) — 변경된 필드만 전송

    // 인터랙티브 튜브맵 (역 목록 피커 + TfL Journey)
    tubeStations: [],
    tubeFilter: '',
    tubeMap: {
      from: null, to: null, selecting: 'from',
      journey: null, journeyLoading: false, journeyError: null
    },
    currency: { loaded: false, rate: 0, date: '' },

    // 오늘의 추천 일정 (날씨 기반 Butler)
    dailyRec: { loading: false, text: null, cachedDate: null },

    // 환율 계산기
    calc: { gbp: '' },

    // TfL 튜브 상태
    tfl: { loaded: false, lines: [] },

    // 예산 분석
    budget: {
      showForm: false,
      editBudget: false,
      newBudgetVal: '',
      newItem: { category: 'food', amount: '', memo: '' },
      aiLoading: false,
      aiAdvice: null
    },

    // 여행일기
    diary: {
      loading: false,
      currentDay: null
    },

    // 가족 협상 도우미
    negotiate: {
      inputs: { dad: '', mom: '', kid: '' },
      loading: false,
      result: null
    },

    // ── 골든벨 게임 (Firebase /game 경로로 3대 동기화) ──
    game: {
      playerRole: null,        // 'dad' | 'mom' | 'kid'
      selectedAnswer: null,
      timeLeft: 10,
      status: 'idle',          // idle|generating|waiting|question|reveal|finished
      dayNum: null,
      questions: [],
      currentQ: 0,
      questionStartAt: null,
      answers: {},
      scores: { dad: 0, mom: 0, kid: 0 },
      players: {}
    },

    // 명소 카드 Butler 인사이트
    cardInsight: null,
    cardInsightLoading: false,

    // 경로 최적화
    routeResult: null,   // { timeline, totalTime, tubeLines, advice, intro }
    routeLoading: false,
    routeDayNum: null,

    // 혼잡도 예측 (F25)
    crowd: { loading: false, result: null, place: null },
    // 남은 일정 최적화 (F32)
    tripOptimize: { loading: false, result: null },
    // 위치 기반 주변 발견 (F39)
    nearby: { loading: false, items: [], error: null, myLat: null, myLng: null },

    // F40/F42: 커스텀 장소/할 일 추가 (Butler 웹검색 + Zone 판별 + AI 날짜 추천)
    customAdd: {
      show: false,
      step: 'input',         // 'input' | 'enriching' | 'preview' | 'recommending' | 'day-confirm' | 'error'
      targetDay: null,       // Day 화면에서 진입 시 대상 일차
      inputText: '',
      type: 'place',         // 'place' | 'todo'
      preview: null,         // Butler가 반환한 카드 데이터 (zone 포함)
      errorMsg: '',
      // F42 추가
      recommendedDay: null,  // Butler가 추천한 날 (숫자)
      dayReason: '',         // 추천 이유 한 줄
      selectedDay: null,     // 사용자가 최종 선택한 날
      dayLoading: false,     // 날짜 추천 로딩 중
      saveMode: null         // 'zone' | 'day' (분기 추적)
    },

    // F42: 토스트 알림
    toast: { show: false, msg: '' },

    // F41: 체크리스트 커스텀 항목 입력
    checkInput: { label: '', note: '' },

    // Butler AI
    butlerMessages: [],
    butlerInput: '',
    butlerLoading: false,
    butlerQuickQ: [
      '오늘 점심 어디가 좋아?',
      '비 오면 실내 어디?',
      '자녀가 좋아할 곳 추천해줘',
      '호텔 근처 저녁 식사',
      '내일 일정 조언해줘'
    ],

    // ---- 초기화 ----
    async init() {
      this.store = TripStorage.read();
      this.darkMode = !!this.store.settings.darkMode;
      this.applyTheme();

      const base = 'data/';
      const [days, zones, confirmed, att, res, shop, pub, checklist, emergency, etiquette] =
        await Promise.all([
          fetch(base + 'days.json').then(r => r.json()),
          fetch(base + 'zones.json').then(r => r.json()),
          fetch(base + 'confirmed.json').then(r => r.json()),
          fetch(base + 'attractions.json').then(r => r.json()),
          fetch(base + 'restaurants.json').then(r => r.json()),
          fetch(base + 'shops.json').then(r => r.json()),
          fetch(base + 'pubs.json').then(r => r.json()),
          fetch(base + 'checklist.json').then(r => r.json()),
          fetch(base + 'emergency.json').then(r => r.json()),
          fetch(base + 'etiquette.json').then(r => r.json()).catch(() => ({}))
        ]);

      this.days = days;
      this.zones = zones;
      this.confirmed = confirmed;
      this.activities = [...att, ...res, ...shop, ...pub];
      this.checklist = checklist;
      this.emergency = emergency;
      this.etiquette = etiquette;

      this.computeCountdown();
      this.tickClock();
      setInterval(() => this.tickClock(), 30000);

      // 날씨 + 환율 + TfL 로드 (병렬)
      this.fetchWeather();
      // 날씨 로드 후 오늘의 추천 자동 생성 (여행 기간 중만, 하루 1회 캐시)
      setTimeout(() => this.fetchDailyRec(), 1500);
      this.fetchCurrency();
      this.fetchTfl();
      setInterval(() => this.fetchWeather(), 30 * 60 * 1000);  // 30분마다
      setInterval(() => this.fetchCurrency(), 60 * 60 * 1000); // 1시간마다
      setInterval(() => this.fetchTfl(), 5 * 60 * 1000);       // 5분마다

      // 튜브맵 역 데이터 로드
      this.tubeStations = window.TUBE_STATIONS || [];

      // Firebase 실시간 동기화 초기화
      this.initFirebase();

      // 라우팅
      window.addEventListener('hashchange', () => this.syncFromHash());
      this.syncFromHash();

      this.loaded = true;
    },

    // ---- 라우팅 ----
    syncFromHash() {
      const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
      const [v, a, b] = parts;
      // 게임 화면을 떠나면 구독 해제 + 접속 표시 해제
      if (this.view === 'game' && v !== 'game') this._leaveGameCleanup();
      switch (v) {
        case 'day': this.view = 'day'; this.dayNum = +a || 1; break;
        case 'zone': this.view = 'zone'; this.zoneId = a; if (b) this.dayNum = +b; this.typeFilter = 'all'; break;
        case 'card':
          this.view = 'card';
          this.cardId = a;
          if (b) this.dayNum = +b;
          this.cardInsight = null;
          this.cardInsightLoading = false;
          break;
        case 'checklist': this.view = 'checklist'; break;
        case 'tools': this.view = 'tools'; break;
        case 'progress': this.view = 'progress'; break;
        case 'tubemap': this.view = 'tubemap'; break;
        case 'game': this.view = 'game'; this.$nextTick(() => this.enterGame()); break;
        case 'emergency': this.view = 'emergency'; break;
        default: this.view = 'home';
      }
      window.scrollTo(0, 0);
    },
    go(hash) { location.hash = hash; },
    goHome() { this.go('/'); },
    goDay(n) { this.go('/day/' + n); },
    goZone(zid) { this.go('/zone/' + zid + '/' + this.dayNum); },
    goCard(id) { this.go('/card/' + id + '/' + this.dayNum); },
    back() { history.back(); },

    // 하단 네비
    navDay() { this.goDay(this.cd.tripDay || 1); },

    // ---- 카운트다운 ----
    computeCountdown() {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const start = new Date(this.store.trip.startDate + 'T00:00:00');
      const end = new Date(this.store.trip.endDate + 'T00:00:00');
      const DAY = 86400000;
      const dStart = Math.round((start - today) / DAY);
      const dEnd = Math.round((end - today) / DAY);

      if (dStart > 0) {
        this.cd = { state: 'before', num: dStart, label: '여행까지', sub: '2026.06.15 출발 · 7박 8일', tripDay: null };
      } else if (dEnd >= 0) {
        const tripDay = Math.round((today - start) / DAY) + 1;
        this.cd = { state: 'during', num: tripDay, label: '여행 ' + tripDay + '일째', sub: 'Day ' + tripDay + ' 진행 중 🎉', tripDay };
      } else {
        this.cd = { state: 'after', num: 0, label: '여행 종료', sub: '추억이 가득한 런던 ❤️', tripDay: null };
      }
    },

    ddayDisplay() {
      if (this.cd.state === 'before') return 'D-' + this.cd.num;
      if (this.cd.state === 'during') return 'Day ' + this.cd.num;
      return '🏠';
    },

    // ---- 시계 ----
    tickClock() {
      const fmt = (tz) => new Intl.DateTimeFormat('ko-KR', {
        timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: true
      }).format(new Date());
      this.clock.london = fmt('Europe/London');
      this.clock.seoul = fmt('Asia/Seoul');
    },

    // ---- 날씨 + 환율 ----
    // ---- Firebase 실시간 동기화 ----
    initFirebase() {
      try {
        if (typeof window.FIREBASE_CONFIG === 'undefined' || typeof firebase === 'undefined') {
          console.warn('Firebase config/SDK 없음 — 동기화 비활성 (로컬 기능은 정상)');
          return;
        }
        // 기기 고유 ID 생성/복원
        this._deviceId = localStorage.getItem('_deviceId');
        if (!this._deviceId) {
          this._deviceId = 'dev_' + Math.random().toString(36).slice(2, 9);
          localStorage.setItem('_deviceId', this._deviceId);
        }
        if (!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
        const ref = firebase.database().ref('hwang-london-2026/shared');

        // ① 최초 1회: 원격 우선 로드 → 이후 실시간 구독
        ref.once('value', (snapshot) => {
          const remote = snapshot.val();
          if (remote) this._mergeFromFirebase(remote);
          // 초기 스냅샷을 _lastPushed에 기록(방금 받은 데이터 되쏘기 방지)
          ['days', 'expenses', 'diary', 'checklist'].forEach(f => {
            this._lastPushed[f] = JSON.stringify(this.store[f] ?? null);
          });
          ref.on('value', (snap) => {
            if (this._isSyncing) return;     // 자체 write 무시
            const data = snap.val();
            if (data) this._mergeFromFirebase(data);
          });
        });

        this.sync.enabled = true;
        this.sync.status = navigator.onLine ? 'synced' : 'offline';
        window.addEventListener('online', () => { this.sync.status = 'synced'; });
        window.addEventListener('offline', () => { this.sync.status = 'offline'; });
      } catch (e) {
        console.error('Firebase 초기화 실패', e);
      }
    },

    // Firebase → 로컬 병합 (필드별, 다른 필드만 교체)
    _mergeFromFirebase(remote) {
      let changed = false;
      ['days', 'expenses', 'diary', 'checklist', 'customPlaces', 'customChecklistItems'].forEach(f => {
        if (remote[f] === undefined) return;
        const remoteStr = JSON.stringify(remote[f]);
        if (remoteStr !== JSON.stringify(this.store[f] ?? null)) {
          this.store[f] = remote[f];
          this._lastPushed[f] = remoteStr;  // 받은 값은 푸시 대상에서 제외
          changed = true;
        }
      });
      if (changed) {
        TripStorage.write(this.store);   // ⚠️ 여기서는 _writeStore 쓰지 않음 (되쏘기/무한루프 방지)
        this.sync.lastSync = new Date();
      }
    },

    // 로컬 → Firebase (디바운스 800ms, 변경된 필드만 update)
    _pushToFirebase() {
      if (!this.sync.enabled) return;
      clearTimeout(this._syncTimer);
      this.sync.status = 'syncing';
      this._syncTimer = setTimeout(() => {
        const updates = {};
        ['days', 'expenses', 'diary', 'checklist', 'customPlaces', 'customChecklistItems'].forEach(f => {
          const cur = JSON.stringify(this.store[f] ?? null);
          if (cur !== this._lastPushed[f]) {
            updates[f] = this.store[f] ?? null;
            this._lastPushed[f] = cur;
          }
        });
        if (!Object.keys(updates).length) { this.sync.status = 'synced'; return; }
        updates._meta = { updatedAt: Date.now(), deviceId: this._deviceId };
        this._isSyncing = true;
        firebase.database().ref('hwang-london-2026/shared').update(updates)
          .then(() => { this.sync.status = 'synced'; this.sync.lastSync = new Date(); })
          .catch(() => { this.sync.status = 'offline'; })
          .finally(() => { setTimeout(() => { this._isSyncing = false; }, 600); });
      }, 800);
    },

    // 로컬 저장 + Firebase 동기화 래퍼
    _writeStore() {
      TripStorage.write(this.store);
      this._pushToFirebase();
    },

    async fetchWeather() {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast' +
          '?latitude=51.5074&longitude=-0.1278' +
          '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code' +
          '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
          '&timezone=Europe%2FLondon&forecast_days=7',
          { cache: 'no-cache' }
        );
        const d = await res.json();
        const cur = d.current;
        const days = d.daily;
        const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];
        const forecast = days.time.map((dateStr, i) => {
          const dt = new Date(dateStr + 'T12:00:00');
          return {
            date: dateStr,
            dayLabel: i === 0 ? '오늘' : dayLabels[dt.getDay()],
            icon: this._weatherIconWmo(days.weather_code[i]),
            maxC: Math.round(days.temperature_2m_max[i]),
            minC: Math.round(days.temperature_2m_min[i]),
            rainPct: days.precipitation_probability_max[i] ?? 0
          };
        });
        this.weather = {
          loaded: true,
          tempC: Math.round(cur.temperature_2m),
          desc: this._wmoDesc(cur.weather_code),
          humidity: cur.relative_humidity_2m,
          wind: Math.round(cur.wind_speed_10m),
          icon: this._weatherIconWmo(cur.weather_code),
          forecast
        };
      } catch { /* 오프라인 시 무시 */ }
    },

    _weatherIconWmo(code) {
      const c = +code;
      if (c === 0) return '☀️';
      if (c <= 2) return '🌤️';
      if (c === 3) return '☁️';
      if ([45, 48].includes(c)) return '🌫️';
      if ([51, 53, 55, 56, 57].includes(c)) return '🌦️';
      if ([61, 63, 65, 66, 67].includes(c)) return '🌧️';
      if ([71, 73, 75, 77].includes(c)) return '❄️';
      if ([80, 81, 82].includes(c)) return '🌧️';
      if ([85, 86].includes(c)) return '🌨️';
      if ([95, 96, 99].includes(c)) return '⛈️';
      return '🌡️';
    },
    _wmoDesc(code) {
      const c = +code;
      if (c === 0) return '맑음';
      if (c === 1) return '대체로 맑음';
      if (c === 2) return '구름 조금';
      if (c === 3) return '흐림';
      if ([45, 48].includes(c)) return '안개';
      if ([51, 53].includes(c)) return '이슬비';
      if (c === 55) return '강한 이슬비';
      if ([61, 63].includes(c)) return '비';
      if (c === 65) return '강한 비';
      if ([71, 73, 75].includes(c)) return '눈';
      if ([80, 81, 82].includes(c)) return '소나기';
      if ([95, 96, 99].includes(c)) return '번개';
      return '날씨 정보';
    },

    // ---- 오늘의 추천 일정 (날씨 기반 Butler) ----
    async fetchDailyRec(force = false) {
      const today = new Date().toISOString().slice(0, 10);
      const tripStart = '2026-06-15';
      const tripEnd = '2026-06-22';
      if (today < tripStart || today > tripEnd) return;  // 여행 기간 외에는 실행 안 함

      const cacheKey = `dailyRec_${today}`;
      if (!force) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          this.dailyRec = { loading: false, text: cached, cachedDate: today };
          return;
        }
      }

      const dayNum = Math.floor((new Date(today) - new Date(tripStart)) / 86400000) + 1;
      const dayData = this.days.find(d => d.day === dayNum);
      if (!dayData) return;

      // 현재 사용자 일정 (store.days[n].activities → 활동명)
      const userPlan = this.dayActivities(dayNum).map(a => a.nameKo || a.name);

      const weatherDesc = this.weather.loaded
        ? `${this.weather.tempC}°C, ${this.weather.desc}, 습도 ${this.weather.humidity}%`
        : '날씨 정보 없음';
      const todayForecast = this.weather.forecast && this.weather.forecast[0];
      const rainRisk = todayForecast ? `강수확률 ${todayForecast.rainPct}%` : '';

      this.dailyRec = { ...this.dailyRec, loading: true, text: null };

      const prompt = `런던 여행 ${dayNum}일째 오늘의 추천 일정을 만들어줘.
오늘 날씨: ${weatherDesc} ${rainRisk}
오늘 지역: ${dayData.baseZone ? 'Zone ' + dayData.baseZone : '런던'} (${dayData.concept || ''})
이미 계획된 일정: ${userPlan.length ? userPlan.join(', ') : '없음'}
가족 구성: 부부 + 자녀(만 12세)
날씨 고려: 비/흐림이면 실내 중심, 맑으면 야외 포함
다음 형식으로 짧게 답변해:
🌤️ 오늘 날씨 한 줄 코멘트
📍 추천 동선 (3~4곳, 실내/야외 구분)
💡 오늘의 꿀팁 한 가지`;

      try {
        const res = await fetch('/.netlify/functions/butler', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: prompt, context: { day: dayNum, zone: dayData.baseZone }, taskType: 'general', useWebSearch: false })
        });
        const data = await res.json();
        const text = data.answer || data.intro || '추천을 불러오지 못했습니다.';
        localStorage.setItem(cacheKey, text);
        this.dailyRec = { loading: false, text, cachedDate: today };
      } catch {
        this.dailyRec = { loading: false, text: null, cachedDate: null };
      }
    },

    // ---- F25 혼잡도 예측 (Butler 웹 검색) ----
    async fetchCrowdInfo(placeName) {
      this.crowd = { loading: true, result: null, place: placeName };
      const prompt = `런던 여행지 혼잡도 정보: "${placeName}"
다음 내용을 간단히 알려줘 (한국어, 총 4~6줄):
⏰ 평균 혼잡 시간대 (가장 붐비는 시각)
📅 주중 vs 주말 차이
💡 덜 붐비는 시간대 추천
🎟️ 입장 대기 시간 (평균)
최대한 실용적인 정보로. 정보가 없으면 일반적인 관광지 기준으로 대답.`;
      try {
        const res = await fetch('/.netlify/functions/butler', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: prompt,
            context: { place: placeName },
            taskType: 'general',
            useWebSearch: true
          })
        });
        const data = await res.json();
        this.crowd = { loading: false, result: data.answer || data.intro || '정보를 가져오지 못했습니다.', place: placeName };
      } catch {
        this.crowd = { loading: false, result: '네트워크 오류가 발생했습니다.', place: placeName };
      }
    },

    // ---- F32 남은 일정 자동 최적화 (Butler Sonnet) ----
    async fetchTripOptimize() {
      this.tripOptimize = { loading: true, result: null };
      const today     = new Date().toISOString().slice(0, 10);
      const tripStart = '2026-06-15';
      const tripEnd   = '2026-06-22';
      const todayDate = new Date(today);
      const endDate   = new Date(tripEnd);
      const daysLeft  = Math.max(0, Math.ceil((endDate - todayDate) / 86400000));
      const dayNum    = Math.floor((todayDate - new Date(tripStart)) / 86400000) + 1;
      // 지금까지 방문한 명소
      const visited = [];
      Object.entries(this.store.days || {}).forEach(([n, day]) => {
        if (Number(n) < dayNum) {
          (day.activities || []).forEach(id => {
            const act = this.activities.find(a => a.id === id);
            if (act) visited.push(act.nameKo || act.name);
          });
        }
      });
      // 오늘 이후 남은 일정에 계획된 명소
      const planned = [];
      Object.entries(this.store.days || {}).forEach(([n, day]) => {
        if (Number(n) >= dayNum) {
          (day.activities || []).forEach(id => {
            const act = this.activities.find(a => a.id === id);
            if (act) planned.push(`Day${n}: ${act.nameKo || act.name}`);
          });
        }
      });
      const weatherSummary = this.weather.loaded
        ? `현재 ${this.weather.tempC}°C, ${this.weather.desc}`
        : '날씨 정보 없음';
      const prompt = `런던 가족 여행 남은 일정 종합 조언 (한국어)
여행 현황:
- 오늘: ${today} (여행 ${dayNum}일차)
- 남은 일수: ${daysLeft}일 (${today} ~ ${tripEnd})
- 현재 날씨: ${weatherSummary}
- 가족: 아빠(에드워드), 엄마(유효정), 딸(12세)
이미 방문한 곳: ${visited.length ? visited.join(', ') : '없음'}
남은 일정에 계획된 곳: ${planned.length ? planned.join(', ') : '없음'}
다음을 조언해 줘:
1. 남은 ${daysLeft}일 동안 꼭 가야 할 놓치면 아쉬운 장소 (아직 안 간 곳 중)
2. 효율적인 동선 (지역별 묶기)
3. 날씨 대비 실내/야외 밸런스 조언
4. 딸(12세)이 특히 좋아할 추천 포인트
5줄 이내로 실용적으로.`;
      try {
        const res = await fetch('/.netlify/functions/butler', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: prompt,
            context: { dayNum, daysLeft },
            taskType: 'trip_advice',   // 일반 프롬프트로 answer(전문 조언) 받기 + Sonnet 품질
            useWebSearch: false
          })
        });
        const data = await res.json();
        this.tripOptimize = { loading: false, result: data.answer || data.intro || '조언을 불러오지 못했습니다.' };
      } catch {
        this.tripOptimize = { loading: false, result: '네트워크 오류가 발생했습니다.' };
      }
    },

    // ---- F39 위치 기반 주변 발견 ----
    _haversineKm(lat1, lng1, lat2, lng2) {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    },
    fetchNearby() {
      if (!navigator.geolocation) {
        this.nearby = { ...this.nearby, error: 'GPS를 지원하지 않는 기기입니다.', loading: false };
        return;
      }
      this.nearby = { ...this.nearby, loading: true, error: null, items: [] };
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const myLat = pos.coords.latitude;
          const myLng = pos.coords.longitude;
          const withDist = this.activities
            .filter(a => a.coordinates && a.coordinates.lat && a.coordinates.lng)
            .map(a => ({
              ...a,
              distKm: this._haversineKm(myLat, myLng, a.coordinates.lat, a.coordinates.lng)
            }))
            .filter(a => a.distKm <= 1.0)
            .sort((a, b) => a.distKm - b.distKm)
            .slice(0, 8);
          this.nearby = {
            loading: false,
            items: withDist,
            error: withDist.length === 0 ? '1km 내 등록된 장소가 없습니다. 여행 지역으로 이동하면 표시돼요!' : null,
            myLat, myLng
          };
        },
        (err) => {
          const msg = err.code === 1 ? 'GPS 권한을 허용해 주세요.' :
                      err.code === 2 ? '위치를 가져올 수 없습니다.' :
                      '위치 요청 시간이 초과됐습니다.';
          this.nearby = { ...this.nearby, loading: false, error: msg, items: [] };
        },
        { timeout: 10000, maximumAge: 30000 }
      );
    },

    // ──────────────────────────────────────────────
    // F40: 커스텀 장소 · 할 일 추가
    // ──────────────────────────────────────────────

    openCustomAdd(dayNum, type = 'place') {
      this.customAdd = {
        show: true, step: 'input',
        targetDay: dayNum, inputText: '',
        type, preview: null, errorMsg: ''
      };
    },
    closeCustomAdd() { this.customAdd.show = false; },

    // 모달 내 타입 탭 전환
    switchCustomType(type) {
      this.customAdd.type = type;
      this.customAdd.inputText = '';
      this.customAdd.preview = null;
      this.customAdd.step = 'input';
    },

    // [Type A] 장소 — Butler 웹 검색으로 카드 데이터 생성
    async submitCustomPlace() {
      const name = this.customAdd.inputText.trim();
      if (!name) return;
      this.customAdd.step = 'enriching';
      this.customAdd.errorMsg = '';

      const prompt = `런던 장소 정보를 JSON으로만 반환해줘. 다른 텍스트 없음.
장소명: "${name}"

반드시 아래 JSON 형식 그대로:
{
  "name": "영어 정식명칭",
  "nameKo": "한국어명 (없으면 장소명 그대로)",
  "emoji": "가장 어울리는 이모지 1개",
  "type": "restaurant 또는 attraction 또는 shop 또는 pub 중 하나",
  "address": "영문 정확한 주소",
  "coordinates": { "lat": 위도숫자, "lng": 경도숫자 },
  "nearestTube": "가장 가까운 런던 지하철역명",
  "hours": "운영시간 (모르면 null)",
  "price": "가격대 (£ 기준, 모르면 null)",
  "duration": "권장 체류·방문 시간 예: 1h, 30min",
  "curatedReason": "한국어로 2문장. 이 장소의 특징과 추천 이유.",
  "tags": ["관련 태그 2~4개"],
  "zone": "A 또는 B 또는 C 또는 D 또는 E 또는 F 중 하나"
}

Zone 기준:
A = Holborn / Covent Garden / Soho / 런던 중심부
B = Westminster / Victoria / South Bank / 빅벤 구역
C = Tower Bridge / Borough Market / London Bridge / East London
D = Notting Hill / Portobello / Kensington
E = Knightsbridge / Chelsea / Harrods 구역
F = 런던 외곽 (Oxford 등 당일치기)
확실하지 않으면 가장 가까운 구역으로 추정. 기본값 "A".

좌표는 실제 주소의 정확한 위도/경도. 확실하지 않으면 null.`;

      try {
        const res = await fetch('/.netlify/functions/butler', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: prompt,
            context: { place: name },
            taskType: 'general',
            useWebSearch: true
          })
        });
        const data = await res.json();

        // F40 fix: butler.js parseAiJson이 모델의 순수 JSON을 응답 body 루트로 흘려보내는
        // 경우(가장 흔함)와, answer/intro 문자열로 오는 경우(폴백) 둘 다 처리.
        let card = null;
        if (data && typeof data === 'object' && data.name && (data.address || data.coordinates)) {
          // (A) 응답 자체가 이미 카드 형태 — name + (address 또는 coordinates) 보유
          card = { ...data };
        } else {
          // (B) answer/intro 문자열에서 JSON 추출 (코드펜스/주변 텍스트 제거)
          const raw = (data.answer || data.intro || '').trim();
          if (raw) {
            const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const s = cleaned.indexOf('{'), e = cleaned.lastIndexOf('}');
            if (s >= 0 && e > s) card = JSON.parse(cleaned.slice(s, e + 1));
          }
        }
        if (!card || !card.name) throw new Error('카드 데이터 누락');

        // 고유 ID + 커스텀 플래그
        card.id = 'custom_' + Date.now().toString(36);
        card.isCustom = true;
        card.source = 'butler';

        this.customAdd.preview = card;
        this.customAdd.step = 'preview';
      } catch (e) {
        console.warn('[F40] 커스텀 장소 enrich 실패', e);
        this.customAdd.step = 'error';
        this.customAdd.errorMsg = '장소 정보를 가져오지 못했어요. 장소명을 더 구체적으로 입력해 주세요.';
      }
    },

    // [Type A] 장소 확정 저장 (F40 — Day 화면 진입 시 직접 저장 경로, F42 이후엔 분기 신규 함수 우선)
    confirmCustomPlace() {
      const card = this.customAdd.preview;
      const n = this.customAdd.targetDay;
      if (!card || !n) return;

      if (!this.store.customPlaces) this.store.customPlaces = {};
      this.store.customPlaces[card.id] = card;

      if (!this.store.days[n]) this.store.days[n] = { activities: [] };
      if (!this.store.days[n].customItems) this.store.days[n].customItems = [];
      if (!this.store.days[n].customItems.includes(card.id)) {
        this.store.days[n].customItems.push(card.id);
      }

      this._writeStore();
      this.customAdd.show = false;
    },

    // ──────────────────────────────────────────────
    // F42: 분기 — Zone 카드 저장 / 일정 바로 추가(AI 날짜 추천)
    // ──────────────────────────────────────────────

    // [F42] Zone 카드에만 저장 (특정 Day에 미배정 — 나중에 탐색에서 추가)
    confirmZoneSave() {
      const card = this.customAdd.preview;
      if (!card) return;
      if (!this.store.customPlaces) this.store.customPlaces = {};
      this.store.customPlaces[card.id] = card;
      this._writeStore();

      const zid = card.zone || 'A';
      const zObj = this.zones.find(z => z.id === zid);
      const zName = zObj ? zObj.nameKo : zid;
      this.showToast('📌 Zone ' + zid + ' · ' + zName + '에 저장됐어요');

      this.customAdd.show = false;
      // 해당 Zone 탐색 화면으로 이동
      this.zoneId = zid;
      this.dayNum = (this.cd && this.cd.tripDay) || this.dayNum || 1;
      this.view = 'zone';
    },

    // [F42] 일정 바로 추가 — Butler에게 8일 일정 + 새 장소로 동선상 최적 날 추천 요청
    async startDayAdd() {
      const card = this.customAdd.preview;
      if (!card) return;
      this.customAdd.step = 'recommending';
      this.customAdd.dayLoading = true;

      const daySummaries = this.days.map(d => {
        const acts = this.dayActivities(d.day).map(a => a.nameKo || a.name);
        return `Day ${d.day} (${d.date}, ${d.concept}): ${acts.length ? acts.join(', ') : '일정 없음'}`;
      }).join('\n');

      const prompt = `황씨 가족 런던 여행 일정에 새 장소를 추가하려 한다. 동선이 가장 효율적인 날을 추천해줘.

추가할 장소:
- 이름: ${card.nameKo || card.name}
- 주소: ${card.address || ''}
- 구역: Zone ${card.zone || '?'}
- 유형: ${card.type}

현재 8일 여행 일정:
${daySummaries}

가장 동선이 효율적인 날 하나를 추천하고 이유를 한 문장(한국어)으로 설명해줘.
JSON으로만 반환. 다른 텍스트 없음:
{"bestDay": 숫자, "reason": "추천 이유"}`;

      try {
        const res = await fetch('/.netlify/functions/butler', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: prompt, context: {}, taskType: 'general', useWebSearch: false })
        });
        const data = await res.json();
        // 두 형태(answer 문자열 vs 응답 루트가 객체) 모두 처리 (F40 fix 유사)
        let result = null;
        if (data && (typeof data.bestDay === 'number' || typeof data.bestDay === 'string')) {
          result = data;
        } else {
          const raw = (data.answer || data.intro || '')
            .replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const s = raw.indexOf('{'), e = raw.lastIndexOf('}');
          if (s >= 0 && e > s) result = JSON.parse(raw.slice(s, e + 1));
        }
        const best = Number(result && result.bestDay);
        if (!Number.isFinite(best) || best < 1 || best > this.days.length) throw new Error('invalid bestDay');
        this.customAdd.recommendedDay = best;
        this.customAdd.selectedDay    = best;
        this.customAdd.dayReason      = (result && result.reason) || '';
      } catch (e) {
        console.warn('[F42] 날짜 추천 실패 → 폴백', e);
        const fallback = this.customAdd.targetDay || (this.cd && this.cd.tripDay) || 1;
        this.customAdd.recommendedDay = fallback;
        this.customAdd.selectedDay    = fallback;
        this.customAdd.dayReason      = '날짜 추천에 실패했어요. 직접 선택해 주세요.';
      } finally {
        this.customAdd.dayLoading = false;
        this.customAdd.step = 'day-confirm';
      }
    },

    // [F42] 날짜 확정 후 일정에 추가
    confirmDayAdd() {
      const card = this.customAdd.preview;
      const n = this.customAdd.selectedDay;
      if (!card || !n) return;
      if (!this.store.customPlaces) this.store.customPlaces = {};
      this.store.customPlaces[card.id] = card;
      if (!this.store.days[n]) this.store.days[n] = { activities: [] };
      if (!this.store.days[n].customItems) this.store.days[n].customItems = [];
      if (!this.store.days[n].customItems.includes(card.id)) {
        this.store.days[n].customItems.push(card.id);
      }
      this._writeStore();
      this.showToast('📅 Day ' + n + ' 일정에 추가됐어요');
      this.customAdd.show = false;
    },

    // [F42] 토스트 알림 (3초 자동 사라짐)
    showToast(msg) {
      this.toast = { show: true, msg };
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => { this.toast.show = false; }, 3000);
    },

    // [Type A] 커스텀 장소 Day에서 제거 (customPlaces dict에는 잔류)
    removeCustomPlace(n, id) {
      if (!this.store.days[n] || !this.store.days[n].customItems) return;
      this.store.days[n].customItems = this.store.days[n].customItems.filter(i => i !== id);
      this._writeStore();
    },

    // [Type B] 할 일 저장
    submitTodo() {
      const text = this.customAdd.inputText.trim();
      const n = this.customAdd.targetDay;
      if (!text || !n) return;

      if (!this.store.days[n]) this.store.days[n] = { activities: [] };
      if (!this.store.days[n].todos) this.store.days[n].todos = [];
      this.store.days[n].todos.push({
        id: 'todo_' + Date.now().toString(36),
        text,
        done: false,
        createdAt: Date.now()
      });

      this._writeStore();
      this.customAdd.inputText = '';
      this.customAdd.show = false;
    },

    // [Type B] 할 일 체크 토글
    toggleTodo(n, id) {
      const todos = this.store.days[n] && this.store.days[n].todos;
      if (!todos) return;
      const t = todos.find(x => x.id === id);
      if (t) { t.done = !t.done; this._writeStore(); }
    },

    // [Type B] 할 일 삭제
    deleteTodo(n, id) {
      if (!this.store.days[n] || !this.store.days[n].todos) return;
      this.store.days[n].todos = this.store.days[n].todos.filter(t => t.id !== id);
      this._writeStore();
    },

    // ──────────────────────────────────────────────
    // F41: 커스텀 체크리스트 항목
    // ──────────────────────────────────────────────
    addCustomCheckItem() {
      const label = this.checkInput.label.trim();
      if (!label) return;
      if (!this.store.customChecklistItems) this.store.customChecklistItems = [];
      this.store.customChecklistItems.push({
        id: 'ck_' + Date.now().toString(36),
        label,
        note: this.checkInput.note.trim()
      });
      this.checkInput = { label: '', note: '' };
      this._writeStore();
    },

    deleteCustomCheckItem(id) {
      this.store.customChecklistItems = (this.store.customChecklistItems || []).filter(i => i.id !== id);
      // 체크 상태도 함께 삭제
      delete this.store.checklist[id];
      this._writeStore();
    },

    customCheckItems() {
      return this.store.customChecklistItems || [];
    },

    // 해당 Day의 할 일 목록
    dayTodos(n) {
      return (this.store.days[n] && this.store.days[n].todos) || [];
    },

    // Butler 채팅 메시지 → 일정 추가 모달 진입
    openAddFromButler(dayNum) {
      // dayNum이 없으면 오늘 또는 첫 번째 일차 폴백
      const fallback = (this.cd && this.cd.tripDay) || 1;
      this.openCustomAdd(dayNum || fallback, 'place');
      this.butlerSheet = false; // 시트 닫고 모달로 진입
    },

    async fetchCurrency() {
      try {
        const res = await fetch('https://api.frankfurter.dev/v1/latest?base=GBP&symbols=KRW', { cache: 'no-cache' });
        const d = await res.json();
        this.currency = {
          loaded: true,
          rate: Math.round(d.rates.KRW),
          date: d.date
        };
      } catch {
        this.currency = { loaded: true, rate: 0, date: '', failed: true };
      }
    },

    // ---- TfL 튜브 상태 ----
    async fetchTfl() {
      // 여행에 주로 쓰는 7개 노선
      const lineIds = 'central,jubilee,northern,victoria,piccadilly,district,elizabeth';
      try {
        const res = await fetch(
          `https://api.tfl.gov.uk/Line/${lineIds}/Status`,
          { cache: 'no-cache' }
        );
        const data = await res.json();
        const nameKo = {
          central: '센트럴', jubilee: '주빌리', northern: '노던',
          victoria: '빅토리아', piccadilly: '피카딜리',
          district: '디스트릭트', elizabeth: '엘리자베스'
        };
        const lineColor = {
          central: '#E32017', jubilee: '#A0A5A9', northern: '#000000',
          victoria: '#0098D4', piccadilly: '#003688',
          district: '#00782A', elizabeth: '#6950A1'
        };
        const statusKo = {
          'Good Service': '정상 운행',
          'Minor Delays': '소규모 지연',
          'Severe Delays': '심각한 지연',
          'Part Suspended': '부분 운행 중단',
          'Suspended': '운행 중단',
          'Part Closure': '부분 폐쇄',
          'Planned Closure': '예정된 폐쇄',
          'Service Closed': '운행 종료',
          'Reduced Service': '축소 운행',
          'Bus Service': '버스 대체 운행',
          'Special Service': '특별 운행',
          'No Issues': '정상 운행',
          'Not Running': '운행 없음',
          'Issues Reported': '문제 발생',
          'Exit Only': '출구 전용',
          'Not Real Time': '실시간 정보 없음',
          'Information': '안내',
          'Unknown': '상태 불명'
        };
        this.tfl.lines = data.map(line => {
          const status = line.lineStatuses[0] || {};
          const severity = status.statusSeverity ?? 10;
          const rawDesc = status.statusSeverityDescription || '';
          return {
            id: line.id,
            name: nameKo[line.id] || line.name,
            color: lineColor[line.id] || '#888',
            severity,
            desc: statusKo[rawDesc] || rawDesc || '정보 없음',
            reason: status.reason || '',
            ok: severity === 10
          };
        }).sort((a, b) => a.severity - b.severity); // 문제 노선 먼저
        this.tfl.loaded = true;
      } catch { /* 오프라인 시 무시 */ }
    },

    tflStatusEmoji(severity) {
      if (severity === 10) return '✅';
      if (severity >= 8) return '⚠️';
      return '🚨';
    },

    // ---- Day 헬퍼 ----
    dayObj(n) { return this.days.find(d => d.day === n) || {}; },
    isToday(n) { return this.cd.tripDay === n; },

    confirmedForDay(n) {
      const items = [];
      (this.confirmed.flights || []).filter(f => f.day === n).forEach(f =>
        items.push({ time: '✈️', title: f.flight + ' ' + f.type, sub: f.from + ' → ' + f.to }));
      (this.confirmed.bookings || []).filter(b => b.day === n).forEach(b =>
        items.push({ time: b.time, title: b.title, sub: b.location + ' · ' + (b.note || '') }));
      return items;
    },

    // ---- 활동 (선택/저장) ----
    dayActivities(n) {
      const ids = (this.store.days[n] && this.store.days[n].activities) || [];
      const curated = ids.map(id => this.activities.find(a => a.id === id)).filter(Boolean);
      // F40: 커스텀 장소도 일정에 포함
      const customIds = (this.store.days[n] && this.store.days[n].customItems) || [];
      const custom = customIds
        .map(id => (this.store.customPlaces || {})[id])
        .filter(Boolean);
      return [...curated, ...custom];
    },
    isAdded(n, id) {
      return !!((this.store.days[n] && this.store.days[n].activities) || []).includes(id);
    },
    toggleActivity(n, id) {
      if (!this.store.days[n]) this.store.days[n] = { activities: [] };
      const arr = this.store.days[n].activities;
      const i = arr.indexOf(id);
      if (i >= 0) arr.splice(i, 1); else arr.push(id);
      this._writeStore();
    },

    // Zone별 활동 (타입 필터 적용)
    // F42: 큐레이션 + 커스텀 장소(저장된 customPlaces)를 같은 Zone 기준으로 합쳐 노출
    zoneActivities() {
      const curated = this.activities.filter(a =>
        a.zone === this.zoneId && (this.typeFilter === 'all' || a.type === this.typeFilter)
      );
      const custom = Object.values(this.store.customPlaces || {}).filter(a =>
        a.zone === this.zoneId && (this.typeFilter === 'all' || a.type === this.typeFilter)
      );
      return [...curated, ...custom];
    },
    // F42: 커스텀 장소용 Day 추가/제거 (큐레이션의 toggleActivity와 별도 — customItems 배열)
    isCustomAdded(n, id) {
      return !!((this.store.days[n] && this.store.days[n].customItems) || []).includes(id);
    },
    toggleCustomActivity(n, id) {
      if (!this.store.days[n]) this.store.days[n] = { activities: [] };
      if (!this.store.days[n].customItems) this.store.days[n].customItems = [];
      const arr = this.store.days[n].customItems;
      const i = arr.indexOf(id);
      if (i >= 0) arr.splice(i, 1); else arr.push(id);
      this._writeStore();
    },
    zoneObj(id) { return this.zones.find(z => z.id === id) || {}; },
    typeLabel(t) {
      return { attraction: '명소', restaurant: '식당', shop: '매장', pub: '펍' }[t] || t;
    },
    zoneColor(zid) { return (this.zones.find(z => z.id === zid) || {}).color || '#FFA07A'; },
    cardImageBg(zid) {
      const c = this.zoneColor(zid);
      return 'background: linear-gradient(135deg, ' + c + '33, ' + c + '14);';
    },
    heroBg(zid) {
      const c = this.zoneColor(zid);
      return 'background: linear-gradient(135deg, ' + c + ', ' + c + '99);';
    },

    // 카드 조회 (큐레이션 → F40 커스텀 fallback)
    card() {
      return this.activities.find(a => a.id === this.cardId)
          || (this.store.customPlaces || {})[this.cardId]
          || {};
    },

    // ---- 액션 ----
    openMap(a) {
      if (!a.coordinates) return;
      const { lat, lng } = a.coordinates;
      window.open('https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng, '_blank');
    },
    // 웹에서 사진·정보 보기 (장소명 검색 → 홈페이지/사진 확인)
    openInfo(a) {
      const q = encodeURIComponent(((a.name || a.nameKo) + ' London').trim());
      window.open('https://www.google.com/search?q=' + q, '_blank');
    },
    openEtiquette(a) {
      // 카테고리 자동 매핑: type → etiquette.json 카테고리
      const catMap = { pub: 'pub', restaurant: 'michelin', attraction: 'museum', shop: 'museum' };
      // 태그 기반 우선 카테고리 감지
      const tags = (a.tags || []).join(' ').toLowerCase();
      let cat = catMap[a.type] || 'museum';
      if (tags.includes('마켓') || tags.includes('market')) cat = 'market';
      else if (a.type === 'pub') cat = 'pub';
      else if (tags.includes('왕실') || tags.includes('근위병') || tags.includes('궁')) cat = 'royal';
      else if (tags.includes('뮤지컬') || tags.includes('극장') || tags.includes('theater')) cat = 'theater';
      else if (tags.includes('디베이트') || tags.includes('대학') || tags.includes('debate')) cat = 'debate';

      const catData = this.etiquette[cat];
      const items = catData ? catData.items : (a.etiquette || []);
      const title = catData ? catData.title : ('🎩 ' + (a.nameKo || a.name) + ' 매너 가이드');
      this.sheet = { title, items };
    },
    closeSheet() { this.sheet = null; },

    // ---- 체크리스트 ----
    isChecked(id) { return !!this.store.checklist[id]; },
    toggleCheck(id) {
      this.store.checklist[id] = !this.store.checklist[id];
      this._writeStore();
    },
    checkProgress() {
      // F41: '여행 중 매일' 카테고리는 반복 루틴이라 전체 진행률에서 제외 + 커스텀 항목 포함
      const excluded = ['여행 중 매일'];
      const allBuiltIn = this.checklist
        .filter(c => !excluded.includes(c.category))
        .flatMap(c => c.items.map(i => i.id));
      const allCustom = (this.store.customChecklistItems || []).map(i => i.id);
      const all = [...allBuiltIn, ...allCustom];
      if (!all.length) return 0;
      const done = all.filter(id => this.store.checklist[id]).length;
      return Math.round(done / all.length * 100);
    },

    // 카테고리별 진행률 (막대 게이지용)
    catStats(cat) {
      const total = (cat.items || []).length;
      const done = (cat.items || []).filter(it => this.isChecked(it.id)).length;
      return { done, total, pct: total ? Math.round(done / total * 100) : 0 };
    },

    // ---- F34 진행률 대시보드 통계 ----
    // 여행일기 작성 통계 (며칠 작성했는지)
    diaryStats() {
      const total = this.days.length;
      const written = this.days.filter(d => {
        const entry = this.store.diary && this.store.diary[d.day];
        return entry && entry.text && entry.text.trim().length > 0;
      }).length;
      return { written, total };
    },
    // 방문(계획에 추가된) 명소 통계
    visitStats() {
      const visited = new Set();
      Object.values(this.store.days || {}).forEach(day => {
        (day.activities || []).forEach(id => visited.add(id));
      });
      return { visited: visited.size, total: this.activities.length };
    },
    // 예산 사용률 (기존 expenseBudget/expenseTotal 재사용)
    budgetStats() {
      const budget = this.expenseBudget();
      const spent = this.expenseTotal();
      const pct = budget > 0 ? Math.min(100, Math.round(spent / budget * 100)) : 0;
      return { budget, spent, pct };
    },
    // 현재 여행일차 진행률 (D+N, 0~8)
    tripDayProgress() {
      const start = new Date('2026-06-15T00:00:00');
      const end   = new Date('2026-06-22T00:00:00');
      const now   = new Date();
      if (now < start) return { current: 0, total: 8, pct: 0 };
      if (now > end)   return { current: 8, total: 8, pct: 100 };
      const elapsed = Math.floor((now - start) / 86400000) + 1;
      return { current: Math.min(elapsed, 8), total: 8, pct: Math.min(100, Math.round(elapsed / 8 * 100)) };
    },

    // ---- 다크모드 ----
    toggleDark() {
      this.darkMode = !this.darkMode;
      this.store.settings.darkMode = this.darkMode;
      this._writeStore();
      this.applyTheme();
    },
    applyTheme() {
      document.documentElement.setAttribute('data-theme', this.darkMode ? 'dark' : 'light');
    },

    // 전화 걸기
    call(num) { window.location.href = 'tel:' + num.replace(/\s/g, ''); },

    // ---- Travel Butler ----
    closeButler() {
      this.butlerSheet = false;
    },

    async butlerSend(text) {
      if (!text || !text.trim() || this.butlerLoading) return;
      const query = text.trim();
      this.butlerInput = '';
      this.butlerLoading = true;

      // 사용자 메시지 추가
      this.butlerMessages.push({ role: 'user', text: query });

      // 로딩 메시지 추가
      const loadingIdx = this.butlerMessages.length;
      this.butlerMessages.push({ role: 'butler', loading: true });
      this.$nextTick(() => this.scrollButler());

      // 컨텍스트 구성
      const today = this.cd.tripDay ? this.days.find(d => d.day === this.cd.tripDay) : null;
      const context = {
        currentDay: this.cd.tripDay || null,
        dayInfo: today || null,
        selectedDayNum: this.dayNum,
        tripState: this.cd.state,
        currentActivities: this.dayActivities(this.dayNum).map(a => a.nameKo || a.name),
        confirmedToday: this.confirmedForDay(this.dayNum)
      };

      // Web Search 필요 여부 판단 (실시간 정보 키워드)
      const webKeywords = ['지금', '현재', '오늘', '날씨', '운영', '혼잡', '줄', '최신', '실시간', '몇시'];
      const needsWeb = webKeywords.some(k => query.includes(k));

      try {
        const res = await fetch('/.netlify/functions/butler', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, context, useWebSearch: needsWeb })
        });

        const data = await res.json();

        // 로딩 메시지 교체
        this.butlerMessages.splice(loadingIdx, 1, {
          role: 'butler',
          loading: false,
          intro: data.intro || '',
          answer: data.answer || '',
          cards: data.cards || [],
          error: data.error || null
        });
      } catch (e) {
        this.butlerMessages.splice(loadingIdx, 1, {
          role: 'butler',
          loading: false,
          error: '연결 오류가 발생했어요. 인터넷 상태를 확인해 주세요.'
        });
      } finally {
        this.butlerLoading = false;
        this.$nextTick(() => this.scrollButler());
      }
    },

    scrollButler() {
      const el = this.$refs.butlerScroll;
      if (el) el.scrollTop = el.scrollHeight;
    },

    openMapCoord(action) {
      if (!action) return;
      window.open('https://www.google.com/maps/dir/?api=1&destination=' + action.lat + ',' + action.lng, '_blank');
    },

    // Butler 카드를 activities에 임시 추가 후 Day에 담기
    addButlerCard(card) {
      if (!card.id) return;
      // 아직 없으면 activities 배열에 추가 (임시 카드)
      if (!this.activities.find(a => a.id === card.id)) {
        this.activities.push({
          id: card.id,
          type: 'attraction',
          zone: 'A',
          name: card.name || card.nameKo,
          nameKo: card.nameKo || card.name,
          emoji: card.emoji || '📍',
          rating: card.rating,
          price: card.price,
          duration: card.duration,
          address: card.address,
          nearestTube: card.nearestTube,
          tags: card.tags || [],
          kidsFriendly: card.kidsFriendly || 3,
          curatedReason: card.reason || '',
          etiquette: [],
          curated: false
        });
      }
      this.toggleActivity(this.dayNum, card.id);
    },

    // ---- 예산 분석 ----
    expenseItems() {
      return (this.store.expenses && this.store.expenses.items) || [];
    },
    expenseTotal() {
      return this.expenseItems().reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    },
    expenseByCategory() {
      const cats = { food: 0, transport: 0, attraction: 0, shopping: 0, hotel: 0, other: 0 };
      this.expenseItems().forEach(i => {
        if (cats[i.category] !== undefined) cats[i.category] += parseFloat(i.amount) || 0;
        else cats.other += parseFloat(i.amount) || 0;
      });
      return cats;
    },
    expenseBudget() {
      return parseFloat((this.store.expenses && this.store.expenses.budget) || 0);
    },
    setBudget(val) {
      if (!this.store.expenses) this.store.expenses = { budget: 0, items: [] };
      this.store.expenses.budget = parseFloat(val) || 0;
      this._writeStore();
      this.budget.editBudget = false;
    },
    addExpense() {
      const amt = parseFloat(this.budget.newItem.amount);
      if (!amt || amt <= 0) return;
      if (!this.store.expenses) this.store.expenses = { budget: 0, items: [] };
      const item = {
        id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 7),
        date: new Date().toISOString().slice(0, 10),
        category: this.budget.newItem.category,
        amount: amt,
        memo: this.budget.newItem.memo.trim(),
        createdAt: new Date().toISOString()
      };
      this.store.expenses.items.push(item);
      this._writeStore();
      this.budget.newItem = { category: 'food', amount: '', memo: '' };
      this.budget.showForm = false;
    },
    deleteExpense(id) {
      if (!this.store.expenses) return;
      this.store.expenses.items = this.store.expenses.items.filter(i => i.id !== id);
      this._writeStore();
    },
    expenseCategoryLabel(cat) {
      const map = { food: '🍽️ 식비', transport: '🚇 교통', attraction: '🏛️ 관광', shopping: '🛍️ 쇼핑', hotel: '🏨 호텔', other: '📦 기타' };
      return map[cat] || cat;
    },
    expenseCategoryColor(cat) {
      const map = { food: '#f59e0b', transport: '#3b82f6', attraction: '#10b981', shopping: '#ec4899', hotel: '#8b5cf6', other: '#6b7280' };
      return map[cat] || '#6b7280';
    },
    async analyzeExpense() {
      if (this.budget.aiLoading) return;
      this.budget.aiLoading = true;
      this.budget.aiAdvice = null;
      try {
        const total = this.expenseTotal();
        const budgetAmt = this.expenseBudget();
        const byCat = this.expenseByCategory();
        const remaining = budgetAmt - total;
        const today = new Date();
        const endDate = new Date('2026-06-22');
        const daysLeft = Math.max(0, Math.ceil((endDate - today) / 86400000));

        const query = `황씨 가족 런던 여행 예산 분석을 해주세요.
총 예산: £${budgetAmt}
현재까지 지출: £${total.toFixed(2)}
잔액: £${remaining.toFixed(2)}
남은 여행일: ${daysLeft}일
카테고리별 지출:
${Object.entries(byCat).map(([k, v]) => `- ${this.expenseCategoryLabel(k)}: £${v.toFixed(2)}`).join('\n')}

남은 일정을 위한 예산 운용 조언을 실용적으로 해주세요.`;

        const res = await fetch('/.netlify/functions/butler', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, context: {}, taskType: 'general', useWebSearch: false })
        });
        const data = await res.json();
        this.budget.aiAdvice = data.answer || data.intro || '분석 결과를 불러올 수 없어요.';
      } catch (e) {
        this.budget.aiAdvice = '연결 오류가 발생했어요. 잠시 후 다시 시도해주세요.';
      } finally {
        this.budget.aiLoading = false;
      }
    },

    // ---- 경로 최적화 ----
    async optimizeRoute(n) {
      if (this.routeLoading) return;
      this.routeLoading = true;
      this.routeResult = null;
      this.routeDayNum = n;

      const dayObj = this.days.find(d => d.day === n) || {};
      const selected = this.dayActivities(n);
      const confirmed = this.confirmedForDay(n);

      const query = `Day ${n} (${dayObj.date || ''}, ${dayObj.concept || ''}) 동선을 최적화해줘.

호텔: ${dayObj.hotelName || ''}
확정 예약: ${confirmed.length ? confirmed.map(c => c.time + ' ' + c.title + ' @ ' + c.sub).join(' / ') : '없음'}
선택한 활동 (${selected.length}개):
${selected.map(a => `- ${a.nameKo || a.name} [${a.type}] Zone:${a.zone} 소요:${a.duration || '미정'} 주소:${a.address || ''}`).join('\n')}

위 장소들을 효율적인 순서로 배치해서 타임라인을 만들어줘.`;

      try {
        const res = await fetch('/.netlify/functions/butler', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, context: {}, taskType: 'route_optimization', useWebSearch: false })
        });
        const data = await res.json();
        if (data.type === 'route' && data.timeline) {
          this.routeResult = data;
        } else {
          this.routeResult = { error: data.error || '응답 형식 오류' };
        }
      } catch (e) {
        this.routeResult = { error: '연결 오류가 발생했어요.' };
      } finally {
        this.routeLoading = false;
      }
    },

    clearRoute() {
      this.routeResult = null;
      this.routeDayNum = null;
    },

    moveActivity(fromDay, toDay, id) {
      if (fromDay === toDay) return;
      // fromDay에서 제거
      if (this.store.days[fromDay] && this.store.days[fromDay].activities) {
        const arr = this.store.days[fromDay].activities;
        const i = arr.indexOf(id);
        if (i >= 0) arr.splice(i, 1);
      }
      // toDay에 추가 (중복 방지)
      if (!this.store.days[toDay]) this.store.days[toDay] = { activities: [] };
      if (!this.store.days[toDay].activities.includes(id)) {
        this.store.days[toDay].activities.push(id);
      }
      this._writeStore();
      if (this.routeDayNum === fromDay) this.routeResult = null;
    },

    // 오늘의 추천 — 아직 내 일정에 없는 defaultActivityIds 항목만 반환
    daySuggestions(n) {
      const day = this.days.find(d => d.day === n);
      if (!day || !day.defaultActivityIds) return [];
      const added = (this.store.days[n] && this.store.days[n].activities) || [];
      return day.defaultActivityIds
        .filter(id => !added.includes(id))
        .map(id => this.activities.find(a => a.id === id))
        .filter(Boolean);
    },
    // 추천 1개 추가
    addSuggestion(n, id) {
      if (!this.store.days[n]) this.store.days[n] = { activities: [] };
      if (!this.store.days[n].activities.includes(id)) {
        this.store.days[n].activities.push(id);
        this._writeStore();
      }
    },
    // 추천 전체 추가
    addAllSuggestions(n) {
      const suggestions = this.daySuggestions(n);
      if (!suggestions.length) return;
      if (!this.store.days[n]) this.store.days[n] = { activities: [] };
      suggestions.forEach(a => {
        if (!this.store.days[n].activities.includes(a.id)) {
          this.store.days[n].activities.push(a.id);
        }
      });
      this._writeStore();
    },

    async loadCardInsight(a) {
      if (this.cardInsightLoading) return;
      this.cardInsightLoading = true;
      const query = `"${a.nameKo || a.name}" 명소에 대해 황씨 가족 관점에서 알려줘.
혼잡도, 베스트 방문 시간, 가족(자녀 12세)에게 유용한 현장 팁, 놓치지 말아야 할 포인트, 주변 맛집/카페를 간결하게 2~3문장으로.
이미 알고 있는 기본 정보(주소, 요금 등)는 반복하지 말고, 현장 경험 중심으로.`;
      try {
        const res = await fetch('/.netlify/functions/butler', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            context: { attraction: { name: a.name, nameKo: a.nameKo, zone: a.zone, type: a.type, address: a.address } },
            taskType: 'general',
            useWebSearch: false
          })
        });
        const data = await res.json();
        this.cardInsight = data.answer || data.intro || '정보를 불러올 수 없어요.';
      } catch (e) {
        this.cardInsight = '연결 오류가 발생했어요. 다시 시도해주세요.';
      } finally {
        this.cardInsightLoading = false;
      }
    },

    // ---- 여행일기 ----
    diaryEntry(n) {
      return (this.store.diary && this.store.diary[n]) || null;
    },

    async generateDiary(n) {
      if (this.diary.loading) return;
      this.diary.loading = true;
      // 주의: diary.currentDay는 탭 선택용이므로 여기서 변경하지 않음 (생성 후 탭 유지)

      const dayObj = this.days.find(d => d.day === n) || {};
      const activities = this.dayActivities(n);
      const confirmed = this.confirmedForDay(n);
      const existing = this.diaryEntry(n);

      const allItems = [
        ...confirmed.map(c => c.title + (c.sub ? ' (' + c.sub + ')' : '')),
        ...activities.map(a => a.nameKo || a.name)
      ];

      if (!allItems.length) {
        alert('이 날의 활동이 없어요. 먼저 활동을 추가해주세요.');
        this.diary.loading = false;
        return;
      }

      const query = `황씨 가족의 런던 여행 Day ${n} (${dayObj.date || ''}, ${dayObj.concept || ''}) 일기를 써줘.

오늘의 활동:
${allItems.map((a, i) => `${i + 1}. ${a}`).join('\n')}

조건:
- 아빠(에드워드), 엄마(유효정), 자녀(12세) 3인 가족 시점
- 생생하고 따뜻한 여행일기 스타일, 감성적으로
- 각 장소의 인상, 가족 간 에피소드 상상, 음식·날씨·분위기 묘사
- 200~300자 한국어, 이모지 2~3개 자연스럽게 포함
- 제목 포함 (예: "Day ${n}. ${dayObj.concept || '런던에서의 하루'}")
${existing ? '\n※ 기존 일기가 있음. 다른 시각·에피소드로 새로 작성.' : ''}`;

      try {
        const res = await fetch('/.netlify/functions/butler', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            context: { day: n, concept: dayObj.concept, date: dayObj.date },
            taskType: 'general',
            useWebSearch: false
          })
        });
        const data = await res.json();
        const text = data.answer || data.intro || '';
        if (text) {
          if (!this.store.diary) this.store.diary = {};
          this.store.diary[n] = { text, createdAt: new Date().toISOString() };
          this._writeStore();
        }
      } catch (e) {
        alert('일기 생성 오류. 다시 시도해주세요.');
      } finally {
        this.diary.loading = false;
      }
    },

    deleteDiary(n) {
      if (!confirm(`Day ${n} 일기를 삭제할까요?`)) return;
      if (this.store.diary) {
        delete this.store.diary[n];
        this._writeStore();
      }
    },

    // ---- 가족 협상 도우미 ----
    async negotiateFamily() {
      const { dad, mom, kid } = this.negotiate.inputs;
      if (!dad.trim() && !mom.trim() && !kid.trim()) {
        alert('세 가족의 희망을 입력해주세요.');
        return;
      }
      if (this.negotiate.loading) return;
      this.negotiate.loading = true;
      this.negotiate.result = null;
      const query = `황씨 가족 런던 여행 중 세 사람의 의견이 다릅니다. 모두가 최대한 만족할 수 있는 오늘 일정 절충안 2~3가지를 제안해주세요.
아빠(에드워드, 분석적·효율 중시): ${dad.trim() || '특별한 의견 없음'}
엄마(유효정, 편안함·분위기 중시): ${mom.trim() || '특별한 의견 없음'}
자녀(12세, 활동적·체험 중시): ${kid.trim() || '특별한 의견 없음'}
조건:
- 각 절충안은 세 사람 모두의 니즈를 어떻게 반영했는지 한 줄로 설명
- 런던 실제 장소·식당 이름 포함
- 친근하고 실용적인 어조, 200자 이내
- 이모지 활용`;
      try {
        const res = await fetch('/.netlify/functions/butler', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            context: { family: { dad: '에드워드', mom: '유효정', kid: '12세' } },
            taskType: 'general',
            useWebSearch: false
          })
        });
        const data = await res.json();
        this.negotiate.result = data.answer || data.intro || '결과를 불러올 수 없어요.';
      } catch (e) {
        this.negotiate.result = '연결 오류. 다시 시도해주세요.';
      } finally {
        this.negotiate.loading = false;
      }
    },

    routeTypeIcon(type) {
      return { attraction: '🏛️', restaurant: '🍽️', shop: '🛍️', pub: '🍺', rest: '☕', hotel: '🏨' }[type] || '📍';
    },

    // ── 인터랙티브 튜브맵 (역 목록 피커 + TfL Journey) ──
    filteredTubeStations() {
      const q = (this.tubeFilter || '').trim().toLowerCase();
      const list = this.tubeStations || [];
      if (!q) return list;
      return list.filter(s => s.name.toLowerCase().includes(q));
    },
    isTubeSelected(st) {
      return (this.tubeMap.from && this.tubeMap.from.id === st.id) ||
             (this.tubeMap.to && this.tubeMap.to.id === st.id);
    },
    tubeStationRole(st) {
      if (this.tubeMap.from && this.tubeMap.from.id === st.id) return 'from';
      if (this.tubeMap.to && this.tubeMap.to.id === st.id) return 'to';
      return null;
    },
    selectTubeStation(station) {
      if (this.tubeMap.selecting === 'from') {
        this.tubeMap.from = station;
        this.tubeMap.selecting = 'to';
        this.tubeMap.to = null;
        this.tubeMap.journey = null;
        this.tubeMap.journeyError = null;
      } else {
        if (station.id === (this.tubeMap.from && this.tubeMap.from.id)) return; // 같은 역 방지
        this.tubeMap.to = station;
        this.tubeMap.selecting = 'from';
        this.fetchTubeJourney();
      }
    },
    resetTubeSelection() {
      this.tubeMap = { from: null, to: null, selecting: 'from', journey: null, journeyLoading: false, journeyError: null };
      this.tubeFilter = '';
    },
    async fetchTubeJourney() {
      if (!this.tubeMap.from || !this.tubeMap.to) return;
      this.tubeMap.journeyLoading = true;
      this.tubeMap.journey = null;
      this.tubeMap.journeyError = null;
      const clean = (n) => n.replace(/\s*\/.*$/, '').replace(/'/g, '');  // "Bank / .." → "Bank", 아포스트로피 제거
      const from = encodeURIComponent(clean(this.tubeMap.from.name) + ' Underground Station');
      const to = encodeURIComponent(clean(this.tubeMap.to.name) + ' Underground Station');
      try {
        const res = await fetch(
          `https://api.tfl.gov.uk/Journey/JourneyResults/${from}/to/${to}?mode=tube,elizabeth-line,dlr`,
          { cache: 'no-cache' }
        );
        if (!res.ok) throw new Error('TfL ' + res.status);
        const data = await res.json();
        const journey = data.journeys && data.journeys[0];
        if (!journey) throw new Error('경로 없음');
        const legs = (journey.legs || [])
          .filter(l => !(l.mode && l.mode.id === 'walking' && (l.duration || 0) <= 2))
          .map(l => ({
            from: (l.departurePoint && l.departurePoint.commonName || '').replace(/ Underground Station| DLR Station| Rail Station/g, ''),
            to: (l.arrivalPoint && l.arrivalPoint.commonName || '').replace(/ Underground Station| DLR Station| Rail Station/g, ''),
            line: (l.routeOptions && l.routeOptions[0] && l.routeOptions[0].name) || (l.instruction && l.instruction.summary) || '',
            duration: l.duration || 0,
            stops: (l.stopPoints && l.stopPoints.length) || 0,
            isWalking: !!(l.mode && l.mode.id === 'walking')
          }));
        this.tubeMap.journey = { duration: journey.duration, legs };
      } catch (e) {
        this.tubeMap.journeyError = 'TfL 경로를 못 불러왔어요. 아래 구글맵으로 확인하세요.';
      } finally {
        this.tubeMap.journeyLoading = false;
      }
    },
    tubeGoogleMapsUrl() {
      if (!this.tubeMap.from || !this.tubeMap.to) return '#';
      const o = encodeURIComponent(this.tubeMap.from.name + ' station london');
      const d = encodeURIComponent(this.tubeMap.to.name + ' station london');
      return `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${d}&travelmode=transit`;
    },
    tubeLineColor(line) {
      const key = (line || '').toLowerCase().replace(/ line/g, '').replace(/[-\s]/g, '_');
      return (window.TUBE_LINE_COLORS && window.TUBE_LINE_COLORS[key]) || '#666';
    },
    tubeLineKo(line) {
      return (window.TUBE_LINE_KO && window.TUBE_LINE_KO[line]) || line;
    },

    // ═══════════════ 골든벨 게임 ═══════════════
    enterGame() {
      this.view = 'game';
      if (!this.game.playerRole || !this.sync.enabled) return;
      if (gameRef) gameRef.off();   // 중복 구독 방지
      gameRef = firebase.database().ref('hwang-london-2026/game');
      gameRef.child('players').child(this.game.playerRole).set(true);
      gameRef.on('value', (snap) => {
        const d = snap.val();
        if (!d) return;
        const prevStatus = this.game.status, prevQ = this.game.currentQ;
        this.game.status = d.status || 'idle';
        this.game.dayNum = d.dayNum || null;
        this.game.questions = d.questions || [];
        this.game.currentQ = d.currentQ || 0;
        this.game.questionStartAt = d.questionStartAt || null;
        this.game.answers = d.answers || {};
        this.game.scores = d.scores || { dad: 0, mom: 0, kid: 0 };
        this.game.players = d.players || {};
        if (d.currentQ !== prevQ) this.game.selectedAnswer = null;
        if (d.status === 'question' && (prevStatus !== 'question' || d.currentQ !== prevQ)) this._startGameTimer();
        if (d.status !== 'question') this._stopGameTimer();
      });
    },
    leaveGame() { this._leaveGameCleanup(); this.go('/'); },
    _leaveGameCleanup() {
      this._stopGameTimer();
      if (gameRef) {
        if (this.game.playerRole) { try { gameRef.child('players').child(this.game.playerRole).set(false); } catch (e) {} }
        gameRef.off();
        gameRef = null;
      }
    },

    // ── 아빠(Host) 전용 ──
    async startGenerating() {
      if (this.game.playerRole !== 'dad' || !this.sync.enabled) return;
      const ref = firebase.database().ref('hwang-london-2026/game');
      const today = new Date().toISOString().slice(0, 10);
      const dayNum = Math.floor((new Date(today) - new Date('2026-06-15')) / 86400000) + 1;
      const safeDayNum = (dayNum >= 1 && dayNum <= 8) ? dayNum : 1;
      const activities = this.dayActivities(safeDayNum).map(a => a.nameKo || a.name).join(', ') || '런던 시내 관광';
      await ref.update({ status: 'generating', dayNum: safeDayNum, questions: [] });
      const prompt = `오늘(Day ${safeDayNum}) 황씨 가족이 런던에서 방문한 장소: ${activities}
가족: 아빠(에드워드), 엄마(유효정), 딸(만 12세, 영어 능숙)
골든벨 퀴즈 10문제를 아래 JSON 형식으로만 반환하세요. 다른 텍스트·설명·마크다운 절대 금지.
- 4지선다 7문제 + OX 3문제
- 오늘 방문한 곳 위주, 난이도 쉬움~보통, 영어/역사/실용 균형, 재미있는 선지 포함
{"questions":[{"id":1,"type":"4choice","q":"질문","opts":["A. ..","B. ..","C. ..","D. .."],"ans":"A","fact":"해설 한 줄"},{"id":8,"type":"ox","q":"질문","opts":["O. 맞다","X. 틀리다"],"ans":"O","fact":"해설"}]}`;
      try {
        const res = await fetch('/.netlify/functions/butler', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: prompt, taskType: 'general', useWebSearch: false })  // Haiku
        });
        const data = await res.json();
        const questions = this._extractQuestions(data);
        if (!Array.isArray(questions) || questions.length < 5) throw new Error('문제 파싱 실패');
        await ref.update({ questions: questions.slice(0, 10), status: 'waiting' });
      } catch (e) {
        console.error('문제 생성 실패 → 폴백 사용', e);
        await ref.update({ questions: this._fallbackQuestions(safeDayNum), status: 'waiting' });
      }
    },
    // Butler 응답의 다양한 형태에서 questions 배열을 견고하게 추출
    _extractQuestions(data) {
      if (data && Array.isArray(data.questions)) return data.questions;
      const text = (data && typeof data.answer === 'string' && data.answer) ||
                   (data && typeof data.intro === 'string' && data.intro) ||
                   (data && data.content && data.content[0] && data.content[0].text) || '';
      if (!text) return null;
      const cleaned = String(text).replace(/```json/gi, '').replace(/```/g, '').trim();
      const s = cleaned.indexOf('{'), e = cleaned.lastIndexOf('}');
      if (s < 0 || e <= s) return null;
      try { const p = JSON.parse(cleaned.slice(s, e + 1)); return Array.isArray(p.questions) ? p.questions : null; }
      catch (_) { return null; }
    },
    _fallbackQuestions(dayNum) {
      return [
        { id:1, type:'ox',      q:'Tower Bridge는 도개교(양쪽이 들어올려지는 다리)다', opts:['O. 맞다','X. 틀리다'], ans:'O', fact:'1894년 개통, 지금도 큰 배가 지나갈 때 열린다' },
        { id:2, type:'4choice', q:'런던의 빨간 2층 버스 이름은?', opts:['A. 루트마스터','B. 레드버스','C. 더블데커','D. 빨강이'], ans:'A', fact:'Routemaster, 1956년부터 운행한 런던의 상징' },
        { id:3, type:'ox',      q:'Borough Market은 입장이 무료다', opts:['O. 맞다','X. 틀리다'], ans:'O', fact:'입장 무료, 음식 구매는 유료' },
        { id:4, type:'4choice', q:'템스강에서 가장 높은 전망 건물은?', opts:['A. 더 샤드','B. 런던아이','C. 빅벤','D. 타워브리지'], ans:'A', fact:'The Shard, 310m로 서유럽 최고층 중 하나' },
        { id:5, type:'ox',      q:'런던 버스는 현금으로 탈 수 없다', opts:['O. 맞다','X. 틀리다'], ans:'O', fact:'2014년부터 카드/Oyster만 가능, 현금 불가' }
      ];
    },
    async startGame() {
      if (this.game.playerRole !== 'dad' || !this.sync.enabled) return;
      await firebase.database().ref('hwang-london-2026/game').update({
        status: 'question', currentQ: 0, answers: {},
        scores: { dad: 0, mom: 0, kid: 0 }, questionStartAt: Date.now()
      });
    },
    async revealAnswer() {
      if (this.game.playerRole !== 'dad' || !this.sync.enabled) return;
      this._stopGameTimer();
      const q = this.game.questions[this.game.currentQ];
      const ans = (this.game.answers && this.game.answers[String(this.game.currentQ)]) || {};
      const newScores = { ...this.game.scores };
      ['dad', 'mom', 'kid'].forEach(role => {
        if (q && ans[role] === q.ans) newScores[role] = (newScores[role] || 0) + 10;  // 전원 동일 10점
      });
      await firebase.database().ref('hwang-london-2026/game').update({ status: 'reveal', scores: newScores });
    },
    async nextQuestion() {
      if (this.game.playerRole !== 'dad' || !this.sync.enabled) return;
      const ref = firebase.database().ref('hwang-london-2026/game');
      const nextQ = this.game.currentQ + 1;
      if (nextQ >= this.game.questions.length) {
        await ref.update({ status: 'finished' });
      } else {
        await ref.update({ status: 'question', currentQ: nextQ, questionStartAt: Date.now() });
      }
    },
    async resetGame() {
      if (this.game.playerRole !== 'dad' || !this.sync.enabled) return;
      await firebase.database().ref('hwang-london-2026/game').update({
        status: 'idle', dayNum: null, questions: [], currentQ: 0,
        questionStartAt: null, answers: {}, scores: { dad: 0, mom: 0, kid: 0 }
      });
      this.game.selectedAnswer = null;
    },

    // ── 플레이어(모두) ──
    async submitAnswer(option) {
      if (this.game.status !== 'question' || this.game.selectedAnswer) return;
      this.game.selectedAnswer = option;
      if (!this.sync.enabled) return;
      try {
        await firebase.database().ref('hwang-london-2026/game/answers/' + this.game.currentQ + '/' + this.game.playerRole).set(option);
      } catch (e) {}
    },

    // ── 타이머 ──
    _startGameTimer() {
      this._stopGameTimer();
      const tick = () => {
        const elapsed = Math.floor((Date.now() - (this.game.questionStartAt || Date.now())) / 1000);
        this.game.timeLeft = Math.max(0, 10 - elapsed);
        if (this.game.timeLeft <= 0 && this.game.playerRole === 'dad' && this.game.status === 'question') {
          this._stopGameTimer();
          this.revealAnswer();
        }
      };
      tick();
      gameTimer = setInterval(tick, 500);
    },
    _stopGameTimer() {
      if (gameTimer) { clearInterval(gameTimer); gameTimer = null; }
      this.game.timeLeft = 10;
    },

    // ── 헬퍼 ──
    currentQuestion() { return this.game.questions[this.game.currentQ] || null; },
    playerLabel(role) { return { dad: '👨 아빠', mom: '👩 엄마', kid: '👧 딸' }[role] || role; },
    gameRanking() {
      return ['dad', 'mom', 'kid']
        .map(r => ({ role: r, score: (this.game.scores && this.game.scores[r]) || 0 }))
        .sort((a, b) => b.score - a.score);
    },
    gameAnswerOf(role) {
      const a = this.game.answers && this.game.answers[String(this.game.currentQ)];
      return a ? a[role] : null;
    }
  };
}
