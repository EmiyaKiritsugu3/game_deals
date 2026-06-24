'use client';

import { useActionState } from 'react';
import { updateLeaderboardOptInAction } from '@/actions/gamification';

interface OptInToggleProps {
  initialValue: boolean;
}

export default function OptInToggle({ initialValue }: OptInToggleProps) {
  const [, formAction] = useActionState(updateLeaderboardOptInAction, null);

  return (
    <form action={formAction}>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          name="optIn"
          defaultChecked={initialValue}
          onChange={(e) => e.target.form?.requestSubmit()}
          className="h-4 w-4 rounded border-muted-foreground"
        />
        <span className="text-sm">Show me on the leaderboard</span>
      </label>
    </form>
  );
}
