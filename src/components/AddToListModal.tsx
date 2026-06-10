'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { addGameToPlaylist, createPlaylist, getUserPlaylists } from '@/services/social';
import { useAuth } from '@/store/authStore';
import styles from './AddToListModal.module.css';

interface AddToListModalProps {
  gameId: string;
  onClose: () => void;
}

export default function AddToListModal({ gameId, onClose }: AddToListModalProps) {
  const [newListName, setNewListName] = useState('');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: playlists = [], isLoading } = useQuery({
    queryKey: ['playlists', user?.id],
    queryFn: () => getUserPlaylists(user!.id),
    enabled: !!user?.id,
  });

  const addMutation = useMutation({
    mutationFn: (playlistId: string) => addGameToPlaylist(playlistId, gameId),
    onMutate: () => {
      onClose(); // Optimistic Instant Close
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('Unauthenticated');
      const newList = await createPlaylist(user.id, name);
      return addGameToPlaylist(newList.id, gameId);
    },
    onMutate: () => {
      onClose(); // Optimistic Instant Close
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });

  if (isLoading) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>Add to Playlist</h3>
        <p className={styles.subtitle}>Curate your collections and earn achievements.</p>

        <div className={styles.existingLists}>
          {playlists.length > 0 ? (
            playlists.map((list) => (
              <button
                key={list.id}
                className={styles.listButton}
                onClick={() => addMutation.mutate(list.id)}
              >
                <span>{list.title}</span>
                <span className={styles.plusIcon}>+</span>
              </button>
            ))
          ) : (
            <p className={styles.empty}>You don't have any playlists yet.</p>
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
            className={styles.createButton}
            disabled={createMutation.isPending || !newListName.trim()}
            onClick={() => createMutation.mutate(newListName)}
          >
            {createMutation.isPending ? 'Creating...' : 'Create & Add'}
          </button>
        </div>

        <button className={styles.closeButton} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
