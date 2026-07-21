/** PWA / installed app detection helpers. */
export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
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

/** Keep installed PWAs edge-to-edge; shrink only when the software keyboard opens. */
export function applyStandaloneViewport(): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const appRoot = document.getElementById('root');
  const standalone = isStandalonePwa();

  root.classList.toggle('navo-standalone', standalone);
  root.classList.toggle('navo-ios', isIos());

  if (!standalone) {
    root.classList.remove('navo-keyboard-open');
    root.style.removeProperty('--navo-app-h');
    appRoot?.style.removeProperty('height');
    appRoot?.style.removeProperty('bottom');
    return;
  }

  const inner = window.innerHeight;
  const visual = window.visualViewport?.height ?? inner;
  const keyboardOpen = visual > 0 && visual < inner * 0.82;

  root.classList.toggle('navo-keyboard-open', keyboardOpen);

  if (keyboardOpen) {
    const h = Math.round(visual);
    root.style.setProperty('--navo-app-h', `${h}px`);
    if (appRoot) {
      appRoot.style.height = `${h}px`;
      appRoot.style.bottom = 'auto';
    }
    return;
  }

  root.style.setProperty('--navo-app-h', `${Math.round(inner)}px`);
  if (appRoot) {
    appRoot.style.removeProperty('height');
    appRoot.style.removeProperty('bottom');
  }
}

/** Lock viewport and mark standalone mode for native iOS shell layout. */
export function initPwaLayout(): void {
  if (typeof document === 'undefined') return;

  applyStandaloneViewport();

  const onResize = () => applyStandaloneViewport();
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', () => window.setTimeout(onResize, 150));
  window.visualViewport?.addEventListener('resize', onResize);
  window.visualViewport?.addEventListener('scroll', onResize);
  window.matchMedia('(display-mode: standalone)').addEventListener('change', onResize);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      window.setTimeout(onResize, 50);
      window.setTimeout(onResize, 300);
    }
  });
}
