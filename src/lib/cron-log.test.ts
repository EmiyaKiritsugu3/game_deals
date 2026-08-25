import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cronError, cronLog } from './cron-log';

describe('cron-log', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('cronLog emits valid JSON with cron name and extras', () => {
    cronLog({ cron: 'check-alerts', event: 'ok', count: 5 });
    expect(logSpy).toHaveBeenCalledTimes(1);
    const line = logSpy.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(line) as Record<string, unknown>;
    expect(parsed).toMatchObject({
      level: 'info',
      msg: null,
      cron: 'check-alerts',
      event: 'ok',
      count: 5,
    });
    expect(typeof parsed.ts).toBe('string');
    expect(new Date(parsed.ts as string).toISOString()).toBe(parsed.ts);
  });

  it('cronLog includes optional msg', () => {
    cronLog({ cron: 'x', msg: 'started' });
    const parsed = JSON.parse(logSpy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect(parsed.msg).toBe('started');
  });

  it('cronError writes to console.error and serializes Error message', () => {
    const err = new Error('db connection refused');
    cronError({ cron: 'check-alerts' }, err);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(errorSpy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect(parsed.level).toBe('error');
    expect(parsed.error).toBe('db connection refused');
  });

  it('cronError handles non-Error throws', () => {
    cronError({ cron: 'x' }, 'string throw');
    const parsed = JSON.parse(errorSpy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect(parsed.error).toBe('string throw');
  });

  it('cronError handles null', () => {
    cronError({ cron: 'x' }, null);
    const parsed = JSON.parse(errorSpy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect(parsed.error).toBe('null');
  });
});
