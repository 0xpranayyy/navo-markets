import { useEffect, useState } from 'react';

function readStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** Reactive standalone PWA detection (display mode can change after mount). */
export function useStandalonePwa(): boolean {
  const [standalone, setStandalone] = useState(readStandalone);

  useEffect(() => {
    const update = () => setStandalone(readStandalone());
    update();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', update);
    window.addEventListener('resize', update);
    return () => {
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return standalone;
}
