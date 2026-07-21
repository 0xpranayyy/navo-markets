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
 * Full-bleed installed PWA shell.
 * On iOS, NEVER size the shell to window.innerHeight alone — that leaves the
 * home-indicator letterbox. Prefer CSS inset:0; only shrink for keyboard.
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
    for (const el of [appRoot]) {
      el?.style.removeProperty('height');
      el?.style.removeProperty('min-height');
      el?.style.removeProperty('max-height');
      el?.style.removeProperty('position');
      el?.style.removeProperty('left');
      el?.style.removeProperty('right');
      el?.style.removeProperty('top');
      el?.style.removeProperty('bottom');
    }
  };

  if (!standalone) {
    root.classList.remove('navo-keyboard-open');
    clearLocks();
    return;
  }

  const inner = window.innerHeight;
  const visual = window.visualViewport?.height ?? inner;
  const offsetTop = window.visualViewport?.offsetTop ?? 0;
  const keyboardOpen = visual > 0 && visual < inner * 0.82;

  root.classList.toggle('navo-keyboard-open', keyboardOpen);

  if (keyboardOpen && appRoot) {
    const px = `${Math.round(visual)}px`;
    root.style.setProperty('--navo-app-h', px);
    appRoot.style.position = 'fixed';
    appRoot.style.left = '0';
    appRoot.style.right = '0';
    appRoot.style.top = `${Math.round(offsetTop)}px`;
    appRoot.style.bottom = 'auto';
    appRoot.style.height = px;
    appRoot.style.maxHeight = px;
  } else {
    clearLocks();
    // iOS scrolls the layout viewport when the keyboard dismisses; snap back.
    if (window.scrollY !== 0) window.scrollTo(0, 0);
  }

  measureTabBarClearance();
}

/** Mark standalone mode and keep keyboard height in sync. */
export function initPwaLayout(): void {
  if (typeof document === 'undefined') return;

  applyStandaloneViewport();

  const onResize = () => applyStandaloneViewport();
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', () => {
    window.setTimeout(onResize, 50);
    window.setTimeout(onResize, 250);
  });
  window.visualViewport?.addEventListener('resize', onResize);
  window.matchMedia('(display-mode: standalone)').addEventListener('change', onResize);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') window.setTimeout(onResize, 50);
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
