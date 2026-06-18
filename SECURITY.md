# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |
| < main  | :x:                |

## Reporting a Vulnerability

**Do not open a public issue.** Instead, email [inamarjunior2@gmail.com](mailto:inamarjunior2@gmail.com) with details.

You can expect:
- Acknowledgment within 48 hours
- Status update within 5 business days
- Disclosure timeline coordinated with you

## Scope

Security-relevant issues include:
- Authentication bypass or session hijacking
- Data exposure (user emails, wishlists, price alerts)
- SQL injection via Drizzle queries
- Server-side request forgery (SSRF) via external API calls
- Environment variable / secret exposure
- Cron endpoint abuse (CRON_SECRET bypass)

## Out of Scope

- Issues requiring physical access to the user's device
- Social engineering attacks
- Rate limiting bypasses that don't result in data exposure

## Practices

- **Dependencies**: Audited weekly via `pnpm audit` + Semgrep supply chain scans
- **Secrets**: All credentials in environment variables, never committed
- **Auth**: Supabase SSR with RLS policies on all user-data tables
- **Cron**: All `/api/cron/*` endpoints protected by `CRON_SECRET` header
- **Redirects**: `/out/` affiliate route validates store ID allowlist + game slug regex
