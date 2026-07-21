import { describe, expect, it } from 'vitest';
import { buildHash, parseHash } from './routing';

describe('routing', () => {
  it('parses app tab routes', () => {
    expect(parseHash('#/app/markets')).toEqual({ phase: 'app', tab: 'markets' });
    expect(parseHash('#/app/portfolio')).toEqual({ phase: 'app', tab: 'portfolio' });
  });

  it('parses market deep links', () => {
    expect(parseHash('#/app/market/abc123')).toEqual({ phase: 'app', marketId: 'abc123' });
  });

  it('builds hash from state', () => {
    expect(buildHash({ phase: 'app', tab: 'search', selectedId: null })).toBe('#/app/search');
    expect(buildHash({ phase: 'app', tab: 'markets', selectedId: 'm1' })).toBe('#/app/market/m1');
  });
});
