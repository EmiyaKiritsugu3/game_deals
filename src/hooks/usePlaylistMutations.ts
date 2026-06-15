'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addGameToPlaylist, createPlaylist } from '@/services/social';
import { useAuth } from '@/store/authStore';

export function usePlaylistMutations(gameId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const addMutation = useMutation({
    mutationFn: (playlistId: string) => addGameToPlaylist(playlistId, gameId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('Unauthenticated');
      const newList = await createPlaylist(user.id, name);
      return addGameToPlaylist(newList.id, gameId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });

  return { addMutation, createMutation };
}
