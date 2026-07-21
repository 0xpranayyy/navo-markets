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

function shellElements(): HTMLElement[] {
  const nodes: HTMLElement[] = [
    document.documentElement,
    document.body,
    document.getElementById('root')!,
    ...document.querySelectorAll<HTMLElement>('.navo-root-fill'),
  ].filter(Boolean);
  return nodes;
}

function lockElementHeight(el: HTMLElement, px: string): void {
  el.style.height = px;
  el.style.minHeight = px;
  el.style.maxHeight = px;
}

function unlockElementHeight(el: HTMLElement): void {
  el.style.removeProperty('height');
  el.style.removeProperty('min-height');
  el.style.removeProperty('max-height');
}

/** Measure tab bar for InstallPrompt / scroll clearance. */
export function measureTabBarClearance(): void {
  const host = document.querySelector<HTMLElement>('.navo-tab-bar-host');
  if (!host) return;
  const h = Math.ceil(host.getBoundingClientRect().height);
  if (h > 0) {
    document.documentElement.style.setProperty('--navo-tab-bar-clearance', `${h + 8}px`);
  }
}

/** Apply pixel-perfect full-screen height for installed PWAs. */
export function applyStandaloneViewport(): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const standalone = isStandalonePwa();

  root.classList.toggle('navo-standalone', standalone);
  root.classList.toggle('navo-ios', isIos());

  if (!standalone) {
    root.classList.remove('navo-keyboard-open');
    root.style.removeProperty('--navo-app-h');
    root.style.removeProperty('--navo-vh');
    shellElements().forEach(unlockElementHeight);
    return;
  }

  const inner = window.innerHeight;
  const visual = window.visualViewport?.height ?? inner;
  const keyboardOpen = visual > 0 && visual < inner * 0.82;
  const h = Math.round(keyboardOpen ? visual : inner);
  const px = `${h}px`;

  root.classList.toggle('navo-keyboard-open', keyboardOpen);
  root.style.setProperty('--navo-app-h', px);
  root.style.setProperty('--navo-vh', px);
  shellElements().forEach((el) => lockElementHeight(el, px));

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
