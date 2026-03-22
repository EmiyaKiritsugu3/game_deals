import Image from 'next/image';
import { getActivities } from '@/services/social';
import { Activity } from '@/types/social';

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
    <div className="group flex items-center gap-5 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-all hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-accent shadow-[0_0_10px_rgba(0,191,165,0.2)]">
        <Image 
          src={user?.avatar_url || '/images/default-avatar.png'}
          alt={user?.username || 'Unknown'}
          fill
          className="object-cover"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <span className="block text-[0.95rem] font-semibold text-accent-foreground">{user?.username || 'Unknown Gamer'}</span>
        <p className="mt-1 line-clamp-2 text-[0.85rem] leading-snug text-muted-foreground">{renderContent()}</p>
      </div>

      {target_thumb && (
        <div className="relative hidden h-[68px] w-[120px] shrink-0 overflow-hidden rounded-lg bg-black/50 sm:block">
          <Image
            src={target_thumb}
            alt={target_name}
            fill
            className="object-cover"
          />
        </div>
      )}
    </div>
  );
}

export async function ActivityFeed() {
  let activities: Activity[] = [];
  try {
      activities = await getActivities(10);
  } catch (e) {
      console.error('Failed to fetch activities:', e);
  }

  return (
    <div className="mt-8 flex flex-col gap-6 px-4">
      <h2 className="mb-2 text-xl font-bold uppercase tracking-wide text-white">Comunidade</h2>
      {activities.length > 0 ? (
        activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">No recent activity.</p>
      )}
    </div>
  );
}
