'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { resolveGameUuid } from '@/actions/deals';
import {
  addGameToPlaylistAction,
  createPlaylistAction,
  deletePlaylistAction,
  removeGameFromPlaylistAction,
  updatePlaylistAction,
} from '@/actions/playlists';
import { useAuth } from '@/store/authStore';

export function usePlaylistMutations(gameId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const addMutation = useMutation({
    mutationFn: async (playlistId: string) => {
      const resolvedId = await resolveGameUuid(gameId);
      if (!resolvedId) throw new Error('Game not found');
      return addGameToPlaylistAction(playlistId, gameId);
    },
    onSuccess: (_data, playlistId) => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('Unauthenticated');
      const newList = await createPlaylistAction(user.id, name);
      await addGameToPlaylistAction(newList.id, gameId);
      return newList;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });

  const removeGameMutation = useMutation({
    mutationFn: async (params: { playlistId: string; gameId: string }) => {
      return removeGameFromPlaylistAction(params.playlistId, params.gameId);
    },
    onSuccess: (_data, params) => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlist', params.playlistId] });
    },
  });

  const deletePlaylistMutation = useMutation({
    mutationFn: async (playlistId: string) => {
      return deletePlaylistAction(playlistId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });

  const updatePlaylistMutation = useMutation({
    mutationFn: async (params: {
      id: string;
      data: { title?: string; description?: string | null; isPublic?: boolean };
    }) => {
      return updatePlaylistAction(params.id, params.data);
    },
    onSuccess: (_data, params) => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlist', params.id] });
    },
  });

  return {
    addMutation,
    createMutation,
    removeGameMutation,
    deletePlaylistMutation,
    updatePlaylistMutation,
  };
}
