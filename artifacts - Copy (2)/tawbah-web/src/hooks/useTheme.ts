import { useState, useCallback, useEffect } from 'react';
import {
  getTheme,
  setTheme,
  toggleTheme,
  getZakiyState,
  setZakiyState,
  type Theme,
  type ZakiyState,
} from '@/core/theme';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => getTheme());
  const [zakiyState, setZakiyStateLocal] = useState<ZakiyState>(() => getZakiyState());

  useEffect(() => {
    // Sync on mount in case initTheme already ran
    setThemeState(getTheme());
    setZakiyStateLocal(getZakiyState());
  }, []);

  const changeTheme = useCallback((t: Theme) => {
    setTheme(t);
    setThemeState(t);
  }, []);

  const toggle = useCallback(() => {
    const next = toggleTheme();
    setThemeState(next);
  }, []);

  const changeZakiyState = useCallback((state: ZakiyState) => {
    setZakiyState(state);
    setZakiyStateLocal(state);
  }, []);

  return {
    theme,
    setTheme: changeTheme,
    toggleTheme: toggle,
    isDark: theme === 'dark',
    zakiyState,
    setZakiyState: changeZakiyState,
  };
}
