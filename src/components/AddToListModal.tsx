'use client';

import { useState, useEffect } from 'react';
import { createPlaylist, getUserPlaylists, addGameToPlaylist } from '@/services/social';
import { Playlist } from '@/types/social';
import { supabase } from '@/lib/supabase';
import styles from './AddToListModal.module.css';

interface AddToListModalProps {
  gameId: string;
  onClose: () => void;
}

export default function AddToListModal({ gameId, onClose }: AddToListModalProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newListName, setNewListName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
        const list = await getUserPlaylists(data.user.id);
        setPlaylists(list);
      }
      setLoading(false);
    }
    init();
  }, []);

  const handleAdd = async (playlistId: string) => {
    try {
      await addGameToPlaylist(playlistId, gameId);
      onClose();
    } catch (err) {
      console.error('Error adding to playlist:', err);
    }
  };

  const handleCreate = async () => {
    if (!userId || !newListName.trim()) return;
    setCreating(true);
    try {
      const newList = await createPlaylist(userId, newListName);
      await addGameToPlaylist(newList.id, gameId);
      onClose();
    } catch (err) {
      console.error('Error creating playlist:', err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return null;

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
                onClick={() => handleAdd(list.id)}
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
            disabled={creating || !newListName.trim()}
            onClick={handleCreate}
          >
            {creating ? 'Creating...' : 'Create & Add'}
          </button>
        </div>

        <button className={styles.closeButton} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
