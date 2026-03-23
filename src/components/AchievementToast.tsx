'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/types/social';
import { cn } from '@/lib/utils';

export default function AchievementToast() {
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    const handleBadgeAwarded = (event: CustomEvent<Badge>) => {
      const badge = event.detail;
      // Prevent duplicates if multiple events fire
      setBadges((prev) => {
        if (prev.some(b => b.id === badge.id)) return prev;
        return [...prev, badge];
      });

      // Remove after 5 seconds
      setTimeout(() => {
        setBadges((prev) => prev.filter((b) => b.id !== badge.id));
      }, 5000);
    };

    window.addEventListener('badgeAwarded', handleBadgeAwarded as EventListener);
    return () => window.removeEventListener('badgeAwarded', handleBadgeAwarded as EventListener);
  }, []);

  const rarityVariants = {
    Common: "border-l-gray-400 bg-linear-to-r from-gray-500/10 to-transparent",
    Rare: "border-l-blue-400 bg-linear-to-r from-blue-500/10 to-transparent shadow-[0_0_20px_rgba(96,165,250,0.2)]",
    Epic: "border-l-purple-400 bg-linear-to-r from-purple-500/15 to-transparent shadow-[0_0_20px_rgba(192,132,252,0.3)]",
    Legendary: "border-l-yellow-400 bg-linear-to-r from-yellow-500/20 to-transparent shadow-[0_0_30px_rgba(250,204,21,0.4)]",
  };

  const iconVariants = {
    Common: "text-gray-400",
    Rare: "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]",
    Epic: "text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]",
    Legendary: "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]",
  };

  return (
    <div className="pointer-events-none fixed bottom-8 right-8 z-9999 flex flex-col gap-4">
      <AnimatePresence>
        {badges.map((badge) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={cn(
              "relative flex items-center gap-4 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 p-4 min-w-[300px] shadow-2xl backdrop-blur-xl border-l-4",
              rarityVariants[badge.rarity as keyof typeof rarityVariants]
            )}
          >
            {/* Animated background glow/particles effect placeholder */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;utf8,<svg_xmlns=\&quot;http://www.w3.org/2000/svg\&quot;_viewBox=\&quot;0_0_100_100\&quot;><circle_cx=\&quot;50\&quot;_cy=\&quot;50\&quot;_r=\&quot;1\&quot;_fill=\&quot;rgba(255,255,255,0.5)\&quot;/></svg>')] bg-size-[20px_20px] opacity-20 mix-blend-screen pointer-events-none" />

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/5 p-2">
               <div
                 className={cn("h-full w-full", iconVariants[badge.rarity as keyof typeof iconVariants])}
                 dangerouslySetInnerHTML={{ __html: badge.icon_svg }}
               />
            </div>

            <div className="flex flex-col">
              <span className={cn(
                "text-xs font-extrabold uppercase tracking-wider text-muted-foreground",
                badge.rarity === 'Legendary' && "text-yellow-400",
                badge.rarity === 'Epic' && "text-purple-400"
              )}>
                Achievement Unlocked!
              </span>
              <span className="text-lg font-bold text-white">{badge.name}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
