# ADR-008: Routing Pattern — Intercepting Routes para Sidebar Modal

**Status**: Aceito
**Data**: 2026-06-09
**Autor**: EmiyaKiritsugu3

---

## Contexto

O GameDeals usa um **Sidebar Modal** para exibir detalhes do jogo (preços, histórico, metadados, HLTB, DRM badges) sem navegar para fora da Home/Listing page.

Requisitos:
- **Desktop**: Sidebar desliza da direita (30-40% viewport), página anterior visível atrás (backdrop blur)
- **Mobile**: Modal full-screen (bottom sheet style)
- **Deep linking**: URL reflete jogo aberto (`/game/12345` ou interceptada)
- **Refresh/F5**: Deve renderizar página standalone completa (SSR/SEO)
- **Navegação**: Back/Forward do browser fecha sidebar e volta ao estado anterior
- **Performance**: Carregamento lazy do modal pesado (charts, imagens, tabs)

## Decisão

**Next.js Intercepting Routes + Parallel Routes**

### Estrutura de Arquivos

```
src/app/
├── @modal/                    # Parallel Route (slot)
│   └── (.)game/
│       └── [id]/
│           └── page.tsx       # Sidebar Modal content (Client Component)
├── game/
│   └── [id]/
│       └── page.tsx           # Standalone page (Server Component) — F5 target
├── page.tsx                   # Home (Server Component)
└── layout.tsx                 # Root layout com <@modal />
```

### Root Layout (`src/app/layout.tsx`)

```tsx
export default function RootLayout({ children, modal }: { children: React.ReactNode; modal: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        {modal}  {/* Parallel route slot */}
      </body>
    </html>
  );
}
```

### Intercepting Route (`src/app/@modal/(.)game/[id]/page.tsx`)

```tsx
'use client'; // Necessário para Framer Motion, interatividade

import { SidebarModal } from '@/components/SidebarModal';

export default function ModalGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SidebarModal gameId={id} onClose={() => router.back()} />;
}
```

### Standalone Page (`src/app/game/[id]/page.tsx`)

```tsx
// Server Component — SSR para SEO, F5, share links
import { GameDetailPage } from '@/components/GameDetailPage';
import { getGame } from '@/services/api';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = await getGame(id);
  return { title: `${game.title} - GameDeals`, ... };
}

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = await getGame(id);
  return <GameDetailPage game={game} />;
}
```

### Link no DealRow (Home/Listing)

```tsx
// components/DealRow.tsx
import Link from 'next/link';

<Link
  href={`/game/${deal.gameId}`}           // Target: standalone page
  onClick={(e) => {
    e.preventDefault();                   // Prevent default navigation
    router.push(`/game/${deal.gameId}`);  // Triggers intercepting route
  }}
>
  <GameCard game={deal} />
</Link>
```

### Comportamento Resultante

| Ação | Comportamento |
|------|---------------|
| Click em deal na Home | Abre `@modal/(.)game/[id]` → Sidebar desliza; URL muda para `/game/12345` |
| F5 / Direct access `/game/12345` | Renderiza `game/[id]/page.tsx` (standalone, SSR) |
| Back button (browser) | Fecha sidebar; volta para Home (history preserved) |
| Close button (X no modal) | `router.back()` → fecha intercepting route |
| Share link | `/game/12345` abre standalone page (SEO, OG tags) |

## Consequências

### Positivas
- **UX Premium**: Sidebar mantém contexto (Home scroll position, filters) — igual gg.deals/Steam
- **SEO Perfeito**: Standalone page é SSR com metadata completa; crawlers veem conteúdo
- **Progressive Enhancement**: JS disabled → direct link funciona (standalone page)
- **Performance**: Modal é Client Component lazy-loaded (`next/dynamic`); standalone é Server Component
- **Type Safety**: `params` tipados em ambas as rotas

### Negativas / Trade-offs
- **Complexidade mental**: Intercepting + Parallel routes são patterns avançados do Next.js 13+
- **Hidratação**: Modal client-side precisa hidratar dados já fetchados no server (evitar double-fetch)
- **Mobile UX**: Sidebar → full-screen modal requer CSS condicional + focus trap
- **Analytics**: Page view duplo potencial (modal + standalone); filtrar por `referrer` ou `document.referrer`

### Implementação Atual
- `src/app/@modal/(.)game/[id]/page.tsx` — Sidebar Modal entry
- `src/app/game/[id]/page.tsx` — Standalone page
- `src/components/SidebarModal.tsx` — Modal content (tabs: Prices, History, Info, HLTB, Reviews)
- `src/components/DealRow.tsx` — Link com `router.push` interception

---

## Referências
- [Tech Stack Dictionary](../tech_stack_dictionary.md#-advanced-routing-patterns)
- [Project Architecture Analysis](../project_architecture_analysis.md)
- Next.js Docs: [Intercepting Routes](https://nextjs.org/docs/app/building-your-application/routing/intercepting-routes) | [Parallel Routes](https://nextjs.org/docs/app/building-your-application/routing/parallel-routes)