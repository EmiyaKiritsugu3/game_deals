/**
 * Structured JSON logger for cron routes.
 * Vercel captures stdout; JSON lines parse cleanly in log drains.
 * No deps — ponytail: pino would add 30KB+ for marginal benefit at this scale.
 */

export type CronLogLevel = 'info' | 'warn' | 'error';

export interface CronLogContext {
  cron: string;
  [key: string]: unknown;
}

function emit(level: CronLogLevel, context: CronLogContext, msg?: string): void {
  const line = JSON.stringify({
    level,
    msg: msg ?? null,
    ts: new Date().toISOString(),
    ...context,
  });
  if (level === 'error') console.error(line);
  else console.log(line);
}

export function cronLog(context: CronLogContext): void {
  emit('info', context);
}

export function cronWarn(context: CronLogContext, msg?: string): void {
  emit('warn', context, msg);
}

export function cronError(context: CronLogContext, err: unknown, msg?: string): void {
  emit('error', { ...context, error: err instanceof Error ? err.message : String(err) }, msg);
}
