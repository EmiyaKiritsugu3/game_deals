'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Density = 'comfortable' | 'compact';

interface DensityState {
  density: Density;
  setDensity: (d: Density) => void;
  toggle: () => void;
}

export const useDensity = create<DensityState>()(
  persist(
    (set, get) => ({
      density: 'comfortable',
      setDensity: (d) => set({ density: d }),
      toggle: () =>
        set({
          density: get().density === 'comfortable' ? 'compact' : 'comfortable',
        }),
    }),
    { name: 'deal-grid-density' }
  )
);
