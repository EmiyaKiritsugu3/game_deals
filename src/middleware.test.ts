import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockUpdateSession } = vi.hoisted(() => ({
  mockUpdateSession: vi.fn(),
}));

vi.mock('@/utils/supabase/middleware', () => ({
  updateSession: mockUpdateSession,
}));

import { config, middleware } from './middleware';

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateSession.mockResolvedValue({ status: 200 });
  });

  it('delegates to updateSession with the request', async () => {
    const request = new NextRequest(new URL('http://localhost/test'));
    const response = await middleware(request);
    expect(mockUpdateSession).toHaveBeenCalledWith(request);
    expect(response).toEqual({ status: 200 });
  });

  it('returns the result from updateSession', async () => {
    const redirect = { status: 307, headers: new Headers({ Location: '/' }) };
    mockUpdateSession.mockResolvedValue(redirect);
    const request = new NextRequest(new URL('http://localhost/wishlist'));
    const response = await middleware(request);
    expect(response).toBe(redirect);
  });

  it('propagates errors from updateSession', async () => {
    mockUpdateSession.mockRejectedValue(new Error('env missing'));
    const request = new NextRequest(new URL('http://localhost/'));
    await expect(middleware(request)).rejects.toThrow('env missing');
  });
});

describe('config.matcher', () => {
  it('exports a matcher array', () => {
    expect(Array.isArray(config.matcher)).toBe(true);
    expect(config.matcher).toHaveLength(1);
  });

  it('matches standard page paths', () => {
    const pattern = new RegExp(`^${config.matcher[0]}$`);
    expect(pattern.test('/wishlist')).toBe(true);
    expect(pattern.test('/alerts/game-1')).toBe(true);
    expect(pattern.test('/profile')).toBe(true);
  });

  it('excludes _next/static', () => {
    const pattern = new RegExp(`^${config.matcher[0]}$`);
    expect(pattern.test('/_next/static/chunks/main.js')).toBe(false);
  });

  it('excludes _next/image', () => {
    const pattern = new RegExp(`^${config.matcher[0]}$`);
    expect(pattern.test('/_next/image/test.png')).toBe(false);
  });

  it('excludes favicon.ico', () => {
    const pattern = new RegExp(`^${config.matcher[0]}$`);
    expect(pattern.test('/favicon.ico')).toBe(false);
  });

  it('excludes api/cron routes', () => {
    const pattern = new RegExp(`^${config.matcher[0]}$`);
    expect(pattern.test('/api/cron/ingest-prices')).toBe(false);
    expect(pattern.test('/api/cron')).toBe(false);
  });

  it('excludes image files', () => {
    const pattern = new RegExp(`^${config.matcher[0]}$`);
    expect(pattern.test('/images/logo.svg')).toBe(false);
    expect(pattern.test('/photo.png')).toBe(false);
    expect(pattern.test('/banner.jpg')).toBe(false);
    expect(pattern.test('/icon.jpeg')).toBe(false);
    expect(pattern.test('/art.gif')).toBe(false);
    expect(pattern.test('/hero.webp')).toBe(false);
  });

  it('allows api routes that are not cron', () => {
    const pattern = new RegExp(`^${config.matcher[0]}$`);
    expect(pattern.test('/api/search')).toBe(true);
  });
});
