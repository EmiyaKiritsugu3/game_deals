interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'test-user-1',
    name: 'Test User',
    email: 'test@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test-user-1',
    ...overrides,
  };
}
