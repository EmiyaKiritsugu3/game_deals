/**
 * @vitest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCarousel } from './useCarousel';

describe('useCarousel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initial currentIndex is 0', () => {
    const { result } = renderHook(() => useCarousel(3));

    expect(result.current.currentIndex).toBe(0);
  });

  it('next advances index by 1', () => {
    const { result } = renderHook(() => useCarousel(3));

    act(() => result.current.next());

    expect(result.current.currentIndex).toBe(1);
  });

  it('next wraps from last slide to first', () => {
    const { result } = renderHook(() => useCarousel(3));

    act(() => result.current.goTo(2));
    expect(result.current.currentIndex).toBe(2);

    act(() => result.current.next());
    expect(result.current.currentIndex).toBe(0);
  });

  it('next does nothing when totalSlides is 0', () => {
    const { result } = renderHook(() => useCarousel(0));

    act(() => result.current.next());

    expect(result.current.currentIndex).toBe(0);
  });

  it('prev wraps from first slide to last', () => {
    const { result } = renderHook(() => useCarousel(3));

    act(() => result.current.prev());

    expect(result.current.currentIndex).toBe(2);
  });

  it('prev does nothing when totalSlides is 0', () => {
    const { result } = renderHook(() => useCarousel(0));

    act(() => result.current.prev());

    expect(result.current.currentIndex).toBe(0);
  });

  it('goTo jumps to specified index', () => {
    const { result } = renderHook(() => useCarousel(5));

    act(() => result.current.goTo(3));

    expect(result.current.currentIndex).toBe(3);
  });

  it('auto-advances at the specified interval', () => {
    const { result } = renderHook(() => useCarousel(3, 1000));

    expect(result.current.currentIndex).toBe(0);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.currentIndex).toBe(1);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.currentIndex).toBe(2);
  });

  it('does not set interval when totalSlides is 1 or less', () => {
    const { result } = renderHook(() => useCarousel(1, 1000));

    act(() => vi.advanceTimersByTime(10000));

    expect(result.current.currentIndex).toBe(0);
  });
});
