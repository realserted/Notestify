'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
export type Accent = 'default' | 'pink' | 'blue' | 'green' | 'yellow' | 'orange';

export const ACCENTS: { id: Accent; label: string; swatch: string }[] = [
  { id: 'default', label: 'Cream', swatch: '#FAF9F5' },
  { id: 'pink', label: 'Pink', swatch: '#fce7f3' },
  { id: 'blue', label: 'Blue', swatch: '#dbeafe' },
  { id: 'green', label: 'Green', swatch: '#dcfce7' },
  { id: 'yellow', label: 'Yellow', swatch: '#fef9c3' },
  { id: 'orange', label: 'Orange', swatch: '#fed7aa' },
];

interface ThemeContextValue {
  theme: Theme;
  accent: Accent;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
  setAccent: (accent: Accent) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_KEY = 'notestify-theme';
const ACCENT_KEY = 'notestify-accent';

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
};

const applyAccent = (accent: Accent) => {
  document.documentElement.setAttribute('data-bg', accent);
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [accent, setAccentState] = useState<Accent>('default');

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY) as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial: Theme = stored ?? (prefersDark ? 'dark' : 'light');
    setThemeState(initial);
    applyTheme(initial);

    const storedAccent = (localStorage.getItem(ACCENT_KEY) as Accent | null) ?? 'default';
    setAccentState(storedAccent);
    applyAccent(storedAccent);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const setAccent = useCallback((next: Accent) => {
    setAccentState(next);
    applyAccent(next);
    localStorage.setItem(ACCENT_KEY, next);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, accent, toggle, setTheme, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};