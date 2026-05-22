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
    call(num) { window.location.href = 'tel:' + num.replace(/\s/g, ''); }
  };
}
