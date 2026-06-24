import { Trophy } from 'lucide-react';
import { getLeaderboard } from '@/services/gamification';

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  const entries = await getLeaderboard(50);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Trophy size={24} className="text-yellow-500" />
        Leaderboard
      </h1>

      {!entries || entries.length === 0 ? (
        <div className="text-center py-12">
          <Trophy size={48} className="mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Be the first to join the leaderboard!</h2>
          <p className="text-muted-foreground">Opt in from your Profile page.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-3 font-medium w-16">Rank</th>
                <th className="pb-3 font-medium">User</th>
                <th className="pb-3 font-medium text-right w-20">Badges</th>
                <th className="pb-3 font-medium text-right w-24">XP</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={entry.userId} className="border-b last:border-0">
                  <td className="py-3">
                    <span className="text-lg">
                      {i < 3 ? (
                        <span
                          className="text-lg"
                          role="img"
                          aria-label={`${['gold', 'silver', 'bronze'][i]} medal`}
                        >
                          {['🥇', '🥈', '🥉'][i]}
                        </span>
                      ) : (
                        <span className="text-muted-foreground ml-1">{i + 1}</span>
                      )}
                    </span>
                  </td>
                  <td className="py-3 font-medium">Player {entry.userId.slice(0, 8)}</td>
                  <td className="py-3 text-right text-muted-foreground">{entry.badgeCount}</td>
                  <td className="py-3 text-right font-medium">{entry.xp.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
