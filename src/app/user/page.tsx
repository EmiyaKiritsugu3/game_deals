import { redirect } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabaseServer';
import { getUserStats, getUserBadges, getUserPlaylists } from '@/services/social';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function UserProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/'); // Or redirect to a login page if you have one
  }

  // Fetch all user data in parallel
  const [stats, badges, playlists] = await Promise.all([
    getUserStats(user.id),
    getUserBadges(user.id),
    getUserPlaylists(user.id)
  ]);

  const publicPlaylists = playlists.filter(p => p.is_public);

  // Calculate level based on XP (simple formula: level = sqrt(xp) / 2)
  const xp = stats?.xp || 0;
  const level = Math.max(1, Math.floor(Math.sqrt(xp) / 2) + 1);

  return (
    <div className={styles.container}>
      <header className={styles.profileHeader}>
        <div className={styles.avatarContainer}>
          <Image
            src={user.user_metadata?.avatar_url || '/images/default-avatar.png'}
            alt="User Avatar"
            width={100}
            height={100}
            className={styles.avatar}
          />
        </div>
        <div className={styles.userInfo}>
          <h1 className={styles.username}>{stats?.username || user.user_metadata?.full_name || 'Gamer'}</h1>
          <div className={styles.xpLevel}>Level {level} (XP: {xp})</div>
        </div>
      </header>

      <section className={styles.badgesSection}>
        <h2 className={styles.sectionTitle}>Insignias Conquistadas</h2>
        {badges.length > 0 ? (
          <div className={styles.badgesGrid}>
            {badges.map((userBadge) => {
              if (!userBadge.badge) return null;

              const rarityClass = styles[`rarity${userBadge.badge.rarity}`] || '';

              return (
                <div key={userBadge.badge_id} className={`${styles.badgeCard} ${rarityClass}`}>
                  {/* Using dangerouslySetInnerHTML for SVG icons from the DB */}
                  <div
                    className={styles.badgeIcon}
                    dangerouslySetInnerHTML={{ __html: userBadge.badge.icon_svg }}
                  />
                  <div className={styles.badgeName}>{userBadge.badge.name}</div>
                  <div className={styles.badgeDate}>
                    {new Date(userBadge.awarded_at).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className={styles.emptyState}>No badges earned yet. Keep playing!</p>
        )}
      </section>

      <section className={styles.playlistsSection}>
        <h2 className={styles.sectionTitle}>Playlists Públicas</h2>
        {publicPlaylists.length > 0 ? (
          <div className={styles.playlistsGrid}>
            {publicPlaylists.map((playlist) => (
              <div key={playlist.id} className={styles.playlistCard}>
                <h3 className={styles.playlistTitle}>{playlist.title}</h3>
                {playlist.description && (
                  <p className={styles.playlistDesc}>{playlist.description}</p>
                )}
                <div className={styles.playlistMeta}>
                  <span>{playlist.games_ids?.length || 0} games</span>
                  <span>{new Date(playlist.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>No public playlists created.</p>
        )}
      </section>
    </div>
  );
}
