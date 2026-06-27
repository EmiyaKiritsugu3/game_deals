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

function NotificationBellButton({
  unread,
  onClick,
}: Readonly<{ unread: number; onClick: () => void }>) {
  return (
    <button
      type="button"
      className="bg-none border border-border rounded-full w-9 h-9 inline-flex items-center justify-center text-foreground cursor-pointer relative transition-colors duration-150 hover:bg-muted"
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
        <span
          className="absolute -top-1 -right-1 bg-destructive text-foreground rounded-full text-[10px] font-semibold min-w-[18px] h-[18px] inline-flex items-center justify-center px-[4px]"
          aria-live="polite"
        >
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
        className:
          'block w-full p-3 bg-none border-none text-inherit text-left cursor-pointer font-inherit hover:bg-muted',
      };
  return (
    <li
      key={notification.id}
      className={
        notification.readAt ? 'opacity-55 border-b border-border' : 'border-b border-border'
      }
    >
      <Item {...itemProps}>
        <div className="font-semibold text-sm mb-1">{notification.title}</div>
        {notification.body && (
          <div className="text-[13px] text-foreground">{notification.body}</div>
        )}
        <div className="mt-1 text-[11px] text-muted-foreground">
          {new Date(notification.createdAt).toLocaleString()}
        </div>
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
    queryFn: () => getNotificationsAction(),
    enabled: isLoggedIn,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isLoggedIn) return null;

  const items = data?.items ?? [];
  const unread = data?.unread ?? 0;

  return (
    <div className="relative" ref={ref} aria-live="polite">
      <NotificationBellButton unread={unread} onClick={() => setOpen((v) => !v)} />

      {open && (
        <div className="absolute top-full right-0 mt-2 w-[360px] max-h-[480px] overflow-y-auto bg-background border border-border rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] z-[100]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <strong>Notifications</strong>
            {unread > 0 && (
              <button
                type="button"
                className="bg-none border-none text-xs text-primary cursor-pointer"
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
            <div className="p-6 text-center text-muted-foreground text-[13px]">
              No notifications yet.
            </div>
          ) : (
            <ul className="list-none m-0 p-0">
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
