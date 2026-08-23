'use client';

import { Bell, List } from 'lucide-react';

interface WishlistTabsProps {
  readonly activeTab: 'wishlist' | 'alerts';
  readonly onTabChange: (tab: 'wishlist' | 'alerts') => void;
  readonly wishlistCount: number;
  readonly alertsCount: number;
}

export default function WishlistTabs({
  activeTab,
  onTabChange,
  wishlistCount,
  alertsCount,
}: WishlistTabsProps) {
  const baseTab =
    'flex items-center gap-2.5 px-6 py-3 border-none bg-none text-muted-foreground font-bold text-[0.95rem] cursor-pointer relative transition-colors duration-200 hover:text-foreground';

  const activeTabStyles =
    'text-primary after:content-[""] after:absolute after:bottom-[-0.5rem] after:left-0 after:right-0 after:h-[3px] after:bg-primary after:rounded-t-[3px] after:shadow-[0_-2px_10px_rgb(from_var(--primary)_r_g_b_/0.3)]';

  return (
    <div className="flex gap-4 mb-8 border-b border-border/50 pb-2" role="tablist">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'wishlist'}
        className={`${baseTab} focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 focus-visible:rounded-sm ${activeTab === 'wishlist' ? activeTabStyles : ''}`}
        onClick={() => onTabChange('wishlist')}
      >
        <List size={20} />
        Wishlist ({wishlistCount})
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'alerts'}
        className={`${baseTab} focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 focus-visible:rounded-sm ${activeTab === 'alerts' ? activeTabStyles : ''}`}
        onClick={() => onTabChange('alerts')}
      >
        <Bell size={20} />
        My Alerts ({alertsCount})
      </button>
    </div>
  );
}
