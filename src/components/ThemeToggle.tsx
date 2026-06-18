'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import styles from './ThemeToggle.module.css';

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
      className={styles.toggle}
      onClick={handleClick}
      aria-label={label}
      title={label}
    >
      {mounted ? (
        <Icon size={18} aria-hidden="true" />
      ) : (
        <span className={styles.placeholder} aria-hidden="true" />
      )}
    </button>
  );
}
