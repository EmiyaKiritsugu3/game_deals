'use client';

import { useState, useEffect } from 'react';
import { createPlaylist, getUserPlaylists, addGameToPlaylist } from '@/services/social';
import { Playlist } from '@/types/social';
import { supabase } from '@/lib/supabase';
import { X } from 'lucide-react';

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
      if (!supabase) return setLoading(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative flex w-full max-w-[400px] flex-col gap-6 rounded-2xl border border-white/10 bg-[#1c1e26] p-6 shadow-2xl md:p-8" onClick={(e) => e.stopPropagation()}>
        <button className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="flex flex-col gap-2">
          <h3 className="text-2xl font-black text-white">Add to Playlist</h3>
          <p className="text-sm font-medium text-muted-foreground">Curate your collections and earn achievements.</p>
        </div>

        <div className="flex max-h-[250px] flex-col gap-2 overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          {playlists.length > 0 ? (
            playlists.map((list) => (
              <button 
                key={list.id} 
                className="group flex items-center justify-between rounded-xl border border-white/5 bg-black/20 p-4 font-bold text-white transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                onClick={() => handleAdd(list.id)}
              >
                <span>{list.title}</span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 pb-0.5 text-lg transition-colors group-hover:bg-primary group-hover:text-primary-foreground">+</span>
              </button>
            ))
          ) : (
            <p className="py-6 text-center text-sm font-medium italic text-muted-foreground">You don&apos;t have any playlists yet.</p>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10">or</div>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="New playlist name..."
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 py-3 px-4 font-bold text-white outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <button 
            className="w-full rounded-xl bg-primary py-3 font-black text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)] active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            disabled={creating || !newListName.trim()}
            onClick={handleCreate}
          >
            {creating ? 'Creating...' : 'Create & Add'}
          </button>
        </div>

        <button className="mt-2 w-full rounded-xl border border-white/10 bg-transparent py-3 font-bold text-white transition-colors hover:bg-white/5" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
