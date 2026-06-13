# Learnings - service_role Key Leak Investigation

## Key Not Rotated
Commit 135e2ed removed `seed_tester.js` (hardcoded key) and moved it to `.env.local`, but **did not rotate the key itself**. The key `sb_secret_oJ5NVQZWXUegZmlFFanIcg_nxdv90wD` is still active as of 2026-06-12.

## Git History Exposure
The key exists in commit `c710732` (initial migration). Removing the file in a later commit still leaves the key exposed in git history. Anyone with repo access can retrieve it via `git show c710732:src/scripts/seed_tester.js`.

## Verification Method
A simple `curl` to `https://<project>.supabase.co/rest/v1/` with the leaked key as both `apikey` and Bearer token returning HTTP 200 confirms the key is still valid.

## Remediation Gap
The fix was partial - env var extraction is correct practice, but rotation in Supabase dashboard is the missing step. Check `.env.local` also has the DATABASE_URL password which may also be exposed.
