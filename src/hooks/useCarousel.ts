'use client';
import { useCallback, useEffect, useState } from 'react';

export function useCarousel(totalSlides: number, intervalMs: number = 5000) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const goTo = useCallback((index: number) => setCurrentIndex(index), []);
  const next = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);
  const prev = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  useEffect(() => {
    if (totalSlides <= 1) return;
    const timer = setInterval(next, intervalMs);
    return () => clearInterval(timer);
  }, [next, intervalMs, totalSlides]);

  return { currentIndex, goTo, next, prev };
}
