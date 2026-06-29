import { create } from 'zustand';
import type { DealWithStore } from '@/lib/deal-utils';

interface CompareState {
  items: DealWithStore[];
  isOpen: boolean;
  maxItems: number;
  toggle: (deal: DealWithStore) => void;
  add: (deal: DealWithStore) => void;
  remove: (dealID: string) => void;
  has: (dealID: string) => boolean;
  clear: () => void;
  open: () => void;
  close: () => void;
  setOpen: (v: boolean) => void;
}

export const useCompare = create<CompareState>()((set, get) => ({
  items: [],
  isOpen: false,
  maxItems: 3,
  toggle: (deal) => {
    const exists = get().items.some((i) => i.dealID === deal.dealID);
    if (exists) {
      get().remove(deal.dealID);
    } else if (get().items.length < get().maxItems) {
      set((s) => ({ items: [...s.items, deal] }));
    }
  },
  add: (deal) => {
    if (get().items.length >= get().maxItems) return;
    if (get().items.some((i) => i.dealID === deal.dealID)) return;
    set((s) => ({ items: [...s.items, deal] }));
  },
  remove: (dealID) => set((s) => ({ items: s.items.filter((i) => i.dealID !== dealID) })),
  has: (dealID) => get().items.some((i) => i.dealID === dealID),
  clear: () => set({ items: [] }),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  setOpen: (v) => set({ isOpen: v }),
}));
