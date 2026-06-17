export function createMockGame(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: '123',
    title: 'Dead Cells',
    cheapsharkId: 'dead-cells-id',
    ...overrides,
  };
}
