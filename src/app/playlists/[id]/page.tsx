'use client';

import { Edit3, ListPlus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePlaylistMutations } from '@/hooks/usePlaylistMutations';
import { usePlaylistDetail } from '@/hooks/usePlaylists';
import { useAuth } from '@/store/authStore';
import styles from './page.module.css';

interface PlaylistDetailPageProps {
  params: { id: string };
}

function SignInPrompt() {
  return (
    <div className={styles.emptyState}>
      <ListPlus size={64} className={styles.emptyIcon} />
      <h2 className={styles.emptyTitle}>Sign in to see this playlist</h2>
      <p className={styles.emptyText}>Create an account or sign in to view and manage playlists.</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className={styles.centerState}>
      <div className={styles.spinner} />
      <p>Loading playlist&hellip;</p>
    </div>
  );
}

function EmptyGamesState() {
  return (
    <div className={styles.emptyGames}>
      <ListPlus size={48} className={styles.emptyIcon} />
      <p>No games in this playlist yet</p>
      <Link href="/" className={styles.browseButton}>
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
    <Link href={href} className={styles.gameCard}>
      <div className={styles.gameImageWrapper}>
        {game.thumbUrl ? (
          <Image
            src={game.thumbUrl}
            alt={game.title ?? ''}
            fill
            className={styles.gameImage}
            sizes="100px"
            unoptimized
          />
        ) : (
          <div className={styles.gameImagePlaceholder} />
        )}
      </div>
      <div className={styles.gameInfo}>
        <h3 className={styles.gameTitle}>{game.title ?? 'Unknown Game'}</h3>
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
      <div className={styles.emptyState}>
        <h2 className={styles.emptyTitle}>Playlist not found</h2>
      </div>
    );
  }

  const isOwner = user?.id === playlist.userId;

  return (
    <main className={styles.main}>
      <div className={`container ${styles.container}`}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{playlist.title}</h1>
            {playlist.description && <p className={styles.description}>{playlist.description}</p>}
            {playlist.isPublic && <span className={styles.publicBadge}>Public</span>}
          </div>
          {isOwner && (
            <div className={styles.ownerActions}>
              <button type="button" className={styles.editButton}>
                <Edit3 size={16} />
                <span>Edit</span>
              </button>
              <button
                type="button"
                className={styles.deleteButton}
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
          <div className={styles.grid}>
            {playlist.games.map((g) => (
              <GameCard key={g.gameId} game={g} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
