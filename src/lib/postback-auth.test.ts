import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { verifyPostbackAuth } from './postback-auth';

beforeEach(() => {
  process.env.POSTBACK_SECRET = 'test-postback-secret';
});

afterEach(() => {
  delete process.env.POSTBACK_SECRET;
});

describe('verifyPostbackAuth', () => {
  it('returns null for valid Bearer token', () => {
    const request = new Request('http://localhost', {
      headers: { authorization: 'Bearer test-postback-secret' },
    });
    expect(verifyPostbackAuth(request)).toBeNull();
  });

  it('returns 500 when POSTBACK_SECRET is not set', () => {
    delete process.env.POSTBACK_SECRET;
    const request = new Request('http://localhost', {
      headers: { authorization: 'Bearer test-postback-secret' },
    });
    const response = verifyPostbackAuth(request);
    expect(response?.status).toBe(500);
  });

  it('returns 401 for wrong token', () => {
    const request = new Request('http://localhost', {
      headers: { authorization: 'Bearer wrong-token' },
    });
    expect(verifyPostbackAuth(request)?.status).toBe(401);
  });

  it('returns 401 when Authorization header is missing', () => {
    const request = new Request('http://localhost');
    expect(verifyPostbackAuth(request)?.status).toBe(401);
  });

  it('returns 401 for different-length secrets (timing-safe)', () => {
    process.env.POSTBACK_SECRET = 'short';
    const request = new Request('http://localhost', {
      headers: { authorization: 'Bearer much-longer-token' },
    });
    expect(verifyPostbackAuth(request)?.status).toBe(401);
  });
});
