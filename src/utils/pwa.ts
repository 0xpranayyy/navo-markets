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

/** Measure tab bar for scroll / InstallPrompt clearance. */
export function measureTabBarClearance(): void {
  const host = document.querySelector<HTMLElement>('.navo-tab-bar-host');
  if (!host) return;
  const h = Math.ceil(host.getBoundingClientRect().height);
  if (h > 0) {
    document.documentElement.style.setProperty('--navo-tab-bar-clearance', `${h}px`);
  }
}

/**
 * iOS home-screen PWAs: do NOT lock height to innerHeight — it excludes the
 * home-indicator zone and causes the black bar below the tab bar. Use CSS inset:0
 * + viewport-fit=cover instead; only shrink when the software keyboard opens.
 */
export function applyStandaloneViewport(): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const appRoot = document.getElementById('root');
  const standalone = isStandalonePwa();

  root.classList.toggle('navo-standalone', standalone);
  root.classList.toggle('navo-ios', isIos());

  const clearLocks = () => {
    root.style.removeProperty('--navo-app-h');
    root.style.removeProperty('--navo-vh');
    for (const el of [root, document.body, appRoot]) {
      el?.style.removeProperty('height');
      el?.style.removeProperty('min-height');
      el?.style.removeProperty('max-height');
    }
  };

  if (!standalone) {
    root.classList.remove('navo-keyboard-open');
    clearLocks();
    return;
  }

  const inner = window.innerHeight;
  const visual = window.visualViewport?.height ?? inner;
  const keyboardOpen = visual > 0 && visual < inner * 0.82;

  root.classList.toggle('navo-keyboard-open', keyboardOpen);

  if (keyboardOpen) {
    const px = `${Math.round(visual)}px`;
    root.style.setProperty('--navo-app-h', px);
    if (appRoot) {
      appRoot.style.height = px;
      appRoot.style.maxHeight = px;
    }
  } else {
    clearLocks();
  }

  measureTabBarClearance();
}

/** Lock viewport and mark standalone mode for native iOS shell layout. */
export function initPwaLayout(): void {
  if (typeof document === 'undefined') return;

  applyStandaloneViewport();

  const onResize = () => applyStandaloneViewport();
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', () => {
    window.setTimeout(onResize, 50);
    window.setTimeout(onResize, 200);
    window.setTimeout(onResize, 500);
  });
  window.visualViewport?.addEventListener('resize', onResize);
  window.matchMedia('(display-mode: standalone)').addEventListener('change', onResize);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      window.setTimeout(onResize, 50);
      window.setTimeout(onResize, 300);
    }
  });
}

let tabBarObserver: ResizeObserver | null = null;

/** Observe tab bar size after React mounts. */
export function observeTabBarClearance(): () => void {
  if (typeof window === 'undefined' || !('ResizeObserver' in window)) {
    return () => {};
  }

  tabBarObserver?.disconnect();
  tabBarObserver = new ResizeObserver(() => measureTabBarClearance());

  const attach = () => {
    const host = document.querySelector('.navo-tab-bar-host');
    if (host) tabBarObserver?.observe(host);
    measureTabBarClearance();
  };

  attach();
  const t = window.setTimeout(attach, 100);

  return () => {
    window.clearTimeout(t);
    tabBarObserver?.disconnect();
    tabBarObserver = null;
  };
}
