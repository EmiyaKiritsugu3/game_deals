'use client';

import { useState, useEffect } from 'react';
import { BellRing } from 'lucide-react';
import { useAlerts } from '@/store/alertStore';
import styles from './PriceAlertBadge.module.css';

interface PriceAlertBadgeProps {
    gameID: string;
    className?: string;
}

export default function PriceAlertBadge({ gameID, className = '' }: PriceAlertBadgeProps) {
    const [mounted, setMounted] = useState(false);
    const { hasAlert } = useAlerts();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !hasAlert(gameID)) return null;

    return (
        <div className={`${styles.badge} ${className}`} title="You have an active price alert for this game">
            <BellRing size={14} fill="currentColor" />
        </div>
    );
}
