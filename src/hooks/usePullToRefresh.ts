import { useRef, useState } from 'react';

export function usePullToRefresh(onRefresh: () => Promise<void>, enabled = true) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const active = useRef(false);

  const startPull = (y: number, el: HTMLElement) => {
    if (!enabled) return;
    if (el.scrollTop <= 0 && !refreshing) {
      startY.current = y;
      active.current = true;
    }
  };

  const movePull = (y: number) => {
    if (!active.current || refreshing || startY.current === null) return;
    const d = (y - startY.current) * 0.5;
    setPull(d > 0 ? Math.min(d, 90) : 0);
  };

  const endPull = () => {
    if (!active.current) return;
    active.current = false;
    if (pull >= 55 && !refreshing) {
      setPull(46);
      setRefreshing(true);
      void onRefresh().finally(() => {
        setRefreshing(false);
        setPull(0);
      });
    } else {
      setPull(0);
    }
  };

  const handlers = {
    onTouchStart: (e: React.TouchEvent<HTMLElement>) => startPull(e.touches[0].clientY, e.currentTarget),
    onTouchMove: (e: React.TouchEvent<HTMLElement>) => movePull(e.touches[0].clientY),
    onTouchEnd: endPull,
    onMouseDown: (e: React.MouseEvent<HTMLElement>) => startPull(e.clientY, e.currentTarget),
    onMouseMove: (e: React.MouseEvent<HTMLElement>) => {
      if (active.current && e.buttons === 1) movePull(e.clientY);
      else if (active.current) endPull();
    },
    onMouseUp: endPull,
    onMouseLeave: endPull,
  };

  return { pull, refreshing, handlers, setRefreshing };
}
