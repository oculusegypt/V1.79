/* =============================================
   THEME CONTROLLER — Tawbah Design System
   ============================================= */

export type Theme = 'light' | 'dark';
export type ZakiyState = 'emergency' | 'repentance' | 'growth' | null;

const THEME_KEY = 'tawbah-theme';
const ZAKIY_KEY = 'tawbah-zakiy-state';

/* ── THEME ── */

export function setTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* localStorage not available */
  }
}

export function getTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    /* ignore */
  }
  // Fallback: respect system preference
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function toggleTheme(): Theme {
  const current = getTheme();
  const next: Theme = current === 'light' ? 'dark' : 'light';
  setTheme(next);
  return next;
}

/* ── ZAKIY STATE ── */

export function setZakiyState(state: ZakiyState): void {
  const root = document.documentElement;
  if (state) {
    root.setAttribute('data-zakiy-state', state);
  } else {
    root.removeAttribute('data-zakiy-state');
  }
  try {
    if (state) {
      sessionStorage.setItem(ZAKIY_KEY, state);
    } else {
      sessionStorage.removeItem(ZAKIY_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function getZakiyState(): ZakiyState {
  try {
    const stored = sessionStorage.getItem(ZAKIY_KEY);
    if (stored === 'emergency' || stored === 'repentance' || stored === 'growth') {
      return stored;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/* ── INIT (call once on app start) ── */

export function initTheme(): void {
  const theme = getTheme();
  setTheme(theme);

  const zakiyState = getZakiyState();
  if (zakiyState) {
    setZakiyState(zakiyState);
  }
}

/* ── DECISION TYPE MAPPER ── */

export type DecisionType = 'emergency' | 'repentance' | 'growth' | string;

export function mapDecisionToZakiyState(decisionType: DecisionType): ZakiyState {
  switch (decisionType) {
    case 'emergency':   return 'emergency';
    case 'repentance':  return 'repentance';
    case 'growth':      return 'growth';
    default:            return null;
  }
}
