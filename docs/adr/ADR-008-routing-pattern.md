# ADR-008: Routing Pattern — App Router (Next.js 16) + Nuqs + Server Actions

**Status**: Aceito
**Data**: 2026-06-09 (Atualizado 2026-06-10)
**Autor**: EmiyaKiritsugu3

---

## Contexto

Navegação e URL state management no GameDeals: SSR/ISR para SEO, parámetros de URL para search/filters, modais como rotas hijack, transições de página.

---

## Decisão

### App Router (Next.js 16)

**Layout hierarchy**:
```
app/
├── (public)/           # Landing, about, legal
│   └── page.tsx
├── (main)/             # Authenticated experience
│   ├── layout.tsx      # Navbar + Sidebar + Auth Guard
│   ├── page.tsx        # Main feed (Historical Lows, Ending Soon, Hero)
│   ├── deals/
│   │   ├── page.tsx    # Deal listing (SSR + infinite scroll)
│   │   └── loading.tsx # Skeleton loading
│   ├── search/
│   │   └── page.tsx    # Search results
│   ├── game/
│   │   └── [slug]/
│   │       └── page.tsx  # Server Component route
│   └── user/
│       └── [id]/
│           ├── page.tsx    # Profile page
│           └── playlists/page.tsx
├── out/                # Affiliate redirect
│   └── [storeId]/
│       └── [gameSlug]/
│           └── route.ts    # Edge Route Handler
├── api/                # API routes para Supabase integration
│   └── search/route.ts
├── auth/
│   └── callback/route.ts   # OAuth callback
└── globals.css
```

### URL State Management: Nuqs

```typescript
'use client';
import { useQueryState } from 'nuqs';

function DealsFilter() {
  const [sort, setSort] = useQueryState('sort', { defaultValue: 'dealRating' });
  const [page, setPage] = useQueryState('page', { defaultValue: 1, parse: Number });
  const [store, setStore] = useQueryState('store');

  return <FilterBar sort={sort} onChangeSort={setSort} />;
}
```

### Modal como Route Intercept

```typescript
// src/app/game/[slug]/page.tsx (full page)
export default async function GamePage({ params }: { params: { slug: string } }) {
  const game = await getGame(params.slug);
  return <GameDetail game={game} />;
}

// src/app/@modal/game/[slug]/page.tsx (modal intercept)
export default async function GameModal({ params }: { params: { slug: string } }) {
  return <SidebarModal>
    <GamePanel slug={params.slug} />
  </SidebarModal>;
}
```

### Server Actions para Form Submissions

```typescript
'use server';
export async function createPlaylistAction(formData: FormData) {
  // Zod validation + Drizzle insert + revalidation
}
```

---

## Consequências

### Positivas
- **SEO máximo**: Server Components + SSR para todas páginas públicas
- **URL state compartilhável**: Filters, sort, page via `nuqs` (type-safe, sync com URL)
- **Modais SEO-friendly**: Rota intercept (`/game/[slug]`) + full page server-rendered
- **Progressive Enhancement**: Server Actions funcionam sem JS
- **Edge redirects**: `/out/*` routes no Edge Runtime para mínimo overhead

### Negativas
- **Parallel Routes complexity**: Intercepting modais adicionam complexidade de build (mitigado: pattern claro em `@modal`)
- **Nuqs + Server Components**: URL state só funciona em Client Components (mitigado: wrapper fine-grained)
- **Server Actions + forms**: Loading states precisam de `useFormStatus` ou TanStack Query

---

## Referências
- [Next.js 16 App Router Docs](https://nextjs.org/docs/app)
- [Nuqs GitHub](https://github.com/47ng/nuqs) — URL state management
- [Next.js 16 Parallel Routes](https://nextjs.org/docs/app/building-your-application/routing/parallel-routes)
- [ADR-006: Affiliate Monetization](ADR-006-affiliate-monetization.md) — `/out` route handler