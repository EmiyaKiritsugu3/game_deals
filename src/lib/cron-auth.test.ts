import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { verifyCronAuth } from './cron-auth';

beforeEach(() => {
  process.env.CRON_SECRET = 'test-secret';
});

afterEach(() => {
  delete process.env.CRON_SECRET;
});

describe('verifyCronAuth', () => {
  it('returns null for valid Bearer token', () => {
    const request = new Request('http://localhost', {
      headers: { authorization: 'Bearer test-secret' },
    });
    expect(verifyCronAuth(request)).toBeNull();
  });

  it('returns 401 when CRON_SECRET is not set', () => {
    delete process.env.CRON_SECRET;
    const request = new Request('http://localhost', {
      headers: { authorization: 'Bearer test-secret' },
    });
    const response = verifyCronAuth(request);
    expect(response).not.toBeNull();
    expect(response!.status).toBe(401);
  });

  it('returns 401 for wrong token', () => {
    const request = new Request('http://localhost', {
      headers: { authorization: 'Bearer wrong-token' },
    });
    const response = verifyCronAuth(request);
    expect(response).not.toBeNull();
    expect(response!.status).toBe(401);
  });

  it('returns 401 when Authorization header is missing', () => {
    const request = new Request('http://localhost');
    const response = verifyCronAuth(request);
    expect(response).not.toBeNull();
    expect(response!.status).toBe(401);
  });
});
