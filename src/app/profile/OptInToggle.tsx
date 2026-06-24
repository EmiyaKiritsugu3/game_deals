'use client';

import { useState } from 'react';
import { updateLeaderboardOptIn } from '@/actions/gamification';

interface OptInToggleProps {
  initialValue: boolean;
}

export default function OptInToggle({ initialValue }: OptInToggleProps) {
  const [optIn, setOptIn] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  const handleToggle = async () => {
    setSaving(true);
    const newValue = !optIn;
    setOptIn(newValue);
    try {
      await updateLeaderboardOptIn(newValue);
    } catch {
      setOptIn(optIn);
    } finally {
      setSaving(false);
    }
  };

  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={optIn}
        onChange={handleToggle}
        disabled={saving}
        className="h-4 w-4 rounded border-muted-foreground"
      />
      <span className="text-sm">{saving ? 'Saving...' : 'Show me on the leaderboard'}</span>
    </label>
  );
}
