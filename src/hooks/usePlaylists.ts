'use client';

import { useQuery } from '@tanstack/react-query';
import { getPlaylistByIdAction, getUserPlaylistsAction } from '@/actions/playlists';

export function usePlaylists() {
  return useQuery({
    queryKey: ['playlists'],
    queryFn: () => getUserPlaylistsAction(),
    staleTime: 1000 * 60 * 5,
  });
}

export function usePlaylistDetail(id: string) {
  return useQuery({
    queryKey: ['playlist', id],
    queryFn: () => getPlaylistByIdAction(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}
