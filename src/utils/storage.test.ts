import { describe, expect, it, beforeEach } from 'vitest';
import { hasSeenOnboarding, markOnboardingDone, clearSession } from './storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('tracks onboarding completion', () => {
    expect(hasSeenOnboarding()).toBe(false);
    markOnboardingDone();
    expect(hasSeenOnboarding()).toBe(true);
  });

  it('clears session', () => {
    localStorage.setItem('navo-session', '{"phase":"app"}');
    clearSession();
    expect(localStorage.getItem('navo-session')).toBeNull();
  });
});
