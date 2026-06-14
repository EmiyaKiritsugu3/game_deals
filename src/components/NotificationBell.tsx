'use client';

import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  getNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from '@/actions/notifications';
import { useAuth } from '@/store/authStore';
import styles from './NotificationBell.module.css';

export default function NotificationBell() {
  const { isLoggedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotificationsAction(20),
    enabled: isLoggedIn,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!isLoggedIn) return null;

  const items = data?.items ?? [];
  const unread = data?.unread ?? 0;

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        type="button"
        className={styles.bell}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && <span className={styles.badge}>{unread > 99 ? '99+' : unread}</span>}
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <strong>Notifications</strong>
            {unread > 0 && (
              <button
                type="button"
                className={styles.markAll}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    markAllNotificationsReadAction().then(() => refetch());
                  }
                }}
                onClick={async () => {
                  await markAllNotificationsReadAction();
                  await refetch();
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className={styles.empty}>No notifications yet.</div>
          ) : (
            <ul className={styles.list}>
              {items.map((n) => {
                const Item = n.readAt ? 'div' : 'button';
                const itemProps = n.readAt
                  ? {}
                  : {
                      type: 'button' as const,
                      onClick: async () => {
                        await markNotificationReadAction(n.id);
                        await refetch();
                      },
                      className: styles.itemBtn,
                    };
                return (
                  <li key={n.id} className={n.readAt ? styles.itemRead : styles.item}>
                    <Item {...itemProps}>
                      <div className={styles.title}>{n.title}</div>
                      {n.body && <div className={styles.body}>{n.body}</div>}
                      <div className={styles.time}>{new Date(n.createdAt).toLocaleString()}</div>
                    </Item>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
