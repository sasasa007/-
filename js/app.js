// 우리 가족 런던 트립 — 메인 Alpine 앱
function tripApp() {
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
    weather: { loaded: false, tempC: '', desc: '', humidity: '', wind: '', icon: '' },
    currency: { loaded: false, rate: 0, date: '' },

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

    // 경로 최적화
    routeResult: null,   // { timeline, totalTime, tubeLines, advice, intro }
    routeLoading: false,
    routeDayNum: null,

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
      this.fetchCurrency();
      this.fetchTfl();
      setInterval(() => this.fetchWeather(), 30 * 60 * 1000);  // 30분마다
      setInterval(() => this.fetchCurrency(), 60 * 60 * 1000); // 1시간마다
      setInterval(() => this.fetchTfl(), 5 * 60 * 1000);       // 5분마다

      // 라우팅
      window.addEventListener('hashchange', () => this.syncFromHash());
      this.syncFromHash();

      this.loaded = true;
    },

    // ---- 라우팅 ----
    syncFromHash() {
      const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
      const [v, a, b] = parts;
      switch (v) {
        case 'day': this.view = 'day'; this.dayNum = +a || 1; break;
        case 'zone': this.view = 'zone'; this.zoneId = a; if (b) this.dayNum = +b; this.typeFilter = 'all'; break;
        case 'card': this.view = 'card'; this.cardId = a; if (b) this.dayNum = +b; break;
        case 'checklist': this.view = 'checklist'; break;
        case 'tools': this.view = 'tools'; break;
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
    async fetchWeather() {
      try {
        const res = await fetch('https://wttr.in/London?format=j1', { cache: 'no-cache' });
        const d = await res.json();
        const c = d.current_condition[0];
        const descs = { 'Sunny': '맑음', 'Clear': '맑음', 'Partly cloudy': '구름 조금', 'Cloudy': '흐림',
          'Overcast': '흐림', 'Mist': '안개', 'Light rain': '가벼운 비', 'Moderate rain': '비',
          'Heavy rain': '폭우', 'Light snow': '눈', 'Thundery outbreaks possible': '번개',
          'Patchy rain possible': '비 올 수 있음', 'Blowing snow': '눈보라' };
        const raw = c.weatherDesc[0].value;
        this.weather = {
          loaded: true,
          tempC: c.temp_C,
          desc: descs[raw] || raw,
          humidity: c.humidity,
          wind: c.windspeedKmph,
          icon: this._weatherIcon(c.weatherCode)
        };
      } catch { /* 오프라인 시 무시 */ }
    },

    _weatherIcon(code) {
      const n = +code;
      if (n === 113) return '☀️';
      if (n === 116) return '⛅';
      if ([119, 122].includes(n)) return '☁️';
      if ([143, 248, 260].includes(n)) return '🌫️';
      if ([176, 293, 296, 299, 302, 305, 308].includes(n)) return '🌧️';
      if ([200, 386, 389, 392, 395].includes(n)) return '⛈️';
      if ([179, 182, 185, 281, 284, 311, 314, 317, 320, 323, 326, 329, 332, 335, 338, 350, 362, 365, 368, 371, 374, 377].includes(n)) return '❄️';
      return '🌡️';
    },

    async fetchCurrency() {
      try {
        const res = await fetch('/.netlify/functions/butler?type=currency', { cache: 'no-cache' });
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
      return ids.map(id => this.activities.find(a => a.id === id)).filter(Boolean);
    },
    isAdded(n, id) {
      return !!((this.store.days[n] && this.store.days[n].activities) || []).includes(id);
    },
    toggleActivity(n, id) {
      if (!this.store.days[n]) this.store.days[n] = { activities: [] };
      const arr = this.store.days[n].activities;
      const i = arr.indexOf(id);
      if (i >= 0) arr.splice(i, 1); else arr.push(id);
      TripStorage.write(this.store);
    },

    // Zone별 활동 (타입 필터 적용)
    zoneActivities() {
      return this.activities.filter(a =>
        a.zone === this.zoneId && (this.typeFilter === 'all' || a.type === this.typeFilter)
      );
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

    // 카드 조회
    card() { return this.activities.find(a => a.id === this.cardId) || {}; },

    // ---- 액션 ----
    openMap(a) {
      if (!a.coordinates) return;
      const { lat, lng } = a.coordinates;
      window.open('https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng, '_blank');
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
      TripStorage.write(this.store);
    },
    checkProgress() {
      const all = this.checklist.flatMap(c => c.items.map(i => i.id));
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

    // ---- 다크모드 ----
    toggleDark() {
      this.darkMode = !this.darkMode;
      this.store.settings.darkMode = this.darkMode;
      TripStorage.write(this.store);
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
      TripStorage.write(this.store);
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
      TripStorage.write(this.store);
      this.budget.newItem = { category: 'food', amount: '', memo: '' };
      this.budget.showForm = false;
    },
    deleteExpense(id) {
      if (!this.store.expenses) return;
      this.store.expenses.items = this.store.expenses.items.filter(i => i.id !== id);
      TripStorage.write(this.store);
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

    routeTypeIcon(type) {
      return { attraction: '🏛️', restaurant: '🍽️', shop: '🛍️', pub: '🍺', rest: '☕', hotel: '🏨' }[type] || '📍';
    }
  };
}
