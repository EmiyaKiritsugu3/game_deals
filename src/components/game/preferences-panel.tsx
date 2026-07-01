'use client';

import {
  Bell,
  Check,
  Download,
  Eye,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Settings,
  Sun,
  Trash2,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import * as React from 'react';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export type AccentColor = 'emerald' | 'amber' | 'fuchsia' | 'cyan' | 'rose';
export type NotificationThreshold = '10' | '25' | '50' | '75';

interface UserPreferences {
  accent: AccentColor;
  notifications: boolean;
  dropThreshold: number; // percentage
  autoRefresh: boolean;
  compactGrid: boolean;
  showVerifiedOnly: boolean;
}

const DEFAULT_PREFS: UserPreferences = {
  accent: 'emerald',
  notifications: true,
  dropThreshold: 25,
  autoRefresh: true,
  compactGrid: false,
  showVerifiedOnly: false,
};

const ACCENT_COLORS: Array<{
  key: AccentColor;
  label: string;
  color: string;
  oklch: string;
}> = [
  {
    key: 'emerald',
    label: 'Emerald',
    color: 'bg-emerald-500',
    oklch: 'oklch(0.78 0.2 145)',
  },
  {
    key: 'amber',
    label: 'Amber',
    color: 'bg-amber-500',
    oklch: 'oklch(0.78 0.16 70)',
  },
  {
    key: 'fuchsia',
    label: 'Fuchsia',
    color: 'bg-fuchsia-500',
    oklch: 'oklch(0.7 0.2 300)',
  },
  {
    key: 'cyan',
    label: 'Cyan',
    color: 'bg-cyan-500',
    oklch: 'oklch(0.7 0.2 200)',
  },
  {
    key: 'rose',
    label: 'Rose',
    color: 'bg-rose-500',
    oklch: 'oklch(0.72 0.22 10)',
  },
];

const PREFS_KEY = 'dealforge-preferences';

function loadPrefs(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw
      ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Record<string, unknown>) }
      : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

function savePrefs(prefs: UserPreferences) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

/** Hook for other components to read user preferences. */
export function usePreferences(): UserPreferences {
  const [prefs, setPrefs] = React.useState<UserPreferences>(DEFAULT_PREFS);
  React.useEffect(() => {
    setPrefs(loadPrefs());
    const handler = () => setPrefs(loadPrefs());
    window.addEventListener('dealforge:prefs-changed', handler);
    return () => window.removeEventListener('dealforge:prefs-changed', handler);
  }, []);
  return prefs;
}

interface PreferencesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PreferencesPanel({ open, onOpenChange }: PreferencesPanelProps) {
  const [prefs, setPrefs] = React.useState<UserPreferences>(() => {
    if (typeof window !== 'undefined') return loadPrefs();
    return DEFAULT_PREFS;
  });
  const { theme, setTheme } = useTheme();

  const update = (partial: Partial<UserPreferences>) => {
    const next = { ...prefs, ...partial };
    setPrefs(next);
    savePrefs(next);
    window.dispatchEvent(new CustomEvent('dealforge:prefs-changed'));
  };

  const handleExport = () => {
    const data = {
      preferences: prefs,
      wishlist: JSON.parse(localStorage.getItem('dealforge-wishlist') || '{}'),
      achievements: JSON.parse(localStorage.getItem('dealforge-achievements') || '{}'),
      auth: JSON.parse(localStorage.getItem('dealforge-auth') || '{}'),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dealforge-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    [
      'dealforge-wishlist',
      'dealforge-compare',
      'dealforge-achievements',
      'dealforge-preferences',
      'dealforge-recent-searches',
    ].forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    });
    window.location.reload();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="glass-strong w-full border-border/60 p-0 sm:max-w-md overflow-y-auto"
      >
        <SheetHeader className="border-b border-border/40 p-5 text-left">
          <SheetTitle className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-primary/15 text-primary">
              <Settings className="size-5" />
            </span>
            Preferences
          </SheetTitle>
          <SheetDescription className="sr-only">
            Customize your DEALFORGE experience.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 p-5">
          {/* Theme */}
          <section>
            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Palette className="size-3.5" />
              Appearance
            </h3>

            {/* Theme mode */}
            <div className="mb-4">
              <Label className="mb-2 block text-xs font-medium">Theme</Label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { key: 'light', label: 'Light', icon: Sun },
                    { key: 'dark', label: 'Dark', icon: Moon },
                    { key: 'system', label: 'System', icon: Monitor },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setTheme(opt.key)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all',
                      theme === opt.key
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border/50 bg-card/40 text-muted-foreground hover:border-primary/30'
                    )}
                  >
                    <opt.icon className="size-4" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent color */}
            <div>
              <Label className="mb-2 block text-xs font-medium">Accent color</Label>
              <div className="flex flex-wrap gap-2">
                {ACCENT_COLORS.map((c, i) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => update({ accent: c.key })}
                    className={cn(
                      'group relative flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all',
                      prefs.accent === c.key
                        ? 'border-primary/40 bg-primary/10'
                        : 'border-border/50 bg-card/40 hover:border-primary/30'
                    )}
                    style={{
                      animation: `palette-slide 0.3s ease-out ${i * 50}ms both`,
                    }}
                    aria-label={`Set accent to ${c.label}`}
                    aria-pressed={prefs.accent === c.key}
                  >
                    <span
                      className={cn(
                        'size-4 rounded-full ring-2 ring-offset-2 ring-offset-background',
                        c.color
                      )}
                      style={
                        prefs.accent === c.key
                          ? { ['--tw-ring-color' as string]: c.oklch }
                          : undefined
                      }
                    />
                    {c.label}
                    {prefs.accent === c.key && (
                      <Check className="size-3 text-primary animate-share-pop" />
                    )}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                Note: accent preview applies on next page reload.
              </p>
            </div>
          </section>

          {/* Notifications */}
          <section>
            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Bell className="size-3.5" />
              Notifications
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card/40 p-3">
                <div className="pr-3">
                  <Label htmlFor="notifications" className="text-xs font-medium">
                    Price-drop alerts
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Get notified when wishlisted games drop in price
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={prefs.notifications}
                  onCheckedChange={(v) => update({ notifications: v })}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              <div className="rounded-xl border border-border/50 bg-card/40 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <Label className="text-xs font-medium">Drop threshold</Label>
                  <span className="font-mono text-xs font-bold text-primary">
                    {prefs.dropThreshold}%
                  </span>
                </div>
                <p className="mb-3 text-[10px] text-muted-foreground">
                  Only alert me when a price drops by at least this much
                </p>
                <Slider
                  value={[prefs.dropThreshold]}
                  onValueChange={(val) => update({ dropThreshold: (val as number[])[0] })}
                  min={5}
                  max={75}
                  step={5}
                  className="cursor-pointer"
                />
                <div className="mt-1.5 flex justify-between text-[9px] text-muted-foreground">
                  <span>5%</span>
                  <span>40%</span>
                  <span>75%</span>
                </div>
              </div>
            </div>
          </section>

          {/* Browsing */}
          <section>
            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Eye className="size-3.5" />
              Browsing
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card/40 p-3">
                <div className="pr-3">
                  <Label htmlFor="auto-refresh" className="text-xs font-medium">
                    Auto-refresh deals
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Automatically refresh deals every 5 minutes
                  </p>
                </div>
                <Switch
                  id="auto-refresh"
                  checked={prefs.autoRefresh}
                  onCheckedChange={(v) => update({ autoRefresh: v })}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card/40 p-3">
                <div className="pr-3">
                  <Label htmlFor="compact-grid" className="text-xs font-medium">
                    Compact grid
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Show more deals per row (denser layout)
                  </p>
                </div>
                <Switch
                  id="compact-grid"
                  checked={prefs.compactGrid}
                  onCheckedChange={(v) => update({ compactGrid: v })}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card/40 p-3">
                <div className="pr-3">
                  <Label htmlFor="verified-only" className="text-xs font-medium">
                    Verified stores only
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Only show deals from official retailers
                  </p>
                </div>
                <Switch
                  id="verified-only"
                  checked={prefs.showVerifiedOnly}
                  onCheckedChange={(v) => update({ showVerifiedOnly: v })}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
          </section>

          {/* Data management */}
          <section>
            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Download className="size-3.5" />
              Data
            </h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleExport}
                className="flex w-full items-center justify-between rounded-xl border border-border/50 bg-card/40 p-3 text-left transition-all hover:border-primary/40"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="size-4 text-primary" />
                  <div>
                    <p className="text-xs font-medium">Export my data</p>
                    <p className="text-[10px] text-muted-foreground">
                      Wishlist, achievements, preferences (JSON)
                    </p>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex w-full items-center justify-between rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-left transition-all hover:bg-destructive/20"
              >
                <div className="flex items-center gap-2.5">
                  <Trash2 className="size-4 text-destructive" />
                  <div>
                    <p className="text-xs font-medium text-destructive">Reset all data</p>
                    <p className="text-[10px] text-muted-foreground">
                      Clear wishlist, achievements, preferences
                    </p>
                  </div>
                </div>
                <RotateCcw className="size-3.5 text-destructive" />
              </button>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
