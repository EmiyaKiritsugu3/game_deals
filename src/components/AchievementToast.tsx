'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/types/social';
import { cn } from '@/lib/utils';

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

  const rarityVariants = {
    Common: "border-gray-500/30 text-gray-400 [&_.iconWrapper]:text-gray-400",
    Rare: "border-blue-400/50 text-white shadow-[0_0_20px_rgba(96,165,250,0.3)] [&_.iconWrapper]:text-blue-400 [&_.iconWrapper]:drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]",
    Epic: "border-purple-500/50 text-white shadow-[0_0_20px_rgba(192,132,252,0.3)] [&_.iconWrapper]:text-purple-400 [&_.iconWrapper]:drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]",
    Legendary: "border-yellow-400/50 text-white shadow-[0_0_20px_rgba(250,204,21,0.3)] [&_.iconWrapper]:text-yellow-400 [&_.iconWrapper]:drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]",
  };

  return (
    <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-4">
      {toasts.map((toast) => {
        return (
          <div
            key={toast.id}
            className={cn(
              "flex min-w-[300px] items-center gap-4 rounded-xl border bg-gradient-to-br from-[#141414]/95 to-[#282828]/95 p-4 px-6 shadow-2xl backdrop-blur-xl animate-[slideIn_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards,fadeOut_0.5s_ease_4.5s_forwards]",
              rarityVariants[toast.badge.rarity]
            )}
          >
            <div
              className="iconWrapper flex h-10 w-10 shrink-0 items-center justify-center"
              dangerouslySetInnerHTML={{ __html: toast.badge.icon_svg }}
            />
            <div className="flex-1">
              <div className="mb-1 text-[0.75rem] font-bold uppercase tracking-widest text-muted-foreground">Nova Insígnia Desbloqueada!</div>
              <div className="mb-0.5 text-base font-bold leading-tight">{toast.badge.name}</div>
              <div className="text-xs text-muted-foreground">{toast.badge.description}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
