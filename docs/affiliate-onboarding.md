# Affiliate Onboarding Guide

Step-by-step process to earn commission from outbound clicks. Placeholder IDs
(`gamedeals`, `gamedealsBR`) in `src/lib/affiliate-config.ts` are NOT recognized
by any real program — replace with approved IDs from each network.

## Pre-flight (1 hour)

1. **Site URL**: `https://gamedeals.com.br` (must be live, HTTPS, with real content)
2. **Traffic stats**: pull from Vercel Analytics — pageviews/mês, organic traffic %
3. **Site description**: "Aggregator de promoções de jogos (PC/Steam keys) com
   comparações de preço em tempo real, alertas customizados, e reviews agregados"
4. **Nicho**: gaming deals, coupons, free games, key comparison
5. **Domain email**: use `admin@gamedeals.com.br` (não gmail/hotmail — alguns rejeitam)

## Application order (fastest approval first)

Apply in this order — Eneba/Fanatical/Gamivo approve in 1-5 days and start
earning commission while the slower ones (CDKeys/CJ, 7-14d) finish review.

| # | Network | Platform | Time | Commission |
|---|---------|----------|------|------------|
| 1 | Eneba | Impact | 1-3d | 5-8% |
| 2 | Fanatical | Impact | 3-5d | 5% |
| 3 | Gamivo | In-house | 3-5d | 5-7% |
| 4 | Humble | PartnerStack | 5-7d | 5% |
| 5 | Kinguin | PartnerStack | 5-7d | 3-5% |
| 6 | Wingamestore | In-house | 3-5d | 5% |
| 7 | Gamebillet | In-house | 3-5d | 5% |
| 8 | Voidu | In-house | 3-5d | 5% |
| 9 | Gamesplanet | In-house | 5-7d | 5% |
| 10 | Indiegala | In-house | 3-5d | 5% |
| 11 | DLGamer | In-house | 5-7d | 5% |
| 12 | CDKeys | CJ Affiliate | 7-14d | 3-5% |

## Per-network application

### Eneba (Impact)
- URL: https://www.eneba.com/affiliate
- Sign up Impact account first: https://impact.com/
- "Apply to advertiser" → search "Eneba" → submit
- Approval email arrives in Impact dashboard
- Copy **Campaign ID** (Impact term) → `AFF_ENEBA_ID`
- Postback template: `https://gamedeals.com.br/api/postback?click_id={click_id}&order_id={order_id}&amount={amount}&currency={currency}`

### Fanatical (Impact)
- Same Impact account
- Apply to "Fanatical" campaign
- Copy Campaign ID → `AFF_FANATICAL_ID`
- Postback: same as Eneba (Impact uses unified template)

### Gamivo (In-house)
- URL: https://www.gamivo.com/affiliate
- Direct sign-up, no middleman
- Dashboard gives **Partner ID** → `AFF_GAMIVO_ID`
- Postback config: `https://gamedeals.com.br/api/postback?click_id={click_id}&order_id={order_id}&commission={commission}&currency={currency}`

### Humble Bundle (PartnerStack)
- URL: https://www.humblebundle.com/partners
- Sign up PartnerStack: https://signup.partnerstack.com/
- Apply to Humble campaign
- Two IDs given:
  - **Charity ID** (your "channel") → `AFF_HUMBLE_CHARITY`
  - **Partner ID** (your account) → `AFF_HUMBLE_PARTNER`
- Postback: `https://gamedeals.com.br/api/postback?click_id={click_id}&order_id={order_id}&amount={sale_amount}&currency={currency}`

### Kinguin (PartnerStack)
- Same PartnerStack account
- Apply to "Kinguin"
- Copy Partner ID → `AFF_KINGUIN_ID`
- Postback: same as Humble (PartnerStack unified)

### Wingamestore / Gamebillet / Voidu / Gamesplanet / Indiegala / DLGamer (In-house)
- Visit each `https://www.{site}/affiliate` or `/partners`
- Sign up individually
- Get **affiliate ID / ref code** → respective `AFF_*_ID` env var
- Postback: most use `https://gamedeals.com.br/api/postback?click_id={click_id}&order_id={order_id}&amount={amount}&currency={currency}`

### CDKeys (CJ Affiliate)
- URL: https://www.cj.com/
- More strict approval — needs 10K+ monthly pageviews typically
- Copy **PID** (publisher ID) → `AFF_CDKEYS_REF` (CDKeys uses `mw_aref` param)
- Postback: `https://gamedeals.com.br/api/postback?click_id={click_id}&order_id={order_id}&amount={sale_amount}&currency={currency}`

## Postback setup (S2S conversion tracking)

The `POSTBACK_SECRET` env var is a Bearer token sent in `Authorization` header.
Generate one:

```bash
openssl rand -hex 32
```

Paste result into `.env.local`:
```
POSTBACK_SECRET=<64-char-hex>
```

Configure the SAME value in each network dashboard as the postback "secret" /
"signature token". Routes accept it via `Authorization: Bearer <secret>` header
OR as `?secret=<secret>` query param (latter for networks that can't set headers).

## After approval (per network)

1. Email arrives → log in to network dashboard
2. Find "Affiliate IDs" / "Tracking" section
3. Copy ID → paste into `.env.local`:
   ```
   AFF_ENEBA_ID=12345
   AFF_FANATICAL_ID=67890
   ...
   ```
4. Find "Postback URL" / "S2S Tracking" section
5. Paste URL template (see per-network above)
6. Set postback secret = `POSTBACK_SECRET` value
7. Save. No restart needed — env read at click time (`process.env.AFF_*` factory).

## Verify it's working

```bash
# Local: simulate a click through /out endpoint
curl -i 'http://localhost:3000/out/103/cyberpunk-2077'

# Should 302 redirect to:
# https://www.eneba.com/...?af_id=<AFF_ENEBA_ID>&click_id=<uuid>

# After 1-2 days, check the admin dashboard:
open http://localhost:3000/admin/revenue
# Should show clicks + conversions
```

## Rejection handling

Common rejection reasons:
- **Insufficient traffic** (< 5K pageviews/mo): wait 1-2 months, re-apply
- **Adult/drug content**: site flagged incorrectly, contact support
- **Wrong niche**: "gaming deals" is approved niche — if rejected, ask reviewer
- **Domain age** (< 3 months): some networks want 6+ months. Use a long-lived domain

If rejected, **don't spam re-apply** — wait 30 days, improve traffic, retry.

## Tracking

The system tracks:
- `affiliate_clicks` table — every click, with UUID `click_id`
- `affiliate_conversions` table — postback inserts (commission, order_id)

Admin dashboard at `/admin/revenue` (requires `role: 'admin'` on profile).

Promote yourself:
```sql
UPDATE profiles SET role = 'admin' WHERE user_id = '<your-uuid>';
```

## Checklist

- [ ] All 12 networks applied (use `scripts/affiliate-onboarding.sh` to scaffold `.env.local`)
- [ ] `POSTBACK_SECRET` generated and set in `.env.local`
- [ ] Same `POSTBACK_SECRET` configured in each dashboard postback section
- [ ] Postback URLs configured per-network
- [ ] Test click via `curl -i /out/<storeId>/<slug>`
- [ ] Verify redirect URL contains real `AFF_*_ID` (not placeholder)
- [ ] Trigger test conversion (some networks offer "test postback" button)
- [ ] Verify `affiliate_conversions` row appears in DB
- [ ] Promote profile to `admin` role
- [ ] Open `/admin/revenue` — see clicks + conversions
