import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { ResolvedTheme, ThemePreference } from '../../lib/theme';
import {
  applyResolvedTheme,
  getStoredThemePreference,
  resolveTheme,
  setStoredThemePreference,
} from '../../lib/theme';
import { ThemeContext } from './theme-context';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(() => getStoredThemePreference());
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(theme));

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next);
    setStoredThemePreference(next);
    setResolvedTheme(resolveTheme(next));
  }, []);

  useEffect(() => {
    applyResolvedTheme(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!media) return;

    const handleChange = () => {
      const resolved = resolveTheme('system');
      setResolvedTheme(resolved);
    };

    if (media.addEventListener) media.addEventListener('change', handleChange);
    else media.addListener(handleChange);

    return () => {
      if (media.removeEventListener) media.removeEventListener('change', handleChange);
      else media.removeListener(handleChange);
    };
  }, [theme]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [resolvedTheme, setTheme, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
