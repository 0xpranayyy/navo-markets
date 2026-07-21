import { useEffect } from 'react';
import {
  applyStandaloneViewport,
  isStandalonePwa,
  observeTabBarClearance,
} from '../utils/pwa';

/** Re-apply full-screen height after React mounts (iOS home-screen PWAs). */
export default function PwaViewportFix() {
  useEffect(() => {
    if (!isStandalonePwa()) return;

    applyStandaloneViewport();
    const stopTabBarObserve = observeTabBarClearance();
    const timers = [0, 50, 150, 400, 800, 1200].map((ms) =>
      window.setTimeout(applyStandaloneViewport, ms),
    );

    return () => {
      stopTabBarObserve();
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  return null;
}
