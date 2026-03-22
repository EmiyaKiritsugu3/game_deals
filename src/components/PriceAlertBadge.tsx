'use client';

import { BellRing } from 'lucide-react';
import { useAlerts } from '@/store/alertStore';
import { useHydrated } from '@/hooks/useHydrated';
import styles from './PriceAlertBadge.module.css';

interface PriceAlertBadgeProps {
    gameID: string;
    className?: string;
}

export default function PriceAlertBadge({ gameID, className = '' }: PriceAlertBadgeProps) {
    const isHydrated = useHydrated();
    const { hasAlert } = useAlerts();

    // Return a placeholder of the same size if not mounted yet
    if (!isHydrated) {
         return <div className={`${styles.badge} ${styles.badgePlaceholder} ${className}`} aria-hidden="true" />;
    }

    if (!hasAlert(gameID)) return null;

    return (
        <div className={`${styles.badge} ${className}`} title="You have an active price alert for this game">
            <BellRing size={14} fill="currentColor" />
        </div>
    );
}
