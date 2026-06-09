# ADR-001: Tech Stack — Next.js 14, TypeScript, CSS Modules, Supabase

**Status**: Aceito
**Data**: 2026-06-09
**Autor**: EmiyaKiritsugu3

---

## Contexto

O GameDeals é um agregador de preços de jogos (estilo gg.deals/IsThereAnyDeal) com links de afiliado, focado no mercado brasileiro. Precisamos de uma stack que suporte:

- SSR/SSG para SEO (crítico para afiliados)
- Performance e Core Web Vitals
- Type safety end-to-end
- Estilização customizada (glassmorphism, dark theme premium)
- Backend gerenciado (auth, database, realtime) sem ops overhead
- Deploy simples e escalável

## Decisão

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| **Framework** | Next.js 14 (App Router) | Server Components por padrão, SSR nativo, streaming, SEO-first |
| **Language** | TypeScript (strict) | Tipagem obrigatória; interfaces centralizadas em `src/services/api.ts` |
| **Styling** | CSS Modules (Vanilla CSS) | **Sem Tailwind**. Controle total sobre design tokens, glassmorphism, animações customizadas |
| **State (Global)** | Zustand | Leve, TypeScript-first, persistência nativa (localStorage → Supabase sync) |
| **State (Server)** | SWR | Revalidação automática, dedup, cache client-side para search/real-time |
| **Auth/DB/Realtime** | Supabase | PostgreSQL gerenciado, Auth social (Google/Discord), Row Level Security, Edge Functions |
| **Charts** | Recharts | Gráficos de histórico de preço no Sidebar Modal |
| **Icons** | Lucide React | Consistência visual, tree-shaking, sem SVGs crus |
| **Animations** | Framer Motion | Page transitions, modal entrance, staggered animations |
| **Deploy** | Vercel | Integração nativa Next.js, Edge Network, Cron Jobs, Analytics |
| **Analytics** | @vercel/analytics | Privacy-friendly, zero config |

## Consequências

### Positivas
- **SEO-first**: SSR/ISR nativo garante indexação de páginas de jogos/deals
- **Type safety**: Contratos de API tipados entre frontend e serviços
- **Design system próprio**: CSS Modules + variáveis CSS (`globals.css`) = design tokens consistentes sem dependência externa
- **Zero ops backend**: Supabase gerencia auth, DB, realtime, storage, edge functions
- **Deploy trivial**: `git push` → Vercel build + deploy automático
- **Performance**: Server Components reduzem JS bundle; dynamic imports para charts/modais pesados

### Negativas / Trade-offs
- **CSS Modules**: Mais verboso que Tailwind; requer disciplina para design tokens
- **Supabase vendor lock-in**: Migração futura exigiria effort (mas PostgreSQL padrão mitiga)
- **Next.js 14 App Router**: Curva de aprendizado (Server Components, Suspense, streaming)
- **Bundle size**: Framer Motion + Recharts + Lucide adicionam peso; mitigado com dynamic imports

### Riscos Mitigados
- **API externa instável (CheapShark)**: `force-dynamic` na Home + fallback data (`fallbackDeals.ts`) + try/catch em `api.ts`
- **Build falha por API down**: `dynamic = 'force-dynamic'` evita build-time data fetching

---

## Referências
- [Tech Stack Dictionary](../tech_stack_dictionary.md)
- [Project Architecture Analysis](../project_architecture_analysis.md)