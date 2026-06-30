import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}));

const { createClient } = await import('@/utils/supabase/server');
const mockCreateClient = vi.mocked(createClient);

import { ForbiddenError, getOptionalUser, requireUser, UnauthorizedError } from './require-user';

describe('requireUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws UnauthorizedError when no session', async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as never);

    await expect(requireUser()).rejects.toThrow(UnauthorizedError);
  });

  it('returns user when valid session', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    } as never);

    const result = await requireUser();
    expect(result).toEqual(mockUser);
  });

  it('has correct error codes', () => {
    expect(new UnauthorizedError().statusCode).toBe(401);
    expect(new UnauthorizedError().code).toBe('UNAUTHORIZED');
    expect(new ForbiddenError().statusCode).toBe(403);
    expect(new ForbiddenError().code).toBe('FORBIDDEN');
  });
});

describe('getOptionalUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when no session', async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as never);

    const result = await getOptionalUser();
    expect(result).toBeNull();
  });

  it('returns user when valid session', async () => {
    const mockUser = { id: 'user-456', email: 'optional@example.com' };
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    } as never);

    const result = await getOptionalUser();
    expect(result).toEqual(mockUser);
  });
});
