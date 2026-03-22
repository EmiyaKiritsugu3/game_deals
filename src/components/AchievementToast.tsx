'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/types/social';
import styles from './AchievementToast.module.css';

interface ToastData {
  id: string;
  badge: Badge;
}

export default function AchievementToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    // Listen for custom badgeAwarded events
    const handleBadgeAwarded = (e: Event) => {
      const customEvent = e as CustomEvent<Badge>;
      const newBadge = customEvent.detail;
      const newToastId = Math.random().toString(36).substring(7);

      setToasts((currentToasts) => [
        ...currentToasts,
        { id: newToastId, badge: newBadge }
      ]);

      // Remove the toast after 5 seconds (matching CSS animation)
      setTimeout(() => {
        setToasts((currentToasts) => currentToasts.filter(t => t.id !== newToastId));
      }, 5000);
    };

    window.addEventListener('badgeAwarded', handleBadgeAwarded);
    return () => {
      window.removeEventListener('badgeAwarded', handleBadgeAwarded);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className={styles.toastContainer}>
      {toasts.map((toast) => {
        const rarityClass = styles[`rarity${toast.badge.rarity}`] || '';

        return (
          <div key={toast.id} className={`${styles.toast} ${rarityClass}`}>
            <div
              className={styles.iconWrapper}
              dangerouslySetInnerHTML={{ __html: toast.badge.icon_svg }}
            />
            <div className={styles.content}>
              <div className={styles.title}>Nova Insígnia Desbloqueada!</div>
              <div className={styles.badgeName}>{toast.badge.name}</div>
              <div className={styles.badgeDesc}>{toast.badge.description}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
