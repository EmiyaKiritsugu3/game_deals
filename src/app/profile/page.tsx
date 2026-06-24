import { redirect } from 'next/navigation';
import LevelBadge from '@/components/LevelBadge';
import { getUserProfile, RARITY_COLORS } from '@/services/gamification';
import { createClient } from '@/utils/supabase/server';
import OptInToggle from './OptInToggle';

function calcXpToNext(level: number): number {
  return (level + 1) * (level + 1) * 10 - level * level * 10;
}

function formatActionType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/auth-code-error');
  }

  const provider = user.identities?.[0]?.provider ?? 'email';
  const created = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const profile = await getUserProfile(user.id);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      <div className="space-y-4 mb-8">
        <div>
          <span className="text-sm text-muted-foreground">Email</span>
          <p className="text-base">{user.email ?? '—'}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Provider</span>
          <p className="text-base capitalize">{provider}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Member since</span>
          <p className="text-base">{created}</p>
        </div>
      </div>

      {/* Gamification Section */}
      {profile && (
        <div className="space-y-8">
          {/* XP Bar + Level */}
          <section aria-label="Experience and level">
            <LevelBadge
              level={profile.stats.level}
              xp={profile.stats.xp}
              xpToNext={calcXpToNext(profile.stats.level)}
            />
          </section>

          {/* Badge Grid */}
          {profile.badges.length > 0 && (
            <section aria-label="Badges earned">
              <h2 className="text-lg font-semibold mb-3">Badges</h2>
              <div className="grid grid-cols-3 gap-3">
                {profile.badges.map((badge) => (
                  <div
                    key={badge.id}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg border"
                    style={{ borderColor: RARITY_COLORS[badge.rarity ?? 'Common'] ?? '#9ca3af' }}
                  >
                    {/* biome-ignore lint/security/noDangerouslySetInnerHtml: inline SVG from seed data, trusted content */}
                    <div dangerouslySetInnerHTML={{ __html: badge.iconSvg }} className="w-8 h-8" />
                    <span className="text-xs text-center font-medium">{badge.name}</span>
                    <span className="text-[10px] text-muted-foreground">{badge.rarity}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {profile.badges.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No badges yet. Keep using the site to earn some!
            </p>
          )}

          {/* Activity Feed */}
          {profile.recentActivity.length > 0 && (
            <section aria-label="Recent activity">
              <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
              <div className="space-y-2">
                {profile.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    <span className="flex-1">{formatActionType(activity.actionType)}</span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Leaderboard Opt-In */}
          <section aria-label="Leaderboard preference">
            <OptInToggle initialValue={profile.stats.optInLeaderboard} />
          </section>
        </div>
      )}

      {!profile && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Start adding games to earn XP!</p>
        </div>
      )}
    </div>
  );
}
