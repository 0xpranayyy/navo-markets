/** PWA / installed app detection helpers. */
export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** Lock viewport height and mark standalone mode for native iOS shell layout. */
export function initPwaLayout(): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  const syncStandalone = () => {
    root.classList.toggle('navo-standalone', isStandalonePwa());
  };

  const syncViewportHeight = () => {
    const h = window.visualViewport?.height ?? window.innerHeight;
    root.style.setProperty('--navo-vh', `${Math.round(h)}px`);
  };

  syncStandalone();
  syncViewportHeight();

  window.addEventListener('resize', syncViewportHeight);
  window.addEventListener('orientationchange', syncViewportHeight);
  window.visualViewport?.addEventListener('resize', syncViewportHeight);
  window.visualViewport?.addEventListener('scroll', syncViewportHeight);
  window.matchMedia('(display-mode: standalone)').addEventListener('change', syncStandalone);
}

export function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

export function preferredOAuthProvider(): 'apple' | 'google' {
  if (isIos()) return 'apple';
  return 'google';
}
