import type { Store } from '@/types/game';

export function createMockStore(overrides: Partial<Store> = {}): Store {
  return {
    storeID: '1',
    storeName: 'Steam',
    isActive: 1,
    ...overrides,
  };
}
