'use client';

import { ListPlus } from 'lucide-react';
import Link from 'next/link';
import { usePlaylists } from '@/hooks/usePlaylists';
import { useAuth } from '@/store/authStore';
import styles from './page.module.css';

function SignInPrompt() {
  return (
    <div className={styles.emptyState}>
      <ListPlus size={64} className={styles.emptyIcon} />
      <h2 className={styles.emptyTitle}>Sign in to see your playlists</h2>
      <p className={styles.emptyText}>
        Create an account or sign in to start curating your game collections.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className={styles.centerState}>
      <div className={styles.spinner} />
      <p>Loading playlists&hellip;</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <ListPlus size={64} className={styles.emptyIcon} />
      <h2 className={styles.emptyTitle}>No playlists yet</h2>
      <p className={styles.emptyText}>Create one to start organizing your game collection.</p>
      <Link href="/" className={styles.browseButton}>
        Browse Games
      </Link>
    </div>
  );
}

function PlaylistCard({
  playlist,
}: Readonly<{
  playlist: { id: string; title: string; description: string | null; isPublic: boolean };
}>) {
  return (
    <Link href={`/playlists/${playlist.id}`} className={styles.card}>
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{playlist.title}</h3>
        {playlist.description && <p className={styles.cardDescription}>{playlist.description}</p>}
        {playlist.isPublic && <span className={styles.publicBadge}>Public</span>}
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
    <div className={styles.main}>
      <div className={`container ${styles.container}`}>
        <div className={styles.header}>
          <h1 className={styles.title}>My Playlists</h1>
          <Link href="/" className={styles.createButton}>
            <ListPlus size={18} />
            <span>Create Playlist</span>
          </Link>
        </div>
        <div className={styles.grid}>
          {playlists.map((p) => (
            <PlaylistCard key={p.id} playlist={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
