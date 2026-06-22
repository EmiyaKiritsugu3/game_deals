# Issues - service_role Key Leak Investigation

## CRITICAL: service_role Key Not Rotated
- Leaked key `sb_secret_oJ5NVQZWXUegZmlFFanIcg_nxdv90wD` is still active
- HTTP 200 when authenticating against Supabase REST API
- File removed but key never rotated in Supabase dashboard
- Fix: Rotate in Supabase Dashboard > Project Settings > API > service_role key

## Secondary: DATABASE_URL Password
- `.env.local` contains `DATABASE_URL` with password `2wzyGOH4JdzEbDyx`
- If this was ever committed or exposed, the DB password should also be rotated
- Need to verify if this password leaked alongside the service_role key

## .env.local Not Gitignored
- `.env.local` is not listed in `.gitignore` (checked first 30 lines)
- If `NEXT_PUBLIC_SUPABASE_URL` is the real project URL, this is fine for local dev
- But the service_role key should NEVER be in `.env.local` - it should be a server-only env var
