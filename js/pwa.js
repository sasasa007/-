// PWA: 서비스 워커 등록 + 설치 프롬프트 처리
(function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').catch((err) => {
        console.warn('Service Worker 등록 실패:', err);
      });
    });
  }

  // "홈 화면에 추가" 프롬프트를 잡아두었다가 앱에서 직접 띄울 수 있게 보관
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.dispatchEvent(new CustomEvent('pwa-installable'));
  });

  window.promptInstall = async function () {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return outcome === 'accepted';
  };

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
  });
})();
