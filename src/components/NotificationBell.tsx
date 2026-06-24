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

function NotificationBellButton({
  unread,
  onClick,
}: Readonly<{ unread: number; onClick: () => void }>) {
  return (
    <button
      type="button"
      className={styles.bell}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label="Notifications"
    >
      <Bell size={20} />
      {unread > 0 && (
        <span className={styles.badge} aria-live="polite">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </button>
  );
}

function NotificationItem({
  notification,
  onRead,
}: Readonly<{
  notification: {
    id: string;
    title: string;
    body: string | null;
    createdAt: Date;
    readAt: Date | null;
  };
  onRead: (id: string) => void;
}>) {
  const Item = notification.readAt ? 'div' : 'button';
  const itemProps = notification.readAt
    ? {}
    : {
        type: 'button' as const,
        onClick: () => onRead(notification.id),
        className: styles.itemBtn,
      };
  return (
    <li key={notification.id} className={notification.readAt ? styles.itemRead : styles.item}>
      <Item {...itemProps}>
        <div className={styles.title}>{notification.title}</div>
        {notification.body && <div className={styles.body}>{notification.body}</div>}
        <div className={styles.time}>{new Date(notification.createdAt).toLocaleString()}</div>
      </Item>
    </li>
  );
}

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
    <div className={styles.wrapper} ref={ref} aria-live="polite">
      <NotificationBellButton unread={unread} onClick={() => setOpen((v) => !v)} />

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
              {items.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={async (id) => {
                    await markNotificationReadAction(id);
                    await refetch();
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
