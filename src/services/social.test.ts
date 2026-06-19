import { afterEach, describe, expect, it, vi } from 'vitest';

type Chain = Record<string, ReturnType<typeof vi.fn>>;

function makeChain(): Chain {
  const resolveRef = { value: { error: null } as unknown };
  const chain: Chain = {
    // biome-ignore lint/suspicious/noThenProperty: thenable required for Supabase mock
    then: (onFulfilled: (v: unknown) => void) => onFulfilled(resolveRef.value),
    _resolveRef: resolveRef,
  } as unknown as Chain;
  chain.single = vi.fn().mockResolvedValue({});
  chain.order = vi.fn().mockResolvedValue({});
  chain.from = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  return chain;
}

const mockClient = vi.hoisted(() => {
  const chain = makeChain();
  return { createClient: vi.fn(() => chain), chain };
});

vi.mock('@/utils/supabase/client', () => ({
  createClient: mockClient.createClient,
}));

import { addGameToPlaylist, createPlaylist, getUserPlaylists } from './social';

afterEach(() => {
  mockClient.chain.single.mockClear();
  mockClient.chain.update.mockClear();
  mockClient.chain.from.mockClear();
  mockClient.chain.insert.mockClear();
  mockClient.chain.select.mockClear();
  mockClient.chain.eq.mockClear();
  mockClient.chain.order.mockClear();
});

describe('createPlaylist', () => {
  it('returns playlist on success', async () => {
    mockClient.chain.single.mockResolvedValue({ data: { id: 'pl1' }, error: null });
    const result = await createPlaylist('u1', 'My List');
    expect(result).toEqual({ id: 'pl1' });
  });

  it('throws on error', async () => {
    mockClient.chain.single.mockResolvedValue({ data: null, error: new Error('DB error') });
    await expect(createPlaylist('u1', 'My List')).rejects.toThrow('DB error');
  });
});

describe('getUserPlaylists', () => {
  it('returns playlists on success', async () => {
    mockClient.chain.order.mockResolvedValue({ data: [{ id: 'pl1' }], error: null });
    const result = await getUserPlaylists('u1');
    expect(result).toEqual([{ id: 'pl1' }]);
  });

  it('throws on error', async () => {
    mockClient.chain.order.mockResolvedValue({ data: null, error: new Error('DB error') });
    await expect(getUserPlaylists('u1')).rejects.toThrow('DB error');
  });
});

describe('addGameToPlaylist', () => {
  it('appends game when not present', async () => {
    mockClient.chain.single.mockResolvedValueOnce({ data: { games_ids: ['g1'] }, error: null });
    await addGameToPlaylist('pl1', 'g2');
    expect(mockClient.chain.update).toHaveBeenCalledWith({ games_ids: ['g1', 'g2'] });
  });

  it('no-ops when game already in list', async () => {
    mockClient.chain.single.mockResolvedValueOnce({
      data: { games_ids: ['g1', 'g2'] },
      error: null,
    });
    await addGameToPlaylist('pl1', 'g2');
    expect(mockClient.chain.update).not.toHaveBeenCalled();
  });

  it('no-ops when playlist not found', async () => {
    mockClient.chain.single.mockResolvedValueOnce({ data: null, error: null });
    await addGameToPlaylist('pl1', 'g2');
    expect(mockClient.chain.update).not.toHaveBeenCalled();
  });

  it('handles null games_ids as empty', async () => {
    mockClient.chain.single.mockResolvedValueOnce({ data: { games_ids: null }, error: null });
    await addGameToPlaylist('pl1', 'g1');
    expect(mockClient.chain.update).toHaveBeenCalledWith({ games_ids: ['g1'] });
  });

  it('throws on update error', async () => {
    mockClient.chain.single.mockResolvedValueOnce({ data: { games_ids: ['g1'] }, error: null });
    const chainWithRef = mockClient.chain as Chain & { _resolveRef: { value: unknown } };
    chainWithRef._resolveRef.value = { error: new Error('Update failed') };
    await expect(addGameToPlaylist('pl1', 'g2')).rejects.toThrow('Update failed');
  });
});
