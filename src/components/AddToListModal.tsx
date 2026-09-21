'use client';

import { useEffect, useRef, useState } from 'react';
import { usePlaylistMutations } from '@/hooks/usePlaylistMutations';
import { usePlaylists } from '@/hooks/usePlaylists';

interface ListSelectorProps {
  readonly playlists: Array<{ id: string; title: string }>;
  readonly error: string | null;
  readonly addMutation: { isPending: boolean };
  readonly createMutation: { isPending: boolean };
  readonly newListName: string;
  readonly setNewListName: (value: string) => void;
  readonly handleAdd: (playlistId: string) => void;
  readonly handleCreate: () => void;
}
function ListSelector({
  playlists,
  error,
  addMutation,
  createMutation,
  newListName,
  setNewListName,
  handleAdd,
  handleCreate,
}: ListSelectorProps) {
  return (
    <>
      {error && <p className="text-destructive text-sm mb-3">{error}</p>}
      <div className="max-h-[200px] overflow-y-auto mb-4 flex flex-col gap-2">
        {playlists.length > 0 ? (
          playlists.map((list) => (
            <button
              type="button"
              key={list.id}
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg text-foreground flex items-center justify-between cursor-pointer transition-colors duration-200 hover:bg-muted font-medium focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
              onClick={() => handleAdd(list.id)}
              disabled={addMutation.isPending}
            >
              <span>{list.title}</span>
              <span className="text-green-500 font-bold">+</span>
            </button>
          ))
        ) : (
          <p className="text-center text-muted-foreground text-sm p-3">
            You don&apos;t have any playlists yet.
          </p>
        )}
      </div>
      <div className="flex items-center text-center text-muted-foreground text-xs uppercase tracking-wider mb-4 before:flex-1 before:border-b before:border-border before:mr-3 after:flex-1 after:border-b after:border-border after:ml-3">
        or
      </div>
      <div className="flex flex-col gap-3 mb-6">
        <input
          type="text"
          placeholder="New playlist name..."
          aria-label="New playlist name"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          className="bg-black/30 border border-border rounded-lg p-3 text-foreground text-[0.95rem] placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
        />
        <button
          type="button"
          className="bg-green-500 text-black border-none rounded-lg p-3 font-bold cursor-pointer transition-opacity duration-200 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          disabled={createMutation.isPending || !newListName.trim()}
          onClick={() => handleCreate()}
        >
          {createMutation.isPending ? 'Creating...' : 'Create & Add'}
        </button>
      </div>
    </>
  );
}

interface AddToListModalProps {
  readonly gameId: string;
  readonly onClose: () => void;
}

export default function AddToListModal({ gameId, onClose }: AddToListModalProps) {
  const [newListName, setNewListName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { addMutation, createMutation } = usePlaylistMutations(gameId);
  const { data: playlists = [], isLoading } = usePlaylists();
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleClose = () => {
    dialogRef.current?.close();
    onClose();
  };

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
    <dialog
      ref={dialogRef}
      className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-[2000] p-5"
      onClose={handleClose}
    >
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-[400px] p-6 text-foreground shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
        role="none"
      >
        <h3 className="m-0 mb-2 text-2xl font-bold">Add to Playlist</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Curate your collections and earn achievements.
        </p>

        <ListSelector
          playlists={playlists}
          error={error}
          addMutation={addMutation}
          createMutation={createMutation}
          newListName={newListName}
          setNewListName={setNewListName}
          handleAdd={handleAdd}
          handleCreate={handleCreate}
        />

        <button
          type="button"
          className="bg-none border-none text-muted-foreground w-full p-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 focus-visible:rounded"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </dialog>
  );
}
