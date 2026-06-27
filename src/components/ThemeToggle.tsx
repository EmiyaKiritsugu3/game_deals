'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const THEME_CYCLE: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];

const THEME_ICONS: Record<string, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const THEME_LABELS: Record<string, string> = {
  light: 'Switch to dark mode',
  dark: 'Switch to system theme',
  system: 'Switch to light mode',
};

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = (theme ?? 'system') as 'light' | 'dark' | 'system';

  function handleClick() {
    const currentIndex = THEME_CYCLE.indexOf(currentTheme);
    const nextTheme = THEME_CYCLE[(currentIndex + 1) % THEME_CYCLE.length];
    setTheme(nextTheme);
  }

  const Icon = THEME_ICONS[currentTheme];
  const label = THEME_LABELS[currentTheme];

  return (
    <button
      type="button"
      className="flex items-center justify-center w-9 h-9 rounded-[var(--radius)] border border-border/50 bg-muted/30 text-muted-foreground cursor-pointer transition-[color,background,border-color,transform] duration-200 shrink-0 hover:text-primary hover:bg-muted/60 hover:border-primary hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
      onClick={handleClick}
      aria-label={label}
      title={label}
    >
      {mounted ? (
        <Icon size={18} aria-hidden="true" />
      ) : (
        <span className="block w-[18px] h-[18px]" aria-hidden="true" />
      )}
    </button>
  );
}
