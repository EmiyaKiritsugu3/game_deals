'use client';

import { Edit3, ListPlus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePlaylistMutations } from '@/hooks/usePlaylistMutations';
import { usePlaylistDetail } from '@/hooks/usePlaylists';
import { useAuth } from '@/store/authStore';

interface PlaylistDetailPageProps {
  params: { id: string };
}

function SignInPrompt() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-32 px-8 gap-4 min-h-[calc(100vh-200px)]">
      <ListPlus size={64} className="text-muted-foreground opacity-50" />
      <h2 className="text-2xl text-foreground m-0">Sign in to see this playlist</h2>
      <p className="text-muted-foreground max-w-[400px] m-0">
        Create an account or sign in to view and manage playlists.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-32 px-8 min-h-[calc(100vh-200px)]">
      <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
      <p>Loading playlist&hellip;</p>
    </div>
  );
}

function EmptyGamesState() {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-4 py-16 px-8 bg-card/40 border border-dashed border-border/60 rounded-lg">
      <ListPlus size={48} className="text-muted-foreground opacity-50" />
      <p>No games in playlist yet</p>
      <Link
        href="/"
        className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold no-underline hover:-translate-y-0.5 hover:shadow-[0_4px_15px_color-mix(in_srgb,var(--primary)_40%,transparent)] transition-all"
      >
        Browse Games
      </Link>
    </div>
  );
}

function GameCard({
  game,
}: Readonly<{
  game: {
    gameId: string;
    cheapsharkId: string | null;
    title: string | null;
    thumbUrl: string | null;
  };
}>) {
  const href = game.cheapsharkId ? `/game/${game.cheapsharkId}` : '#';
  return (
    <Link
      href={href}
      className="flex flex-col bg-card border border-border rounded-lg overflow-hidden hover:-translate-y-1 hover:shadow-[0_8px_25px_-8px_rgba(0,0,0,0.4)] transition-all"
    >
      <div className="relative w-full aspect-[460/215] overflow-hidden bg-muted">
        {game.thumbUrl ? (
          <Image src={game.thumbUrl} alt={game.title ?? ''} fill sizes="100px" unoptimized />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center" />
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-bold text-foreground m-0 truncate">
          {game.title ?? 'Unknown Game'}
        </h3>
      </div>
    </Link>
  );
}

export default function PlaylistDetailPage({ params }: Readonly<PlaylistDetailPageProps>) {
  const { isLoggedIn, user } = useAuth();
  const { data: playlist, isLoading } = usePlaylistDetail(params.id);
  const { deletePlaylistMutation } = usePlaylistMutations('');

  if (!isLoggedIn) return <SignInPrompt />;
  if (isLoading) return <LoadingState />;
  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-32 px-8 gap-4 min-h-[calc(100vh-200px)]">
        <h2 className="text-2xl text-foreground m-0">Playlist not found</h2>
      </div>
    );
  }

  const isOwner = user?.id === playlist.userId;

  return (
    <div className="py-12 min-h-[calc(100vh-120px)]">
      <div className="container flex flex-col gap-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground m-0 mb-2">{playlist.title}</h1>
            {playlist.description && (
              <p className="text-muted-foreground text-base m-0 mb-3 leading-relaxed">
                {playlist.description}
              </p>
            )}
            {playlist.isPublic && (
              <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded self-start">
                Public
              </span>
            )}
          </div>
          {isOwner && (
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold cursor-pointer font-inherit border border-border bg-card text-foreground hover:border-primary hover:text-primary transition-all"
              >
                <Edit3 size={16} />
                <span>Edit</span>
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold cursor-pointer font-inherit border text-[hsl(0,80%,60%)] border-[hsl(0,80%,60%,0.3)] bg-card hover:bg-[hsl(0,80%,60%,0.08)] transition-all"
                onClick={() => deletePlaylistMutation.mutate(params.id)}
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>

        {playlist.games.length === 0 ? (
          <EmptyGamesState />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            {playlist.games.map((g) => (
              <GameCard key={g.gameId} game={g} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
