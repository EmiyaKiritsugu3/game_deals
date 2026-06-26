import Link from 'next/link';
import { getUserPlaylistsAction } from '@/actions/playlists';
import { AnimatedDiv } from '@/components/motion/AnimatedDiv';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default async function CommunityListings() {
  const playlists = await getUserPlaylistsAction();

  if (playlists.length === 0) return null;

  return (
    <AnimatedDiv className="mb-12">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Community Lists</h2>
          <p className="text-sm text-muted-foreground">
            Curated playlists from fellow deal hunters
          </p>
        </div>
        <Link
          href="/playlists"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-sm font-semibold')}
        >
          All Lists &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {playlists.map((playlist) => (
          <AnimatedDiv key={playlist.id} hover>
            <Link href={`/playlists/${playlist.slug}`} className="block no-underline">
              <Card className="h-full transition-colors duration-200 hover:border-primary">
                <CardHeader>
                  <CardTitle className="truncate">{playlist.title}</CardTitle>
                  {playlist.description && (
                    <CardDescription className="line-clamp-2">
                      {playlist.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <span className="text-xs text-muted-foreground">
                    {playlist.isPublic ? 'Public' : 'Private'}
                  </span>
                </CardContent>
              </Card>
            </Link>
          </AnimatedDiv>
        ))}
      </div>
    </AnimatedDiv>
  );
}
