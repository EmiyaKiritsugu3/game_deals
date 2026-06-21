import { createClient } from '@/utils/supabase/server';

export class UnauthorizedError extends Error {
  readonly code = 'UNAUTHORIZED' as const;
  readonly statusCode = 401;

  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  readonly code = 'FORBIDDEN' as const;
  readonly statusCode = 403;

  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function getOptionalUser() {
  try {
    return await requireUser();
  } catch {
    return null;
  }
}
