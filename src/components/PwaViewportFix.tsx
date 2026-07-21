import { useEffect } from 'react';
import { applyStandaloneViewport, isStandalonePwa } from '../utils/pwa';

/** Re-apply full-screen height after React mounts (iOS home-screen PWAs). */
export default function PwaViewportFix() {
  useEffect(() => {
    if (!isStandalonePwa()) return;
    applyStandaloneViewport();
    const timers = [0, 50, 150, 400, 800].map((ms) =>
      window.setTimeout(applyStandaloneViewport, ms),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);
  return null;
}
