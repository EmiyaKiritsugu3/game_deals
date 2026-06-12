import { resolve } from 'node:path';
import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: resolve(__dirname, '.env.local') });

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema/*',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
