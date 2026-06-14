# 🧱 05. Componentes Core

Os componentes core formam a espinha dorsal visual da aplicação. Usados globalmente no root layout e em múltiplas páginas.

## Paradigma de Renderização

Server Components por padrão (App Router Next.js 16). `'use client'` somente quando necessário:
- Hooks de estado/efeito (`useState`, `useEffect`)
- Event handlers (`onClick`, `onSubmit`)
- Browser APIs (`localStorage`, `IntersectionObserver`)
- Bibliotecas de animação (Framer Motion)
- Context providers

## Estilização

**Tailwind CSS v4** é o sistema de estilização primário. Tokens de design customizados em `src/app/tokens.css` via diretiva `@theme`:

```css
@theme {
  --color-bg-dark: hsl(228 15% 13%);
  --color-bg-card: hsl(226 14% 18%);
  --color-primary: hsl(150 100% 42%);
  --color-accent-fire: hsl(22 100% 59%);
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
}
```

Uso em componentes:
```tsx
<div className="bg-bg-dark text-primary font-sans" />
```

Componentes legados ainda usam CSS Modules (`*.module.css`). A migração para Tailwind v4 é progressiva — código novo deve usar utility classes com `@theme` tokens.

---

## 1. GameCard (`src/components/GameCard.tsx`)

**Tipo:** Server Component (sem `'use client'`)
**Props:** `{ deal: Deal }` — objeto da CheapShark API
**Roteiro:** Renderiza link para `/game/[gameID]`

A menor unidade vitrine do sistema. Exibe capa, título, preço (normal + sale), badge de promoção e metadados.

**Responsabilidades:**
- Busca `stores` do servidor (`getStores()`) de forma assíncrona
- Calcula `isEpicDeal` (≥85% ou grátis) e `isHistoricalLow` (≥90%)
- Resolve imagem de alta resolução via `getHighResImage()`
- Hover na `imageWrapper` revela overlay de ações (wishlist, alertas, playlists)

**Sub-componentes embutidos (todos Client Components — fronteiras de interatividade):**
| Componente | Propósito | Store |
|---|---|---|
| `<HeartButton />` | Favoritar/deletar wishlist | `wishlistStore` (Zustand) |
| `<PriceAlertBadge />` | Configurar alerta de preço | `alertStore` (Zustand) |
| `<AddToListButton />` | Adicionar à playlist | Gamificação |
| `<DealsBadge />` | Badge visual "EPIC" ou "HL" | — |

**Exemplo de uso na Home:**
```tsx
// src/app/page.tsx — Server Component com Promise.all
const [deals, stores] = await Promise.all([getDeals(), getStores()]);
// ...mapeia deals para <GameCard deal={deal} />
```

---

## 2. HeroSection (`src/components/HeroSection.tsx`)

**Tipo:** Client Component (`'use client'`)
**Props:** `{ deals: Deal[] }`
**Animações:** Framer Motion (`motion.div` com `initial`/`animate`/`exit`)

Carrossel de destaque no topo da home page. Auto-play com `setInterval` de 5s.

**Estrutura visual:**
1. **Matrix background** — grid denso de 15 thumbnails clonadas com rotação Z, criando textura de fundo
2. **Background blur** — capa do deal atual como glow difuso (sobreposição)
3. **Glass panel** — painel central com vidro fosco: badge "FEATURED DEAL", título, badge de loja, badges de plataforma, preços, CTA
4. **Navigation dots** — indicadores de slide clicáveis no rodapé do hero

**Por que Client Component:**
- `useState` para `currentIndex` do carrossel
- `useEffect` para auto-play timer
- Framer Motion para animações de transição

---

## 3. Navbar (`src/components/Navbar.tsx`)

**Tipo:** Client Component (`'use client'`)
**Props:** `{ serverUser?: SupabaseUser | null }`
**Hooks:** TanStack Query (`useQuery`), Zustand (`useAuth`), nuqs (`useQueryState`)
**Dependências:** `AuthModal`, `WishlistIndicator`

Barra de navegação fixa no topo com:

**Busca com debounce:**
- Input controlado via `useQueryState('q')` (sincronizado com URL)
- Debounce de 300ms com `useState` + `useEffect`
- `useQuery` do TanStack Query chama `searchGamesAction()`
- Dropdown de resultados com thumb + título + preço
- Submissão do form navega para `/search?q=...`

**Gerenciamento de sessão:**
- Hidrata do SSR (`serverUser`) oudo `authStore` (Zustand)
- Lazy import do Supabase browser client (`@/utils/supabase/client`)
- `onAuthStateChange` subscription para login/logout em tempo real
- Botão "Login" abre `<AuthModal />`
- Logado → avatar + nome + menu dropdown (Price Alerts, Logout)
- Click outside handler para fechar dropdowns

---

## 4. SyncManager (`src/components/SyncManager.tsx`)

**Tipo:** Client Component (`'use client'`)
**Props:** nenhuma (renderiza `null`)
**Consumo:** `authStore`, `wishlistStore`, `alertStore` (Zustand)

Gerenciador invisível de sincronização entre Zustand (cliente) e Supabase (servidor). Renderiza `null` — efeitos colaterais puros.

**Três fluxos:**

| Fluxo | Gatilho | Ação |
|---|---|---|
| Load wishlist do cloud | Login detectado | `supabase.from('wishlists').select('gameId')` → merge com local |
| Sync wishlist pro cloud | `wishlist` muda | `upsert` com debounce de 1s |
| Sync alerts pro cloud | `alerts` muda | `upsert` em `price_alerts` com debounce de 1s |

**Padrão de lazy init (aprendizado de sessão):**
```tsx
let supabaseClient: ReturnType<typeof createClient> | null = null;

export default function SyncManager() {
  if (!supabaseClient) supabaseClient = createClient();
  // ...
}
```
`createClient()` é chamado dentro do corpo do componente, não no módulo. Evita problemas com SSR.

---

## 5. AuthModal (`src/components/AuthModal.tsx`)

**Tipo:** Client Component (`'use client'`)
**Props:** `{ isOpen: boolean; onClose: () => void }`
**Animações:** Framer Motion `AnimatePresence` + `motion.div`
**Providers:** Google OAuth, Discord OAuth, Magic Link (email)

Modal de autenticação com três métodos:

1. **Google OAuth** — `supabase.auth.signInWithOAuth({ provider: 'google' })`
2. **Discord OAuth** — `supabase.auth.signInWithOAuth({ provider: 'discord' })`
3. **Magic Link** — `supabase.auth.signInWithOtp({ email })`

**UX:**
- Overlay com `backdrop-blur`
- Fechar via botão X, clique no overlay, ou `ESC` (Framer Motion gerencia)
- Loading state durante autenticação
- Mensagem de sucesso/erro condicional
- Redirect pós-login para `/auth/callback`

---

## 6. CookieBanner (`src/components/CookieBanner.tsx`)

**Tipo:** Client Component (`'use client'`)
**Props:** nenhuma
**Estado:** `localStorage` (chave `gd_cookie_consent`)
**Estilização:** Inline styles (não usa CSS Module)

Banner de consentimento GDPR fixo no rodapé da página.

**Fluxo:**
1. `useEffect` checa `localStorage.getItem('gd_cookie_consent')`
2. Se não existe → exibe banner
3. Botão "Aceitar" → salva `'accepted'`, esconde banner
4. Botão "Rejeitar" → salva `'rejected'`, esconde banner

Incluído no root layout (`src/app/layout.tsx`) — visível em todas as páginas.

---

## 7. WishlistIndicator (`src/components/WishlistIndicator.tsx`)

**Tipo:** Client Component (`'use client'`)
**Props:** nenhuma
**Consumo:** `wishlistStore` (Zustand)
**Roteiro:** Link para `/wishlist`

Indicador de wishlist na Navbar.

**Proteção de hidratação:**
```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => { setMounted(true); }, []);
const count = mounted ? wishlist.length : 0;
```
Evita discrepância SSR vs cliente. Enquanto não montado, exibe contagem 0 (coração vazio).

**Elementos:**
- Ícone `Heart` do Lucide — fill vermelho (`#ef4444`) se `count > 0`
- Texto "Wishlist"
- Badge numérico com contagem total

---

## Árvore de Componentes no Root Layout

```tsx
// src/app/layout.tsx — Server Component
<NuqsAdapter>
  <ReactQueryProvider>
    <Navbar serverUser={null} />      {/* Client — busca + auth */}
    <SyncManager />                    {/* Client — sync invisível */}
    {children}                         {/* Server — páginas */}
    {modal}                            {/* Server — intercepted route modal */}
    <CookieBanner />                   {/* Client — GDPR */}
  </ReactQueryProvider>
</NuqsAdapter>
```

**Regra:** Componentes de funcionalidade (wishlist, alertas, gamificação) são detalhados no módulo [06. Feature Components](06-feature-components.md).
