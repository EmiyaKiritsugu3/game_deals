'use client';

import { ListPlus } from 'lucide-react';
import Link from 'next/link';
import { usePlaylists } from '@/hooks/usePlaylists';
import { useAuth } from '@/store/authStore';

function SignInPrompt() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-32 px-8 gap-4 min-h-[calc(100vh-200px)]">
      <ListPlus size={64} className="text-muted-foreground opacity-50" />
      <h2 className="text-2xl text-foreground m-0">Sign in to see playlists</h2>
      <p className="text-muted-foreground max-w-[400px] m-0">
        Create an account or sign in to start curating game collections.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-32 px-8 min-h-[calc(100vh-200px)]">
      <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
      <p>Loading playlists&hellip;</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-32 px-8 gap-4 min-h-[calc(100vh-200px)]">
      <ListPlus size={64} className="text-muted-foreground opacity-50" />
      <h2 className="text-2xl text-foreground m-0">No playlists yet</h2>
      <p className="text-muted-foreground max-w-[400px] m-0">
        Create one to start organizing your game collection.
      </p>
      <Link
        href="/"
        className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold no-underline hover:-translate-y-0.5 hover:shadow-[0_4px_15px_color-mix(in_srgb,var(--primary)_40%,transparent)] transition-all"
      >
        Browse Games
      </Link>
    </div>
  );
}

function PlaylistCard({
  playlist,
}: Readonly<{
  playlist: {
    id: string;
    title: string;
    description: string | null;
    isPublic: boolean;
  };
}>) {
  return (
    <Link
      href={`/playlists/${playlist.id}`}
      className="bg-card rounded-lg border border-border p-6 no-underline transition-all flex flex-col hover:-translate-y-0.5 hover:shadow-[0_8px_25px_-8px_rgba(0,0,0,0.4)] hover:border-primary"
    >
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-bold text-foreground m-0">{playlist.title}</h3>
        {playlist.description && (
          <p className="text-sm text-muted-foreground m-0">{playlist.description}</p>
        )}
        {playlist.isPublic && (
          <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded self-start">
            Public
          </span>
        )}
      </div>
    </Link>
  );
}

export default function PlaylistsPage() {
  const { isLoggedIn } = useAuth();
  const { data: playlists, isLoading } = usePlaylists();

  if (!isLoggedIn) return <SignInPrompt />;
  if (isLoading) return <LoadingState />;
  if (!playlists || playlists.length === 0) return <EmptyState />;

  return (
    <div className="py-12 min-h-[calc(100vh-120px)]">
      <div className="container flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-foreground m-0">My Playlists</h1>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm no-underline border-none cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_4px_15px_color-mix(in_srgb,var(--primary)_30%,transparent)] transition-all"
          >
            <ListPlus size={18} />
            <span>New Playlist</span>
          </button>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
          {playlists.map((pl) => (
            <PlaylistCard key={pl.id} playlist={pl} />
          ))}
        </div>
      </div>
    </div>
  );
}
