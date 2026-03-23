import { redirect } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabaseServer';
import { getUserStats, getUserBadges, getUserPlaylists } from '@/services/social';
import { cn } from '@/lib/utils';

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

  const rarityVariants = {
    Common: "[&_.badgeIcon]:text-gray-400",
    Rare: "[&_.badgeIcon]:text-blue-400 [&_.badgeIcon]:drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]",
    Epic: "[&_.badgeIcon]:text-purple-400 [&_.badgeIcon]:drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]",
    Legendary: "[&_.badgeIcon]:text-yellow-400 [&_.badgeIcon]:drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]",
  };

  return (
    <div className="container mx-auto max-w-[1200px] px-4 py-8">
      <header className="mb-8 flex flex-col items-center gap-4 md:flex-row md:gap-8 rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl md:text-left">
        <div className="relative h-[100px] w-[100px] shrink-0 overflow-hidden rounded-full border-[3px] border-primary shadow-[0_0_20px_rgba(0,191,165,0.3)]">
          <Image
            src={user.user_metadata?.avatar_url || '/images/default-avatar.png'}
            alt="User Avatar"
            fill
            className="object-cover"
            sizes="100px"
          />
        </div>
        <div className="flex-1">
          <h1 className="mb-2 text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{stats?.username || user.user_metadata?.full_name || 'Gamer'}</h1>
          <div className="inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-bold text-primary">Level {level} (XP: {xp})</div>
        </div>
      </header>

      <section className="mt-8">
        <h2 className="mb-4 border-b border-white/10 pb-2 text-2xl font-bold text-white">Insignias Conquistadas</h2>
        {badges.length > 0 ? (
          <div className="flex flex-wrap gap-6">
            {badges.map((userBadge) => {
              if (!userBadge.badge) return null;
              return (
                <div key={userBadge.badge_id} className={cn(
                  "flex w-[140px] flex-col items-center rounded-xl border border-white/5 bg-white/2 p-6 text-center transition-all hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,0,0,0.2)]",
                  rarityVariants[userBadge.badge.rarity as keyof typeof rarityVariants]
                )}>
                  {/* Using dangerouslySetInnerHTML for SVG icons from the DB */}
                  <div
                    className="badgeIcon mb-4 h-12 w-12 text-primary transition-colors"
                    dangerouslySetInnerHTML={{ __html: userBadge.badge.icon_svg }}
                  />
                  <div className="mb-1 text-sm font-bold text-white">{userBadge.badge.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(userBadge.awarded_at).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-8 text-center font-medium italic text-muted-foreground">No badges earned yet. Keep playing!</p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="mb-4 border-b border-white/10 pb-2 text-2xl font-bold text-white">Playlists Públicas</h2>
        {publicPlaylists.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
            {publicPlaylists.map((playlist) => (
              <div key={playlist.id} className="rounded-xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10">
                <h3 className="mb-2 text-lg font-bold text-white">{playlist.title}</h3>
                {playlist.description && (
                  <p className="mb-4 text-sm text-muted-foreground">{playlist.description}</p>
                )}
                <div className="flex justify-between text-xs text-muted-foreground/70">
                  <span>{playlist.games_ids?.length || 0} games</span>
                  <span>{new Date(playlist.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center font-medium italic text-muted-foreground">No public playlists created.</p>
        )}
      </section>
    </div>
  );
}
