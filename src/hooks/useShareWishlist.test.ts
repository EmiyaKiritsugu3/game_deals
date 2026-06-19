// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useShareWishlist } from './useShareWishlist';

describe('useShareWishlist', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('starts with copied=false', () => {
    const { result } = renderHook(() => useShareWishlist(['123']));
    expect(result.current.copied).toBe(false);
  });

  it('sets copied=true and writes URL to clipboard on share', async () => {
    const { result } = renderHook(() => useShareWishlist(['123']));
    await act(async () => {
      result.current.share();
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    const callArg = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0] as string;
    expect(callArg).toContain('/wishlist/shared?ids=');
    expect(result.current.copied).toBe(true);
  });

  it('resets copied to false after 2500ms', async () => {
    const { result } = renderHook(() => useShareWishlist(['123']));
    await act(async () => {
      result.current.share();
    });
    expect(result.current.copied).toBe(true);
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(result.current.copied).toBe(false);
  });

  it('encodes wishlist IDs into the URL', async () => {
    const { result } = renderHook(() => useShareWishlist(['game1', 'game2']));
    await act(async () => {
      result.current.share();
    });
    const callArg = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0] as string;
    expect(callArg).toContain('/wishlist/shared?ids=');
    const encodedPart = callArg.split('ids=')[1];
    expect(encodedPart).toBe(btoa('game1,game2'));
  });
});
