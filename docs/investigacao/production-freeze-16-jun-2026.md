# Investigação: Site Congelado (Não Responsivo)

**Data**: 16 de Junho de 2026
**Branch**: `hotfix/deals-loading-spinner`
**PR**: #19
**Status**: ✅ CORRIGIDO — `else logout()` → `else setUser(null)` em `useAuthSubscription.ts`

⚠️ **LIÇÃO APRENDIDA**: `else logout()` em callback `onAuthStateChange` causa loop infinito (`logout()` → `signOut()` → `SIGNED_OUT` → `onAuthStateChange` → repete). JAMAIS usar `logout()` dentro do callback de `onAuthStateChange`. Usar `setUser(null)` para apenas limpar estado local.

---

## Histórico de Sintomas

### 1º Relato — "Deals não carregam, fica carregando infinitamente"
- Spinner centralizado "Scanning for discounts..."
- Nada é clicável
- F12 não funciona

### 2º Relato — "A página carrega mas não é responsiva, não consigo clicar em nada"
- Após User-Agent fix (PR #17), página RENDERIZA com dados reais
- Mas JS não hydrata — event listeners nunca attacham
- CookieBanner (Aceitar/Rejeitar), Navbar, GameCards — tudo congelado
- F12 continua não funcionando

---

## Tentativas Realizadas

### Tentativa 1: Suspense Boundaries removidos
**Arquivo**: `src/app/page.tsx`
**Commit**: `79b0c4e`
**O que fez**: Removeu `<Suspense>` que envolvia seções da página (suspeita de conflito com ISR)
**Resultado**: ❌ Não resolveu

### Tentativa 2: Imagens com `unoptimized`
**Arquivo**: `next.config.ts`, `GameCard.tsx`, `DealRow.tsx`, etc.
**Commit**: `33424a6`
**O que fez**: Adicionou `unoptimized` em imagens de CDNs externas
**Resultado**: ❌ Não resolveu

### Tentativa 3: User-Agent header no CheapShark API
**Arquivos**: `api.ts`, `game-enrichment.ts`, `ingest.ts`, `fetch-helpers.ts`, `search.ts`
**PR**: #17
**O que fez**: Adicionou `User-Agent: GameDeals/1.0` em todas as chamadas fetch pro CheapShark
**Resultado**: ⚠️ Deals passaram a carregar (429 resolvido), mas página continuou CONGELADA

### Tentativa 4: AbortController timeout nos fetches
**Arquivos**: `api.ts`, `fetch-helpers.ts`, `ingest.ts`, `search.ts`
**Commit**: `46e4f7b`
**O que fez**: Adicionou `AbortController` + 8s timeout em todas as 7 chamadas fetch
**Motivação**: Se CheapShark hangar (TCP stall, rate-limit), o fetch nunca resolve → `Promise.all` no `page.tsx` nunca resolve → spinner eterno
**Resultado**: ⚠️ Não testado em produção isoladamente (PR não mergeada)

### Tentativa 5: `<Suspense>` escopado + fallback
**Arquivo**: `src/app/layout.tsx`
**Commit**: `3a0cd22`
**O que fez**: Removeu `<Suspense>` amplo sem fallback que envolvia TODO o body. Em vez disso, escopou `<Suspense fallback={...}>` só ao `<Navbar>` (por causa do `SearchBox` que usa `useQueryState` do nuqs).
**Resultado**: 🔄 Aguardando teste na preview deploy

### Tentativa 6: `error.tsx`
**Arquivo**: `src/app/error.tsx` (criado)
**Commit**: `46e4f7b`
**O que fez**: Adicionou error boundary de fallback quando server function timeout
**Resultado**: ⚠️ Não testado

---

## Evidências Coletadas

### Curl do HTML de produção (PR #17)
```html
<template data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING"></template>
```
- **O que significa**: Uma parte da árvore de componentes não pôde ser renderizada no servidor e foi adiada para renderização no cliente
- **Presente em**: HTML inicial da página (`index.html` no streaming RSC)
- **Impacto**: O React precisa renderizar essa parte no cliente. Se o JS falhar, a UI permanece congelada

### RSC Payload
- **Deal data**: PRESENTE no RSC payload (28 DealRow com dados reais: Curved Space, Madden NFL 22, etc.)
- **Dummy data**: AUSENTE (0 matches The Witcher/Cyberpunk/Elden Ring)
- **Spinner**: PRESENTE no RSC como fallback do Suspense ("Scanning for discounts...")
- **Link "404 — Page Not Found"**: PRESENTE (é o `not-found.tsx`, incluído no bundle do app shell)

### CheapShark API
- **Com User-Agent**: HTTP 200 com dados reais ✅
- **Sem User-Agent**: HTTP 429 (Cloudflare blocking) ❌
- **Timeout**: Sem timeout configurado → pode hangar indefinidamente

---

### 3º Relato — "Botões do site não respondem" (local, após PR #19)
- Após PR #19, página RODA localmente
- Mas ao acessar no navegador, conteúdo principal é substituído por "Something went wrong"
- Navbar e CookieBanner renderizam, mas página parece quebrada
- Causa inicial identificada: `next/image` THROWA erro para hostnames não configurados → `ErrorBoundaryHandler` captura → renderiza `error.tsx`
- **CAUSA RAIZ REAL descoberta depois**: Loop infinito em `useAuthSubscription.ts` → `else logout()` chama `signOut()` → dispara `SIGNED_OUT` event → `onAuthStateChange` repete → loop infinito → JS trava → site congela

---

## 4º Descoberta — CAUSA RAIZ REAL: Loop Infinito de Auth (16 Jun 2026)

**Arquivo**: `src/hooks/useAuthSubscription.ts:12-15`

**Código problemático**:
```tsx
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) setUser(session.user);
  else logout();  // ❌ LOOP INFINITO
});
```

**Fluxo do loop**:
1. `onAuthStateChange` dispara com `session: null` (usuário não logado)
2. Hook chama `logout()`
3. `logout()` em `authStore` faz: `supabase.auth.signOut()` → `set({user:null, isLoggedIn:false})`
4. `signOut()` limpa cookies → Supabase dispara `onAuthStateChange` com `SIGNED_OUT` event
5. Volta ao passo 1 → **LOOP INFINITO** → event loop travado → site congela

**Validação Context7**: Supabase `@supabase/ssr` docs confirmam que `signOut()` dispara evento `SIGNED_OUT`, que chama `onAuthStateChange` novamente. Isto cria o loop: `onAuthStateChange → logout() → signOut() → SIGNED_OUT → onAuthStateChange → ...`

**Correção**:
```tsx
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) setUser(session.user);
  else setUser(null);  // ✅ Apenas limpa estado local, sem disparar signOut
});
```

**No branch ANTIGO (`fix/p0-critical-data-integrity-and-alerts`)**, o código era inline no Navbar e NÃO chamava `logout()`:
```tsx
// ANTIGO (Navbar.tsx useEffect):
supabase.auth.onAuthStateChange((_event, session) => {
  setUser(session?.user ?? null);  // ✅ SÓ limpa estado, SEM signOut
});
```

---

## Validação Context7 — NuqsAdapter (DESCARTADO como causa)

`NuqsAdapter` (`nuqs/adapters/next/app`) **já cria seu próprio `<Suspense>` internamente** para `NavigationSpy`:

```tsx
export function NuqsAdapter({ children, ...adapterProps }) {
  return createElement(Provider, {
    children: [
      createElement(Suspense, {
        key: 'nuqs-adapter-suspense-navspy',
        children: createElement(NavigationSpy)
      }),
      children
    ]
  })
}
```

A estrutura atual (NuqsAdapter fora de Suspense externo) está **CORRETA** — o adapter já gerencia seu próprio Suspense boundary internamente. Não causa BAILOUT.

---

## Tentativas Realizadas

### Tentativa 6: AbortController timeout nos fetches + Suspense escopado + error.tsx
**Arquivos**: `api.ts`, `fetch-helpers.ts`, `ingest.ts`, `search.ts`, `layout.tsx`, `error.tsx` (novo)
**PR**: #19 (commits 46e4f7b + 3a0cd22)
**Teste local**: Servidor rodou, HTTP 200, RSC payload sem BAILOUT
**Resultado**: ❌ Página não carregava — `next/image` erro de hostname derrubava o conteúdo

### Tentativa 7: Adicionar hostnames faltantes no next.config.ts
**Arquivo**: `next.config.ts`
**Commit**: `79e9a1e` (no branch hotfix/deals-loading-spinner)
**O que fez**: Adicionou `cdn1.epicgames.com`, `cdn2.epicgames.com`, `cdn3.epicgames.com`, `images.gog-statics.com`, `images.greenmangaming.com` ao `remotePatterns`
**Resultado**: ✅ Página carrega com todos os dados. 1542 DealRow, HeroSection, Freebies, HistoricalLows, EndingSoon — tudo presente. Zero erros.

---


**Local**: `src/app/layout.tsx:116-128`
**Código problemático**:
```tsx
<Suspense>   ← SEM fallback!
  <NuqsAdapter>
    <ReactQueryProvider>
      <Navbar serverUser={null} />    ← SearchBox usa useQueryState
      <SyncManager />
      {children}                        ← page.tsx async
      {modal}
      <Analytics />
      <SpeedInsights />
      <CookieBanner />
    </ReactQueryProvider>
  </NuqsAdapter>
</Suspense>
```

**Problemas**:
1. **SearchBox** (`src/components/navbar/SearchBox.tsx`) usa `useQueryState` do nuqs. `useQueryState` precisa de um `<Suspense>` com fallback — sem fallback, o React bails out (BAILOUT_TO_CLIENT_SIDE_RENDERING)
2. **Sem fallback**: Durante carregamento assíncrono (page.tsx await), React não tem o que mostrar → renderiza null (nada aparece)
3. **Suspense amplo demais**: CookieBanner, Navbar, SyncManager — tudo suspenso junto com a página. Nada renderiza até page.tsx resolver
4. **Conflicto com loading.tsx**: O `loading.tsx` cria um Suspense boundary automático ao redor de `{children}`, mas o outer Suspense (layout) interfere

**BAILOUT_TO_CLIENT_SIDE_RENDERING**:
- Acontece quando React precisa renderizar um componente que usa hooks/APIs que não estão disponíveis no servidor (ex: `useSearchParams()`, `useQueryState()`)
- O React adia a renderização para o cliente
- Sem um `<Suspense>` com `fallback` adequado, o servidor não consegue gerar HTML para a área afetada
- Cliente precisa executar JS para completar a renderização
- **Se o JS falha durante hydration → página congelada**

### Causa 3: Hostnames de CDN de imagens não configurados (TERTIARY — EXPOSED BY FIX)
**Local**: `next.config.ts:7-41`
**Código problemático**: `images.remotePatterns` não inclui `cdn1.epicgames.com`, `images.gog-statics.com`, `images.greenmangaming.com`

**Contexto**:
- CheapShark retorna deals com imagens de várias lojas (Steam, Epic, GOG, GreenManGaming, etc.)
- Cada loja usa seu próprio CDN para imagens
- `next/image` valida o hostname contra `remotePatterns` — se não encontrado, THROWA erro
- Este erro era mascarado em produção pelo BAILOUT (página já estava congelada antes de chegar aqui)
- Após PR #19 (Suspense fix), o erro foi exposto: página hydrata, `next/image` tenta renderizar imagem do CDN desconhecido → THROW → ErrorBoundaryHandler → error.tsx

**Hostnames adicionados**:
- `cdn1.epicgames.com`, `cdn2.epicgames.com`, `cdn3.epicgames.com` — Epic Games Store CDN
- `images.gog-statics.com` — GOG
- `images.greenmangaming.com` — GreenManGaming

**Por que resolve**: next/image consegue validar e servir as imagens desses CDNs sem lançar erro.

### Causa 2: Fetch sem timeout (SECONDARY)
**Local**: `src/services/api.ts:62`
**Código problemático**:
```tsx
const res = await fetch(url, { headers, next: { revalidate: 3600 } });
// Sem AbortController! Se o fetch hangar, a Promise nunca resolve.
```

**Impacto**:
- `page.tsx` usa `Promise.all([5x getDeals()])`
- Se QUALQUER uma das 5 chamadas hangar (TCP stall, rate-limit, Cloudflare), TODAS bloqueiam
- `loading.tsx` mostra spinner eterno
- Se o serverless function timeout bater (10s Hobby, 60s Pro), a resposta HTTP é cortada no meio do streaming
- Sem `error.tsx`, não há fallback → cliente vê spinner permanente

---

## Fixes no PR #19

*(Correções já aplicadas no PR #19 — mas NÃO resolvem a causa raiz do freeze)*

### Fix 1: Scope Suspense to Navbar only (layout.tsx)
```tsx
<NuqsAdapter>
  <ReactQueryProvider>
    <Suspense fallback={<nav style={{height:60, borderBottom:'1px solid hsl(var(--border))'}} />}>
      <Navbar serverUser={null} />
    </Suspense>
    <SyncManager />
    {children}   ← loading.tsx cuida do fallback
    {modal}
    <Analytics />
    <SpeedInsights />
    <CookieBanner />   ← renderiza imediatamente, não fica suspenso
  </ReactQueryProvider>
</NuqsAdapter>
```

**Por que resolve**:
1. Navbar fica com Suspense + fallback → SearchBox não causa BAILOUT
2. CookieBanner, SyncManager, Analytics estão FORA do Suspense → renderizam imediatamente
3. `{children}` usa `loading.tsx` separadamente (Next.js automatic Suspense boundary)
4. Fallback do Navbar é um placeholder simples (nav 60px com mesma cor de fundo)

### Fix 2: AbortController timeout (api.ts, fetch-helpers.ts, ingest.ts, search.ts)
```tsx
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 8000);
const res = await fetch(url, {
  headers,
  signal: controller.signal,
  next: { revalidate: 3600 },
});
clearTimeout(timeout);
```

**Por que resolve**:
- Fetch nunca hanga mais que 8s
- Timeout → throw (AbortError) → cai no catch → retorna fallbackDeals
- 5 chamadas paralelas no page.tsx: se uma timeout, as outras continuam
- Página renderiza conteúdo parcial em vez de spinner eterno

### Fix 3: error.tsx
**Código**: Error boundary client-side com botão "Try again"

**Por que resolve**:
- Se server function timeout, Next.js mostra erro default (tela branca)
- Com error.tsx, o usuário vê mensagem amigável + botão de retry
- Usa `'use client'` + `useEffect` pra logar o erro

---

## Novos Fixes Necessários (Pós-PR #19 — Causa Raiz do Freeze)

### Fix 4: Corrigir Loop Infinito de Auth
**Arquivo**: `src/hooks/useAuthSubscription.ts:14`
```tsx
// ANTES:
else logout();

// DEPOIS:
else setUser(null);
```

### Fix 5: Singleton Centralizado de Cliente Supabase
**Novo arquivo**: `src/lib/supabase-browser.ts`
- Função `getBrowserClient()` lazy-init singleton
- Substitui 4 instâncias separadas por 1 única instância

### Fix 6: Migrar Consumers para Singleton
| Arquivo | Antes | Depois |
|---------|-------|--------|
| `src/store/authStore.ts` | `getSupabase()` local | `getBrowserClient()` |
| `src/components/SyncManager.tsx` | `getSupabase()` local | `getBrowserClient()` |
| `src/hooks/useAuthSubscription.ts` | `createClient()` | `getBrowserClient()` |
| `src/components/AuthModal.tsx` | `createClient()` módulo | `getBrowserClient()` em funções |

### Fix 7: `unoptimized` em Imagens Vulneráveis
| Arquivo | Componente | Mudança |
|---------|------------|---------|
| `src/components/Freebies.tsx:27` | `<Image>` | Adicionar `unoptimized` |
| `src/components/hero/MatrixBackground.tsx:16` | `<Image>` | Adicionar `unoptimized` |

### Fix 8: try/catch em `getStores()`
**Arquivo**: `src/services/api.ts:79-103`
```tsx
try {
  // ... código existente ...
} catch {
  return { '101': 'CDKeys', '102': 'Kinguin', '103': 'Eneba', '104': 'Gamivo' };
}
```

## Anomalias Encontradas (não relacionadas)

### Playwright crasha em produção
- Comando `page.content()` sempre crasha com "Target page, context or browser has been closed"
- Ocorre em produção e em localhost
- Possível causa: Chromium headless sem suporte oficial para a distro
- Workaround: Usar `curl` para verificar HTML estático

### Cron jobs no GitHub Actions podem contribuir para rate-limit
**Arquivo**: `.github/workflows/cron.yml`
```yaml
- cron: '0 */4 * * *'   # ingest-prices a cada 4h
- cron: '0 2 * * *'      # reindex-typesense diário
- cron: '0 * * * *'      # check-alerts a cada hora
```

Os CRONs fazem requisições internas para endpoints Vercel (`/api/cron/*`), que por sua vez fazem fetch para CheapShark. Mesmo IP da Vercel fazendo múltiplos acessos → pode triggerar rate-limit Cloudflare.

---

## Checklist de Verificação (PR #19 + Correções Causa Raiz)

- [x] Biome: sem erros
- [x] TSC: sem erros
- [x] 215/215 testes passando
- [x] Build: 22/22 páginas ✅ (16 Jun 2026 — `pnpm build` limpo, 3.0s compilação, 4.3s geração estática)
- [x] AbortController timeout em 7 fetch calls
- [x] Suspense escopado ao Navbar com fallback
- [x] error.tsx criado
- [x] Testado localmente com servidor dev (Playwright): página renderiza com HeroSection, Freebies, HistoricalLows, EndingSoon ✅
- [x] Console: sem erros de `next/image` (erro anterior do `cdn1.epicgames.com` resolvido) ✅
- [ ] Testado no preview deploy (aguardando — link: https://game-deals-git-hotfix-deals-lo-998ae8-emiyakiritsugu3s-projects.vercel.app/)
- [ ] Merge para main
- [ ] Verificado em produção

---

## Checklist Correções Causa Raiz (Freeze)

- [ ] **T1** useAuthSubscription.ts: `else logout()` → `else setUser(null)`
- [ ] **T2** Singleton Supabase: `src/lib/supabase-browser.ts` criado
- [ ] **T3** Freebies.tsx: `<Image unoptimized>`
- [ ] **T4** MatrixBackground.tsx: `<Image unoptimized>`
- [ ] **T5** AuthModal.tsx: `createClient()` movido do módulo para hook
- [ ] **T6** api.ts: `getStores()` com try/catch
- [ ] **T7** Migrar authStore, SyncManager, useAuthSubscription para singleton
- [ ] Build + Testes: `pnpm build && pnpm test` (22/22 páginas, 215/215)
- [ ] Playwright QA: site não congela após 5s, CookieBanner/Navbar funcionais

---

## Como reproduzir o problema

1. Visitar `https://game-deals-topaz.vercel.app/` (produção sem PR #19)
2. Observar: spinner ou página renderizada mas congelada
3. Tentar clicar em Aceitar Cookies, links do Navbar, F12
4. Nenhum interação funciona

## Como verificar a correção

1. Visitar preview deploy do PR #19
2. Verificar: CookieBanner aparece? Clica em Aceitar?
3. Navbar responde? Clica em Bundles/Collections?
4. GameCards e DealRows clicáveis?
5. Deals carregam com dados reais?
6. F12 funciona no console?

---

## Arquivos tocados

| Arquivo | Mudança | Status |
|---------|---------|--------|
| `src/app/layout.tsx` | Suspense escopado ao Navbar | ✅ |
| `src/app/error.tsx` | Criado (error boundary) | ✅ |
| `src/services/api.ts` | AbortController 8s (getDeals, getStores) | ✅ |
| `src/services/fetch-helpers.ts` | AbortController 8s (fetchDealsWithFallback, fetchGameDetails) | ✅ |
| `src/services/ingest.ts` | AbortController 8s (fetchCheapSharkDeals) | ✅ |
| `src/actions/search.ts` | AbortController 8s (searchGamesAction, fetchDealsForSync) | ✅ |
| `src/services/api.test.ts` | signal assertion (3 locais) | ✅ |
| `src/services/ingest.test.ts` | signal assertion | ✅ |
| `next.config.ts` | Adicionado cdn1/2/3.epicgames.com, images.gog-statics.com, images.greenmangaming.com | ✅ |
| `src/hooks/useAuthSubscription.ts` | Loop infinito corrigido (`else setUser(null)`) | ⏳ |
| `src/lib/supabase-browser.ts` | Novo: singleton cliente Supabase | ⏳ |
| `src/store/authStore.ts` | Migrado para singleton | ⏳ |
| `src/components/SyncManager.tsx` | Migrado para singleton | ⏳ |
| `src/hooks/useAuthSubscription.ts` | Migrado para singleton | ⏳ |
| `src/components/AuthModal.tsx` | `createClient()` movido para dentro de funções | ⏳ |
| `src/components/Freebies.tsx` | `<Image unoptimized>` | ⏳ |
| `src/components/hero/MatrixBackground.tsx` | `<Image unoptimized>` | ⏳ |
| `src/services/api.ts` | `getStores()` com try/catch | ⏳ |

---

## Plano de Correção

Plano completo em: `.sisyphus/plans/freeze-fix-optimization.md`

Executar com: `/start-work freeze-fix-optimization`

---

## ✅ Correção Confirmada — `useAuthSubscription.ts` (16 Jun 2026, 04:40 BRT)

### O Fix

```diff
- const { setUser, logout } = useAuth();
+ const { setUser } = useAuth();

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) setUser(session.user);
-   else logout();
+   else setUser(null);
  });
- }, [setUser, logout]);
+ }, [setUser]);
```

### Evidência Playwright (26 segundos de teste)

| Tempo | Evento | Status |
|-------|--------|--------|
| 0.0s | `/` — load inicial | ✅ |
| 3.5s | `/collections` — navegação | ✅ |
| 7.9s | `/bundles` — navegação | ✅ |
| 14.2s | `/?auth=required` — redirect Wishlist protegido | ✅ |
| 18.4s | `/collections` — navegação | ✅ |
| 19.3s | `/bundles` — navegação | ✅ |
| 22.7s | `/?auth=required` — redirect Wishlist | ✅ |
| 25.2s | `/collections` | ✅ |
| 25.9s | `/bundles` | ✅ |

**Console**: Zero erros de auth. Apenas favicon 404/NotSameOrigin (preexistente).
**Snapshot**: CookieBanner, Navbar, Deals — todos renderizados e funcionais.
**Fast Refresh**: Funcionando normalmente (HMR events).

### Commit

```
fix(auth): prevent infinite auth loop - use setUser(null)
```

### Regra de Ouro

> **NUNCA** chamar `logout()` (que faz `signOut()`) dentro do callback de `onAuthStateChange`.
> O `signOut()` dispara evento `SIGNED_OUT` que chama `onAuthStateChange` → **loop infinito**.
>
> ✅ Use `setUser(null)` para apenas limpar estado local.
> ✅ Se precisar detectar SIGNED_OUT real, verifique `event === 'SIGNED_OUT'` antes de chamar `logout()`.
