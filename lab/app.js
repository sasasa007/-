// Trip Butler (프로토타입) — 전세계 AI 여행 일정 생성 엔진
// 런던 가족앱의 "엔진"을 도시 무관으로 일반화한 실험. /lab 경로에서만 동작.
function butlerTrip() {
  return {
    // ---- 상태 ----
    step: 'setup',            // setup | loading | result
    error: null,
    loadingMsg: '',
    form: {
      city: '',
      startDate: '',
      days: 3,
      party: 'family',
      interests: []
    },
    partyOptions: [
      { id: 'family',  label: '👨‍👩‍👧 가족' },
      { id: 'couple',  label: '💑 커플' },
      { id: 'friends', label: '👥 친구' },
      { id: 'solo',    label: '🧍 혼자' }
    ],
    interestOptions: ['역사·문화', '미식', '쇼핑', '자연·공원', '아이 체험', '야경·나이트', '예술·박물관', '휴양'],
    exampleCities: ['도쿄', '파리', '뉴욕', '방콕', '로마', '바르셀로나'],

    plan: null,               // AI 결과 { destination, days, tips }
    weather:  { loaded: false, failed: false, tempC: '', desc: '', icon: '', humidity: '', wind: '' },
    currency: { loaded: false, failed: false, code: '', symbol: '', rate: 0, date: '' },

    // ---- 초기화 ----
    init() {
      this.form.startDate = new Date().toISOString().slice(0, 10);
    },

    // ---- 폼 헬퍼 ----
    setCity(c) { this.form.city = c; },
    toggleInterest(i) {
      const idx = this.form.interests.indexOf(i);
      if (idx >= 0) this.form.interests.splice(idx, 1);
      else this.form.interests.push(i);
    },
    isInterest(i) { return this.form.interests.includes(i); },

    // ---- 일정 생성 (Butler itinerary) ----
    async generate() {
      if (!this.form.city.trim()) { this.error = '여행할 도시를 입력해 주세요.'; return; }
      this.error = null;
      this.step = 'loading';
      this.loadingMsg = `🎩 버틀러가 ${this.form.city.trim()} 일정을 설계하는 중…`;
      this.plan = null;

      const partyLabel = (this.partyOptions.find(p => p.id === this.form.party) || {}).label || '가족';
      const prompt = `도시: ${this.form.city.trim()}
여행 시작일: ${this.form.startDate || '미정'}
여행 일수: ${this.form.days}일
동행: ${partyLabel}
관심사: ${this.form.interests.length ? this.form.interests.join(', ') : '일반 관광'}

위 조건으로 ${this.form.days}일짜리 여행 일정을 설계해줘.`;

      try {
        const res = await fetch('/.netlify/functions/butler', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: prompt, context: {}, taskType: 'itinerary', useWebSearch: false })
        });
        const data = await res.json();
        if (!data || !data.destination || !Array.isArray(data.days) || !data.days.length) {
          throw new Error((data && data.error) || '일정 생성 실패');
        }
        this.plan = data;
        this.step = 'result';
        window.scrollTo(0, 0);
        // 목적지 좌표·통화로 날씨/환율 자동 적응
        this.fetchWeather(data.destination.lat, data.destination.lng);
        this.fetchCurrency(data.destination.currency);
      } catch (e) {
        console.error('itinerary 생성 실패', e);
        this.error = '일정을 생성하지 못했어요. 도시명을 확인하고 다시 시도해 주세요.';
        this.step = 'setup';
      }
    },

    // ---- 적응형 날씨 (Open-Meteo, 키 불필요) ----
    async fetchWeather(lat, lng) {
      this.weather = { loaded: false, failed: false, tempC: '', desc: '', icon: '', humidity: '', wind: '' };
      if (typeof lat !== 'number' || typeof lng !== 'number') { this.weather.failed = true; return; }
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
                    `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
        const r = await fetch(url);
        const d = await r.json();
        const c = d.current || {};
        const wm = this._wmo(c.weather_code);
        this.weather = {
          loaded: true, failed: false,
          tempC: Math.round(c.temperature_2m),
          desc: wm.desc, icon: wm.icon,
          humidity: c.relative_humidity_2m,
          wind: Math.round(c.wind_speed_10m)
        };
      } catch {
        this.weather = { loaded: false, failed: true, tempC: '', desc: '', icon: '', humidity: '', wind: '' };
      }
    },

    // ---- 적응형 환율 (frankfurter.dev → KRW) ----
    async fetchCurrency(code) {
      this.currency = { loaded: false, failed: false, code: code || '', symbol: '', rate: 0, date: '' };
      const symbol = (this.plan && this.plan.destination && this.plan.destination.currencySymbol) || code || '';
      if (!code || code === 'KRW') {
        this.currency = { loaded: true, failed: false, code: 'KRW', symbol: '₩', rate: 1, date: '' };
        return;
      }
      try {
        const r = await fetch(`https://api.frankfurter.dev/v1/latest?base=${encodeURIComponent(code)}&symbols=KRW`);
        const d = await r.json();
        const rate = d.rates && d.rates.KRW;
        if (!rate) throw new Error('지원되지 않는 통화');
        this.currency = { loaded: true, failed: false, code, symbol, rate, date: d.date || '' };
      } catch {
        this.currency = { loaded: false, failed: true, code, symbol, rate: 0, date: '' };
      }
    },

    // WMO 날씨코드 → 이모지/설명
    _wmo(code) {
      const m = {
        0: ['☀️', '맑음'], 1: ['🌤️', '대체로 맑음'], 2: ['⛅', '구름 조금'], 3: ['☁️', '흐림'],
        45: ['🌫️', '안개'], 48: ['🌫️', '서리 안개'],
        51: ['🌦️', '약한 이슬비'], 53: ['🌦️', '이슬비'], 55: ['🌧️', '강한 이슬비'],
        61: ['🌧️', '약한 비'], 63: ['🌧️', '비'], 65: ['🌧️', '강한 비'],
        71: ['🌨️', '약한 눈'], 73: ['🌨️', '눈'], 75: ['❄️', '강한 눈'], 77: ['🌨️', '싸락눈'],
        80: ['🌦️', '소나기'], 81: ['🌧️', '소나기'], 82: ['⛈️', '강한 소나기'],
        85: ['🌨️', '소낙눈'], 86: ['❄️', '강한 소낙눈'],
        95: ['⛈️', '뇌우'], 96: ['⛈️', '우박 뇌우'], 99: ['⛈️', '강한 뇌우']
      };
      const e = m[code] || ['🌡️', '—'];
      return { icon: e[0], desc: e[1] };
    },

    // ---- 렌더 헬퍼 ----
    typeEmoji(t) {
      return { attraction: '🏛️', restaurant: '🍽️', cafe: '☕', shop: '🛍️', park: '🌳', nightlife: '🌃', experience: '🎟️' }[t] || '📍';
    },
    typeLabel(t) {
      return { attraction: '명소', restaurant: '식당', cafe: '카페', shop: '쇼핑', park: '공원', nightlife: '나이트', experience: '체험' }[t] || '장소';
    },
    mapLink(a) {
      const city = (this.plan && this.plan.destination) ? this.plan.destination.city : '';
      const q = encodeURIComponent((a.nameKo || a.name || '') + ' ' + city);
      return `https://www.google.com/maps/search/?api=1&query=${q}`;
    },
    dateForDay(n) {
      if (!this.form.startDate) return '';
      const d = new Date(this.form.startDate + 'T00:00:00');
      d.setDate(d.getDate() + (n - 1));
      const wd = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
      return `${d.getMonth() + 1}/${d.getDate()} (${wd})`;
    },
    krwOf(amount) {
      if (!this.currency.loaded || !this.currency.rate) return '';
      return '₩' + Math.round(amount * this.currency.rate).toLocaleString();
    },

    reset() {
      this.step = 'setup';
      this.plan = null;
      this.error = null;
    }
  };
}
