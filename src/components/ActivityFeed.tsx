'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getActivities } from '@/services/social';
import { Activity } from '@/types/social';
import styles from './ActivityFeed.module.css';

interface ActivityItemProps {
  activity: Activity;
}

export default function ActivityItem({ activity }: ActivityItemProps) {
  const { user, type, target_name, target_thumb, content } = activity;

  const renderContent = () => {
    switch (type) {
      case 'playlist_created':
        return `Created a new playlist: ${target_name}`;
      case 'badge_earned':
        return `Earned a new badge: ${target_name} 🏆`;
      case 'review':
        return `Reviewed ${target_name}: "${content}"`;
      default:
        return `Interacted with ${target_name}`;
    }
  };

  return (
    <div className={styles.activityCard}>
      <div className={styles.avatarContainer}>
        <Image 
          src={user?.avatar_url || '/images/default-avatar.png'}
          alt={user?.username || 'Unknown'}
          width={48} 
          height={48} 
          className={styles.imageContent}
        />
      </div>
      
      <div className={styles.content}>
        <span className={styles.username}>{user?.username || 'Unknown Gamer'}</span>
        <p className={styles.reviewText}>{renderContent()}</p>
      </div>

      {target_thumb && (
        <div className={styles.gameThumbContainer}>
          <Image
            src={target_thumb}
            alt={target_name}
            fill
            className={styles.imageContent}
          />
        </div>
      )}
    </div>
  );
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      try {
        const data = await getActivities(10);
        setActivities(data);
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, []);

  return (
    <div className={styles.activityContainer}>
      <h2 className={styles.sectionTitle}>Comunidade</h2>
      {loading ? (
        <p className={styles.loadingText}>Loading activities...</p>
      ) : activities.length > 0 ? (
        activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))
      ) : (
        <p className={styles.emptyText}>No recent activity.</p>
      )}
    </div>
  );
}
