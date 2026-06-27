'use client';

import { BellRing } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAlerts } from '@/store/alertStore';

interface PriceAlertBadgeProps {
  readonly gameID: string;
  readonly className?: string;
}

export default function PriceAlertBadge({ gameID, className = '' }: PriceAlertBadgeProps) {
  const [mounted, setMounted] = useState(false);
  const { hasAlert } = useAlerts();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !hasAlert(gameID)) return null;

  return (
    <div
      title="You have an active price alert for this game"
      className={cn(
        'inline-flex items-center justify-center rounded p-0.5',
        'bg-primary text-foreground',
        'shadow-[0_0_10px_color-mix(in_srgb,var(--primary)_50%,transparent)]',
        'animate-badge-pulse',
        className
      )}
    >
      <BellRing size={14} fill="currentColor" />
    </div>
  );
}
