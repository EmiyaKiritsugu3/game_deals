import Image from 'next/image';
import styles from './ActivityFeed.module.css';

interface ActivityItemProps {
  user: {
    name: string;
    avatar: string;
  };
  game: {
    title: string;
    thumb: string;
  };
  review: string;
}

export default function ActivityItem({ user, game, review }: ActivityItemProps) {
  return (
    <div className={styles.activityCard}>
      <div className={styles.avatarContainer}>
        <Image 
          src={user.avatar} 
          alt={user.name} 
          width={48} 
          height={48} 
          className={styles.imageContent}
        />
      </div>
      
      <div className={styles.content}>
        <span className={styles.username}>{user.name}</span>
        <p className={styles.reviewText}>{review}</p>
      </div>

      <div className={styles.gameThumbContainer}>
        <Image 
          src={game.thumb} 
          alt={game.title} 
          fill 
          className={styles.imageContent} 
        />
      </div>
    </div>
  );
}

export function ActivityFeed({ activities }: { activities: ActivityItemProps[] }) {
  return (
    <div className={styles.activityContainer}>
      <h2 className={styles.sectionTitle}>Comunidade</h2>
      {activities.map((activity, index) => (
        <ActivityItem key={index} {...activity} />
      ))}
    </div>
  );
}
