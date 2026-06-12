import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error('DATABASE_URL not set');
const queryClient = postgres(dbUrl);
export const db = drizzle({ client: queryClient });
