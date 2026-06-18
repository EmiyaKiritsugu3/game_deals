import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWishlist } from './wishlistStore';

// Mock persist to be a pass-through — avoids localStorage dependency in Node env
vi.mock('zustand/middleware', () => ({
  persist: <T>(config: T, _options: Record<string, unknown>): T => config,
}));

describe('wishlistStore', () => {
  beforeEach(() => {
    useWishlist.setState({ wishlist: [] });
  });

  it('starts with an empty wishlist', () => {
    const { wishlist } = useWishlist.getState();
    expect(wishlist).toEqual([]);
  });

  it('adds a game to wishlist', () => {
    const { addToWishlist } = useWishlist.getState();
    addToWishlist('123');
    expect(useWishlist.getState().wishlist).toEqual(['123']);
  });

  it('does not add duplicate game IDs', () => {
    const { addToWishlist } = useWishlist.getState();
    addToWishlist('123');
    addToWishlist('123');
    expect(useWishlist.getState().wishlist).toEqual(['123']);
  });

  it('adds multiple distinct games', () => {
    const { addToWishlist } = useWishlist.getState();
    addToWishlist('123');
    addToWishlist('456');
    addToWishlist('789');
    expect(useWishlist.getState().wishlist).toEqual(['123', '456', '789']);
  });

  it('removes a game from wishlist', () => {
    const { addToWishlist, removeFromWishlist } = useWishlist.getState();
    addToWishlist('123');
    addToWishlist('456');
    removeFromWishlist('123');
    expect(useWishlist.getState().wishlist).toEqual(['456']);
  });

  it('removing a non-existent game does nothing', () => {
    const { addToWishlist, removeFromWishlist } = useWishlist.getState();
    addToWishlist('123');
    removeFromWishlist('999');
    expect(useWishlist.getState().wishlist).toEqual(['123']);
  });

  it('removing last item results in empty wishlist', () => {
    const { addToWishlist, removeFromWishlist } = useWishlist.getState();
    addToWishlist('123');
    removeFromWishlist('123');
    expect(useWishlist.getState().wishlist).toEqual([]);
  });

  it('toggleWishlist adds a game not in wishlist', () => {
    const { toggleWishlist } = useWishlist.getState();
    toggleWishlist('123');
    expect(useWishlist.getState().wishlist).toEqual(['123']);
  });

  it('toggleWishlist removes a game already in wishlist', () => {
    const { addToWishlist, toggleWishlist } = useWishlist.getState();
    addToWishlist('123');
    toggleWishlist('123');
    expect(useWishlist.getState().wishlist).toEqual([]);
  });

  it('toggleWishlist works on non-empty wishlist', () => {
    const { addToWishlist, toggleWishlist } = useWishlist.getState();
    addToWishlist('1');
    addToWishlist('2');
    toggleWishlist('1');
    expect(useWishlist.getState().wishlist).toEqual(['2']);
    toggleWishlist('3');
    expect(useWishlist.getState().wishlist).toEqual(['2', '3']);
  });

  it('isInWishlist returns true for saved game', () => {
    const { addToWishlist, isInWishlist } = useWishlist.getState();
    addToWishlist('123');
    expect(isInWishlist('123')).toBe(true);
  });

  it('isInWishlist returns false for unsaved game', () => {
    const { isInWishlist } = useWishlist.getState();
    expect(isInWishlist('123')).toBe(false);
  });

  it('isInWishlist returns false after removal', () => {
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist.getState();
    addToWishlist('123');
    removeFromWishlist('123');
    expect(isInWishlist('123')).toBe(false);
  });
});

describe('setWishlist', () => {
  it('replaces current wishlist with new ids', () => {
    const { addToWishlist } = useWishlist.getState();
    addToWishlist('123');
    addToWishlist('456');
    const { setWishlist } = useWishlist.getState();
    setWishlist(['cloud-item-1', 'cloud-item-2']);
    expect(useWishlist.getState().wishlist).toEqual(['cloud-item-1', 'cloud-item-2']);
  });

  it('clears wishlist when given empty array', () => {
    const { addToWishlist, setWishlist } = useWishlist.getState();
    addToWishlist('123');
    setWishlist([]);
    expect(useWishlist.getState().wishlist).toEqual([]);
  });

  it('does not mutate the input array', () => {
    const input = ['a', 'b'];
    const { setWishlist } = useWishlist.getState();
    setWishlist(input);
    input.push('c');
    expect(useWishlist.getState().wishlist).toEqual(['a', 'b']);
  });
});
