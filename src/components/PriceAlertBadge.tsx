'use client';

import { BellRing } from 'lucide-react';
import { useAlerts } from '@/store/alertStore';
import { useHydrated } from '@/hooks/useHydrated';
import { cn } from '@/lib/utils';

interface PriceAlertBadgeProps {
    gameID: string;
    className?: string;
}

export default function PriceAlertBadge({ gameID, className = '' }: PriceAlertBadgeProps) {
    const isHydrated = useHydrated();
    const { hasAlert } = useAlerts();

    const baseClasses = "flex items-center justify-center bg-primary text-white p-1 rounded min-w-[22px] min-h-[22px] shadow-[0_0_10px_hsl(var(--primary)/0.5)]";

    // Return a placeholder of the same size if not mounted yet
    if (!isHydrated) {
         return <div className={cn(baseClasses, "invisible", className)} aria-hidden="true" />;
    }

    if (!hasAlert(gameID)) return null;

    return (
        <div className={cn(baseClasses, "animate-pulse-slow", className)} title="You have an active price alert for this game">
            <BellRing size={14} fill="currentColor" />
        </div>
    );
}
