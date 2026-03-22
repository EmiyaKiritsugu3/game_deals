import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './docs/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // If not supplied, CLI falls back to the .env file
    url: process.env.DATABASE_URL!,
  }
});