const CACHE_VERSION = 'v1.1.12';
const CACHE_NAME = `london-trip-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/styles.css',
  '/js/app.js',
  '/js/storage.js',
  '/js/tube-stations.js',
  '/js/pwa.js',
  '/data/days.json',
  '/data/zones.json',
  '/data/confirmed.json',
  '/data/attractions.json',
  '/data/restaurants.json',
  '/data/shops.json',
  '/data/pubs.json',
  '/data/etiquette.json',
  '/data/checklist.json',
  '/data/emergency.json',
  '/icons/icon.svg',
  '/icons/icon-maskable.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // 일부 파일이 없어도 설치가 실패하지 않도록 개별 추가
      Promise.allSettled(STATIC_ASSETS.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 외부 API / Netlify Functions: Network-first (오프라인 시 안내 응답)
  if (url.pathname.startsWith('/.netlify/functions/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: '오프라인 상태입니다.' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // CDN(타 출처) 리소스는 가로채지 않음
  if (url.origin !== self.location.origin) return;

  // 앱 셸(HTML 문서 + 같은 출처 JS/CSS): Network-first
  // → HTML과 app.js/styles.css 버전이 항상 일치(스큐 방지). 오프라인 시 캐시 폴백.
  if (
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    request.destination === 'script' ||
    request.destination === 'style'
  ) {
    event.respondWith(
      fetch(request).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return res;
      }).catch(() => caches.match(request).then((r) => r || (request.destination === 'document' ? caches.match('/index.html') : undefined)))
    );
    return;
  }

  // 기타 정적 리소스(data/icons): Stale-while-revalidate
  // → 캐시를 즉시 주되 백그라운드에서 최신본으로 갱신 (오프라인 + 점진 업데이트)
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
