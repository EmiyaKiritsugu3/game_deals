'use client';

import * as React from 'react';
import { type AccentColor, usePreferences } from '@/components/game/preferences-panel';

/**
 * Maps each accent color to the CSS custom property values it should apply.
 * These override the `--primary` and related variables defined in globals.css.
 *
 * Values are in oklch — the same color space used by the existing design system.
 */
const ACCENT_VARS: Record<AccentColor, Record<string, string>> = {
  emerald: {
    // Default — no overrides needed, matches globals.css
  },
  amber: {
    '--primary': 'oklch(0.78 0.16 70)',
    '--primary-foreground': 'oklch(0.16 0.05 70)',
    '--ring': 'oklch(0.78 0.16 70 / 60%)',
    '--chart-1': 'oklch(0.78 0.16 70)',
    '--sidebar-primary': 'oklch(0.78 0.16 70)',
    '--sidebar-ring': 'oklch(0.78 0.16 70 / 60%)',
  },
  fuchsia: {
    '--primary': 'oklch(0.7 0.2 300)',
    '--primary-foreground': 'oklch(0.16 0.05 300)',
    '--ring': 'oklch(0.7 0.2 300 / 60%)',
    '--chart-1': 'oklch(0.7 0.2 300)',
    '--sidebar-primary': 'oklch(0.7 0.2 300)',
    '--sidebar-ring': 'oklch(0.7 0.2 300 / 60%)',
  },
  cyan: {
    '--primary': 'oklch(0.7 0.2 200)',
    '--primary-foreground': 'oklch(0.16 0.05 200)',
    '--ring': 'oklch(0.7 0.2 200 / 60%)',
    '--chart-1': 'oklch(0.7 0.2 200)',
    '--sidebar-primary': 'oklch(0.7 0.2 200)',
    '--sidebar-ring': 'oklch(0.7 0.2 200 / 60%)',
  },
  rose: {
    '--primary': 'oklch(0.72 0.22 10)',
    '--primary-foreground': 'oklch(0.16 0.05 10)',
    '--ring': 'oklch(0.72 0.22 10 / 60%)',
    '--chart-1': 'oklch(0.72 0.22 10)',
    '--sidebar-primary': 'oklch(0.72 0.22 10)',
    '--sidebar-ring': 'oklch(0.72 0.22 10 / 60%)',
  },
};

/**
 * Reads the user's accent color preference and applies it dynamically by
 * setting CSS custom properties on `:root`. Mount once at the app root.
 *
 * For "emerald" (the default), no overrides are applied — the values from
 * globals.css remain in effect. For other accents, the `--primary` family
 * of variables is overridden so every component that uses `bg-primary`,
 * `text-primary`, `ring-primary`, etc. picks up the new color instantly.
 */
export function AccentApplier() {
  const prefs = usePreferences();

  React.useEffect(() => {
    const root = document.documentElement;
    const vars = ACCENT_VARS[prefs.accent] ?? {};

    // Clear any previously-set accent overrides
    const dataKey = 'dealforge-accent';
    const prev = root.getAttribute(dataKey);
    if (prev) {
      for (const key of prev.split(',')) {
        root.style.removeProperty(key);
      }
    }

    // Apply new overrides
    const keys = Object.keys(vars);
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value);
    }
    root.setAttribute(dataKey, keys.join(','));
  }, [prefs.accent]);

  return null;
}
