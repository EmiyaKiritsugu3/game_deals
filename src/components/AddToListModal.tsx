'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { usePlaylistMutations } from '@/hooks/usePlaylistMutations';
import { getUserPlaylists } from '@/services/social';
import { useAuth } from '@/store/authStore';
import styles from './AddToListModal.module.css';

interface AddToListModalProps {
  gameId: string;
  onClose: () => void;
}

export default function AddToListModal({ gameId, onClose }: AddToListModalProps) {
  const [newListName, setNewListName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { addMutation, createMutation } = usePlaylistMutations(gameId);
  const { user } = useAuth();
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleClose = () => {
    dialogRef.current?.close();
    onClose();
  };

  const { data: playlists = [], isLoading } = useQuery({
    queryKey: ['playlists', user?.id],
    queryFn: () => getUserPlaylists(user?.id ?? ''),
    enabled: !!user?.id,
  });

  const handleAdd = (playlistId: string) => {
    addMutation.mutate(playlistId, {
      onSuccess: () => onClose(),
      onError: (err) => {
        setError('Failed to add game to playlist');
        console.error(err);
      },
    });
  };

  const handleCreate = () => {
    createMutation.mutate(newListName, {
      onSuccess: () => {
        setNewListName('');
        onClose();
      },
      onError: (err) => {
        setError('Failed to create playlist');
        console.error(err);
      },
    });
  };

  if (isLoading) return null;

  return (
    <dialog ref={dialogRef} className={styles.overlay} onClose={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="none">
        <h3>Add to Playlist</h3>
        <p className={styles.subtitle}>Curate your collections and earn achievements.</p>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.existingLists}>
          {playlists.length > 0 ? (
            playlists.map((list) => (
              <button
                type="button"
                key={list.id}
                className={styles.listButton}
                onClick={() => handleAdd(list.id)}
                disabled={addMutation.isPending}
              >
                <span>{list.title}</span>
                <span className={styles.plusIcon}>+</span>
              </button>
            ))
          ) : (
            <p className={styles.empty}>You don&apos;t have any playlists yet.</p>
          )}
        </div>

        <div className={styles.divider}>or</div>

        <div className={styles.createForm}>
          <input
            type="text"
            placeholder="New playlist name..."
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            className={styles.input}
          />
          <button
            type="button"
            className={styles.createButton}
            disabled={createMutation.isPending || !newListName.trim()}
            onClick={() => handleCreate()}
          >
            {createMutation.isPending ? 'Creating...' : 'Create & Add'}
          </button>
        </div>

        <button type="button" className={styles.closeButton} onClick={onClose}>
          Cancel
        </button>
      </div>
    </dialog>
  );
}
