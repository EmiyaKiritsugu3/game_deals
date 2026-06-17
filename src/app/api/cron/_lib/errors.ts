import { NextResponse } from 'next/server';

const CRON_ERROR_CODES = {
  TIMEOUT: 'TIMEOUT',
  AUTH_FAILED: 'AUTH_FAILED',
  DB_ERROR: 'DB_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
} as const;

type CronErrorCode = keyof typeof CRON_ERROR_CODES;

export class CronError extends Error {
  readonly code: CronErrorCode;
  readonly statusCode: number;

  constructor(code: CronErrorCode, message: string, statusCode = 500) {
    super(message);
    this.name = 'CronError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function handleCronError(error: unknown): NextResponse {
  if (error instanceof CronError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      },
      { status: error.statusCode }
    );
  }

  const message = error instanceof Error ? error.message : 'Unknown error';
  return NextResponse.json(
    {
      error: message,
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    },
    { status: 500 }
  );
}
