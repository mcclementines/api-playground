import { createContext } from 'react';
import type { ResolvedTheme, ThemePreference } from '../../lib/theme';

export interface ThemeContextValue {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (next: ThemePreference) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

