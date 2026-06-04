// Travel Butler — 전세계 AI 여행 일정 생성 엔진 (다국어: 한·영·일·중)
// 런던 가족앱의 "엔진"을 도시·언어 무관으로 일반화. /lab 경로에서 동작.
window.APP_VERSION = '0.3.0-shell';   // T3 상업 셸 적용

function butlerTrip() {
  return {
    // ---- 상태 ----
    lang: 'ko',               // ko | en | ja | zh
    step: 'setup',            // setup | loading | result | settings
    prevStep: 'setup',        // 설정 닫으면 돌아갈 화면
    error: null,
    loadingMsg: '',
    form: { city: '', startDate: '', days: 3, party: 'family', interests: [] },

    // 사용자 설정 (T3)
    theme: 'system',          // light | dark | system
    unitTemp: 'c',            // c | f
    currencyOverride: null,   // null = 언어 자동, 그 외는 통화 코드(KRW/USD/JPY...)

    // 인트로 (첫 실행)
    showIntro: false,
    introIdx: 0,

    // 사이드 안내 (초기화 후 등)
    flashMsg: '',

    plan: null,
    weather:  { loaded: false, failed: false, tempC: '', desc: '', icon: '', humidity: '', wind: '' },
    currency: { loaded: false, failed: false, code: '', symbol: '', rate: 0, date: '' },

    _systemThemeMql: null,

    // ---- i18n 헬퍼 ----
    t(key, ...args) {
      const dict = (window.I18N && window.I18N[this.lang]) || {};
      const v = dict[key];
      return typeof v === 'function' ? v(...args) : (v != null ? v : key);
    },
    get L() { return (window.I18N && window.I18N[this.lang]) || {}; },
    get langMeta() { return (window.LANGS && window.LANGS[this.lang]) || { locale: 'en-US', currency: 'USD' }; },
    get currencyOptions() { return window.CURRENCY_OPTIONS || []; },

    // 언어별 옵션 (사전에서 파생)
    get partyOptions() {
      const p = this.L.parties || {};
      return [
        { id: 'family',  label: p.family },
        { id: 'couple',  label: p.couple },
        { id: 'friends', label: p.friends },
        { id: 'solo',    label: p.solo }
      ];
    },
    get interestOptions() { return this.L.interests || []; },
    get exampleCities() { return this.L.cities || []; },
    get langList() {
      return Object.keys(window.LANGS || {}).map(k => ({ id: k, label: window.LANGS[k].label }));
    },

    // ---- 초기화 ----
    init() {
      // 저장값 로드 (각각 try/catch — Safari private 등에서 throw 방지)
      let saved = {};
      try {
        saved = {
          lang:     localStorage.getItem('tb_lang'),
          theme:    localStorage.getItem('tb_theme'),
          unitTemp: localStorage.getItem('tb_unit_temp'),
          currency: localStorage.getItem('tb_currency'),
          seenIntro: localStorage.getItem('tb_seen_intro')
        };
      } catch (e) {}

      // 언어
      const supported = Object.keys(window.LANGS || { ko:1, en:1, ja:1, zh:1 });
      const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
      this.lang = supported.includes(saved.lang) ? saved.lang
                : supported.includes(nav) ? nav
                : (supported.includes('en') ? 'en' : supported[0]);
      this.applyLangAttrs();

      // 테마
      this.theme = ['light', 'dark', 'system'].includes(saved.theme) ? saved.theme : 'system';
      this.applyTheme();
      // system 모드 추종을 위해 prefers-color-scheme 변경 구독
      if (window.matchMedia) {
        this._systemThemeMql = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => { if (this.theme === 'system') this.applyTheme(); };
        if (this._systemThemeMql.addEventListener) this._systemThemeMql.addEventListener('change', handler);
        else if (this._systemThemeMql.addListener)  this._systemThemeMql.addListener(handler);
      }

      // 온도 단위
      this.unitTemp = saved.unitTemp === 'f' ? 'f' : 'c';

      // 통화 오버라이드
      if (saved.currency && (window.CURRENCY_OPTIONS || []).includes(saved.currency)) {
        this.currencyOverride = saved.currency;
      }

      // 인트로
      if (!saved.seenIntro) this.showIntro = true;

      // 초기 날짜
      this.form.startDate = new Date().toISOString().slice(0, 10);
    },

    // ---- 언어/테마 적용 ----
    setLang(l) {
      if (!window.LANGS[l]) return;
      this.lang = l;
      try { localStorage.setItem('tb_lang', l); } catch (e) {}
      this.applyLangAttrs();
      this.form.interests = [];
      if (this.plan && this.plan.destination) this.fetchCurrency(this.plan.destination.currency);
    },
    applyLangAttrs() {
      const root = document.documentElement;
      root.setAttribute('lang', this.lang);
      root.setAttribute('data-lang', this.lang);
    },
    setTheme(t) {
      if (!['light','dark','system'].includes(t)) return;
      this.theme = t;
      try { localStorage.setItem('tb_theme', t); } catch (e) {}
      this.applyTheme();
    },
    applyTheme() {
      const root = document.documentElement;
      let effective = this.theme;
      if (effective === 'system') {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        effective = prefersDark ? 'dark' : 'light';
      }
      root.setAttribute('data-theme', effective);
      // meta theme-color도 함께 갱신 (모바일 OS 컬러 매칭)
      const mt = document.querySelector('meta[name="theme-color"]');
      if (mt) mt.setAttribute('content', effective === 'dark' ? '#1C1916' : '#FAF6F0');
    },

    // ---- 설정/통화/온도 ----
    openSettings() {
      if (this.step !== 'settings') this.prevStep = this.step;
      this.step = 'settings';
      window.scrollTo(0, 0);
    },
    closeSettings() {
      this.step = this.prevStep || 'setup';
      window.scrollTo(0, 0);
    },
    setUnitTemp(u) {
      if (!['c','f'].includes(u)) return;
      this.unitTemp = u;
      try { localStorage.setItem('tb_unit_temp', u); } catch (e) {}
    },
    setCurrencyOverride(code) {
      // code === '' or null → 자동(언어 기본통화)
      this.currencyOverride = code || null;
      try {
        if (code) localStorage.setItem('tb_currency', code);
        else localStorage.removeItem('tb_currency');
      } catch (e) {}
      if (this.plan && this.plan.destination) this.fetchCurrency(this.plan.destination.currency);
    },
    tempDisplay() {
      if (!this.weather.loaded) return '';
      const c = this.weather.tempC;
      if (this.unitTemp === 'f') return Math.round(c * 9/5 + 32) + '°F';
      return c + '°C';
    },

    // ---- 인트로 ----
    nextIntro() {
      if (this.introIdx < 2) this.introIdx += 1;
      else this.finishIntro();
    },
    finishIntro() {
      this.showIntro = false;
      try { localStorage.setItem('tb_seen_intro', '1'); } catch (e) {}
    },

    // ---- 초기화 ----
    resetData() {
      const msg = this.t('set_reset_confirm');
      if (!window.confirm(msg)) return;
      try {
        ['tb_lang','tb_theme','tb_unit_temp','tb_currency','tb_seen_intro'].forEach(k => localStorage.removeItem(k));
      } catch (e) {}
      this.flashMsg = this.t('set_reset_done');
      // 부드럽게 새로고침 — 모든 상태가 재초기화되도록
      setTimeout(() => { location.reload(); }, 500);
    },

    // ---- 폼 헬퍼 ----
    setCity(c) { this.form.city = c; },
    toggleInterest(i) {
      const idx = this.form.interests.indexOf(i);
      if (idx >= 0) this.form.interests.splice(idx, 1);
      else this.form.interests.push(i);
    },
    isInterest(i) { return this.form.interests.includes(i); },

    // ---- 일정 생성 ----
    async generate() {
      if (!this.form.city.trim()) { this.error = this.t('err_city'); return; }
      this.error = null;
      this.step = 'loading';
      this.loadingMsg = this.t('loading', this.form.city.trim());
      this.plan = null;

      const partyLabel = (this.partyOptions.find(p => p.id === this.form.party) || {}).label || '';
      const outLang = (window.LANG_OUTPUT_NAME && window.LANG_OUTPUT_NAME[this.lang]) || 'English';
      const prompt = `출력 언어(OUTPUT LANGUAGE): ${outLang}
도시: ${this.form.city.trim()}
여행 시작일: ${this.form.startDate || '미정'}
여행 일수: ${this.form.days}
동행: ${partyLabel}
관심사: ${this.form.interests.length ? this.form.interests.join(', ') : '일반 관광'}

위 조건으로 ${this.form.days}일짜리 여행 일정을 설계해줘. 모든 사용자 표시 텍스트는 ${outLang}로 작성.`;

      try {
        const res = await fetch('/.netlify/functions/butler', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: prompt, context: {}, taskType: 'itinerary', useWebSearch: false, lang: this.lang })
        });
        let data;
        try { data = await res.json(); }
        catch { throw new Error('서버 응답 해석 실패 (HTTP ' + res.status + ')'); }

        if (!res.ok) throw new Error((data && data.error) || '서버 오류 (HTTP ' + res.status + ')');

        let plan = (data && data.destination && Array.isArray(data.days) && data.days.length) ? data : null;

        // 폴백: answer 문자열에 JSON이 실려온 경우 재추출
        if (!plan && data && typeof data.answer === 'string' && data.answer.length > 50) {
          try {
            const tt = data.answer.replace(/```json/gi, '').replace(/```/g, '').trim();
            const s = tt.indexOf('{'), e = tt.lastIndexOf('}');
            if (s >= 0 && e > s) {
              const cand = JSON.parse(tt.slice(s, e + 1));
              if (cand && cand.destination && Array.isArray(cand.days) && cand.days.length) plan = cand;
            }
          } catch (_) {}
        }

        if (!plan) throw new Error(this.t('err_format'));

        this.plan = plan;
        this.step = 'result';
        window.scrollTo(0, 0);
        this.fetchWeather(plan.destination.lat, plan.destination.lng);
        this.fetchCurrency(plan.destination.currency);
      } catch (e) {
        console.error('[Travel Butler] 일정 생성 실패', e);
        this.error = (e && e.message) || this.t('err_generic');
        this.step = 'setup';
      }
    },

    // ---- 적응형 날씨 (Open-Meteo) ----
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
          tempC: Math.round(c.temperature_2m), desc: wm.desc, icon: wm.icon,
          humidity: c.relative_humidity_2m, wind: Math.round(c.wind_speed_10m)
        };
      } catch {
        this.weather = { loaded: false, failed: true, tempC: '', desc: '', icon: '', humidity: '', wind: '' };
      }
    },

    // ---- 적응형 환율 (frankfurter.dev → 사용자 home 통화) ----
    // home 통화 = currencyOverride(설정값) ?? langMeta.currency(언어 기본값)
    async fetchCurrency(srcCode) {
      const home = this.currencyOverride || this.langMeta.currency || 'USD';
      this.currency = { loaded: false, failed: false, code: srcCode || '', symbol: '', rate: 0, date: '', home };
      const symbol = (this.plan && this.plan.destination && this.plan.destination.currencySymbol) || srcCode || '';
      if (!srcCode || srcCode === home) {
        this.currency = { loaded: true, failed: false, code: home, symbol: this.homeSymbol(home), rate: 1, date: '', home, same: true };
        return;
      }
      try {
        const r = await fetch(`https://api.frankfurter.dev/v1/latest?base=${encodeURIComponent(srcCode)}&symbols=${home}`);
        const d = await r.json();
        const rate = d.rates && d.rates[home];
        if (!rate) throw new Error('지원되지 않는 통화');
        this.currency = { loaded: true, failed: false, code: srcCode, symbol, rate, date: d.date || '', home, same: false };
      } catch {
        this.currency = { loaded: false, failed: true, code: srcCode, symbol, rate: 0, date: '', home };
      }
    },
    homeSymbol(code) { return ({ KRW:'₩', JPY:'¥', CNY:'¥', USD:'$', EUR:'€', GBP:'£', THB:'฿', AUD:'A$', CAD:'C$', SGD:'S$', HKD:'HK$', TWD:'NT$' })[code] || code; },
    rateText() {
      const c = this.currency;
      if (!c.loaded || c.same) return '';
      const homeSym = this.homeSymbol(c.home);
      const amount = c.rate >= 100 ? Math.round(c.rate).toLocaleString(this.langMeta.locale)
                                   : c.rate.toFixed(2);
      return `${c.symbol}1 = ${homeSym}${amount}`;
    },

    // WMO 날씨코드 → 이모지/설명 (언어별)
    _wmo(code) {
      const desc = {
        ko:{0:'맑음',1:'대체로 맑음',2:'구름 조금',3:'흐림',45:'안개',48:'서리 안개',51:'약한 이슬비',53:'이슬비',55:'강한 이슬비',61:'약한 비',63:'비',65:'강한 비',71:'약한 눈',73:'눈',75:'강한 눈',80:'소나기',81:'소나기',82:'강한 소나기',95:'뇌우',96:'우박 뇌우',99:'강한 뇌우'},
        en:{0:'Clear',1:'Mostly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',48:'Rime fog',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',71:'Light snow',73:'Snow',75:'Heavy snow',80:'Showers',81:'Showers',82:'Heavy showers',95:'Thunderstorm',96:'Hail storm',99:'Severe storm'},
        ja:{0:'快晴',1:'晴れ',2:'薄曇り',3:'曇り',45:'霧',48:'霧氷',51:'弱い霧雨',53:'霧雨',55:'強い霧雨',61:'弱い雨',63:'雨',65:'強い雨',71:'弱い雪',73:'雪',75:'強い雪',80:'にわか雨',81:'にわか雨',82:'激しいにわか雨',95:'雷雨',96:'雹を伴う雷雨',99:'激しい雷雨'},
        zh:{0:'晴',1:'大致晴朗',2:'局部多云',3:'阴',45:'雾',48:'雾凇',51:'小毛毛雨',53:'毛毛雨',55:'大毛毛雨',61:'小雨',63:'雨',65:'大雨',71:'小雪',73:'雪',75:'大雪',80:'阵雨',81:'阵雨',82:'强阵雨',95:'雷雨',96:'冰雹雷雨',99:'强雷暴'}
      };
      const icon = {0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌦️',55:'🌧️',61:'🌧️',63:'🌧️',65:'🌧️',71:'🌨️',73:'🌨️',75:'❄️',77:'🌨️',80:'🌦️',81:'🌧️',82:'⛈️',85:'🌨️',86:'❄️',95:'⛈️',96:'⛈️',99:'⛈️'};
      const dd = (desc[this.lang] || desc.en);
      return { icon: icon[code] || '🌡️', desc: dd[code] || '—' };
    },

    // ---- 렌더 헬퍼 ----
    typeEmoji(t) {
      return { attraction:'🏛️', restaurant:'🍽️', cafe:'☕', shop:'🛍️', park:'🌳', nightlife:'🌃', experience:'🎟️' }[t] || '📍';
    },
    typeLabel(t) {
      const ty = this.L.types || {};
      return ty[t] || t || '';
    },
    placeTitle(a) { return a.nameLocal || a.nameKo || a.name || ''; },
    placeSub(a)   { return a.name || a.nameOriginal || ''; },
    cityTitle()   { return this.plan ? (this.plan.destination.cityLocal || this.plan.destination.cityKo || this.plan.destination.city) : ''; },
    cityCountry() {
      if (!this.plan) return '';
      const d = this.plan.destination;
      return (d.city || '') + ' · ' + (d.countryLocal || d.countryKo || d.country || '');
    },
    mapLink(a) {
      const city = this.plan ? (this.plan.destination.city || '') : '';
      const q = encodeURIComponent((a.name || a.nameLocal || a.nameKo || '') + ' ' + city);
      return `https://www.google.com/maps/search/?api=1&query=${q}`;
    },
    dateForDay(n) {
      if (!this.form.startDate) return '';
      const d = new Date(this.form.startDate + 'T00:00:00');
      d.setDate(d.getDate() + (n - 1));
      try {
        return new Intl.DateTimeFormat(this.langMeta.locale, { month: 'short', day: 'numeric', weekday: 'short' }).format(d);
      } catch {
        return (d.getMonth() + 1) + '/' + d.getDate();
      }
    },

    // 피드백 mailto (스펙: feedback 이메일 — 사용자 회신)
    feedbackHref() {
      const subj = encodeURIComponent('[Travel Butler] Feedback');
      const body = encodeURIComponent('App version: ' + (window.APP_VERSION || '?') + '\nLang: ' + this.lang + '\n\n');
      return `mailto:edward.sjhwang@gmail.com?subject=${subj}&body=${body}`;
    },

    reset() {
      this.step = 'setup';
      this.plan = null;
      this.error = null;
      this.weather = { loaded: false, failed: false, tempC: '', desc: '', icon: '', humidity: '', wind: '' };
      this.currency = { loaded: false, failed: false, code: '', symbol: '', rate: 0, date: '' };
    }
  };
}
