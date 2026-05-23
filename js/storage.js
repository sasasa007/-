// LocalStorage 래퍼 — 가족 여행 데이터 저장/복원
window.TripStorage = (function () {
  const KEY = 'london-trip-v1';

  const defaults = () => ({
    trip: { startDate: '2026-06-15', endDate: '2026-06-22' },
    days: {},          // { "3": { activities: ["borough_market", ...] } }
    checklist: {},     // { "eta": true }
    settings: { darkMode: false },
    expenses: {
      budget: 0,       // 총 여행 예산 (£)
      items: []        // { id, date, category, amount, memo, createdAt }
    }
  });

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaults();
      return Object.assign(defaults(), JSON.parse(raw));
    } catch (e) {
      console.warn('저장 데이터 읽기 실패, 초기화', e);
      return defaults();
    }
  }

  function write(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('저장 실패', e);
    }
  }

  return { read, write };
})();
