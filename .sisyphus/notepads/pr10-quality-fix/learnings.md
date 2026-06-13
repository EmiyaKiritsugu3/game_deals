1: ## PR10 Quality Fix - Learnings
2: 
3: ### 2026-06-12: Store favicon CDN remotePatterns
4: 
5: - Added 23 unique hostnames from `STORE_FAVICON_MAP` (`src/constants/stores.ts`) to `next.config.ts` `images.remotePatterns`
6: - Sorted alphabetically for readability
7: - Added section comments to separate existing patterns from new store favicon entries
8: - Build passes with `pnpm build`
9: - Hostnames include: games.indiegala.com, microsoft.com, store.epicgames.com, www.amazon.com, www.cdkeys.com, www.dlgamer.com, www.eneba.com, www.epic.com, www.fanatical.com, www.gamebillet.com, www.gamersgate.com, www.gamesplanet.com, www.gamivo.com, www.gog.com, www.greenmangaming.com, www.humblebundle.com, www.indiegamestand.com, www.kinguin.net, www.nuuvem.com, www.origin.com, www.steampowered.com, www.voidu.com, www.wingamestore.com
10: - All use `pathname: '/**'` to allow any path (favicons and potentially other assets)
11: 
12: ### 2026-06-12: T11 - <img> → <Image unoptimized>
13: 
14: - **Navbar.tsx**: Converted user avatar `<img>` to `<Image unoptimized>` (28x28, arbitrary URL from Google/GitHub/Discord)
15:   - Added `import Image from 'next/image'`
16:   - Removed `// biome-ignore lint/performance/noImgElement: user avatar`
17: - **HeroSection.tsx**: Converted store logo `<img>` in glass panel to `<Image unoptimized>` (16x16, favicon CDN)
18:   - Removed `// biome-ignore lint/performance/noImgElement: store logo in hero`
19: - **Skipped** (T10 territory): DealRow store logo, HeroSection matrix bg, Navbar search thumbnails
20: - Build + lint + tsc all pass

### 2026-06-12: T10 - <img> → <Image> (optimized, known CDNs)

- **HeroSection.tsx**: Converted matrix bg `<img>` to `<Image>` with `alt=""`, `aria-hidden={true}`, explicit `width={200} height={130}` (matches CSS flex dimensions)
- **bundles/page.tsx**: Converted game thumb `<img>` to `<Image>` with `width={120} height={56}` (matches CSS). Added `import Image from 'next/image'`. Store icon `<img>` stays for T11.
- **collections/[slug]/page.tsx**: Converted game thumb `<img>` to `<Image>` with `width={120} height={56}`. Added `import Image from 'next/image'`.
- **DealRow.tsx**, **game/[id]/page.tsx**, **@modal/(.)game/[id]/page.tsx**: Game thumbs already used `<Image>` — no changes needed.
- Removed `// biome-ignore lint/performance/noImgElement` from all converted tags.
- Remaining `noImgElement` comments are store logos/favicons (T11), and Navbar search thumbnails (out of scope).
- Both `cdn.cloudflare.steamstatic.com` and `img.cheapshark.com` already in `next.config.ts` remotePatterns (from T9).
- Build + lint + tsc all pass.
