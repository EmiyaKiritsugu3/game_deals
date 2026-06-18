'use client';

import { Bell, List } from 'lucide-react';
import styles from './WishlistTabs.module.css';

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
  return (
    <div className={styles.tabContainer}>
      <button
        type="button"
        className={`${styles.tab} ${activeTab === 'wishlist' ? styles.activeTab : ''}`}
        onClick={() => onTabChange('wishlist')}
      >
        <List size={20} />
        Wishlist ({wishlistCount})
      </button>
      <button
        type="button"
        className={`${styles.tab} ${activeTab === 'alerts' ? styles.activeTab : ''}`}
        onClick={() => onTabChange('alerts')}
      >
        <Bell size={20} />
        My Alerts ({alertsCount})
      </button>
    </div>
  );
}
