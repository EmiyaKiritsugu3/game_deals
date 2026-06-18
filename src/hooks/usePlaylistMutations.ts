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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
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
