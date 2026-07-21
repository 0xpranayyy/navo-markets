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
    const standalone = isStandalonePwa();
    root.classList.toggle('navo-standalone', standalone);
    root.classList.toggle('navo-ios', isIos());
  };

  /** Only shrink viewport when the software keyboard is open — never letterbox standalone PWAs. */
  const syncViewportHeight = () => {
    if (!isStandalonePwa()) {
      root.classList.remove('navo-keyboard-open');
      root.style.removeProperty('--navo-vh');
      return;
    }

    const inner = window.innerHeight;
    const visual = window.visualViewport?.height ?? inner;
    const keyboardOpen = visual > 0 && visual < inner * 0.82;

    if (keyboardOpen) {
      root.classList.add('navo-keyboard-open');
      root.style.setProperty('--navo-vh', `${Math.round(visual)}px`);
    } else {
      root.classList.remove('navo-keyboard-open');
      root.style.removeProperty('--navo-vh');
    }
  };

  syncStandalone();
  syncViewportHeight();

  window.addEventListener('resize', syncViewportHeight);
  window.addEventListener('orientationchange', () => {
    window.setTimeout(syncViewportHeight, 100);
  });
  window.visualViewport?.addEventListener('resize', syncViewportHeight);
  window.matchMedia('(display-mode: standalone)').addEventListener('change', () => {
    syncStandalone();
    syncViewportHeight();
  });
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
