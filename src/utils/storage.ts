const SESSION_KEY = 'navo-session';
const ONBOARDING_KEY = 'navo-onboarding-done';

export function loadSession(): { phase: 'app' | 'landing' | 'onboarding'; tab?: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as { phase: 'app' | 'landing' | 'onboarding'; tab?: string }) : null;
  } catch {
    return null;
  }
}

export function saveSession(phase: string, tab?: string) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ phase, tab }));
}

export function markOnboardingDone() {
  localStorage.setItem(ONBOARDING_KEY, '1');
}

export function hasSeenOnboarding(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === '1';
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
