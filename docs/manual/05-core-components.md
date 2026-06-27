# 🧱 05. Core Components

The core components form the visual backbone of the application. Used globally in the root layout and across multiple pages.

## Rendering Paradigm

Server Components by default (App Router Next.js 16). `'use client'` only when necessary:
- State/effect hooks (`useState`, `useEffect`)
- Event handlers (`onClick`, `onSubmit`)
- Browser APIs (`localStorage`, `IntersectionObserver`)
- Context providers

## Styling

**Tailwind CSS v4** is the primary styling system. Custom design tokens in `src/app/tokens.css` via `@theme` directive:

```css
@theme {
  --color-bg-dark: hsl(228 15% 13%);
  --color-bg-card: hsl(226 14% 18%);
  --color-primary: hsl(150 100% 42%);
  --color-accent-fire: hsl(22 100% 59%);
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
}
```

Usage in components:
```tsx
<div className="bg-bg-dark text-primary font-sans" />
```

All styling uses Tailwind v4. No CSS Modules remain (migration complete).

---

## 1. GameCard (`src/components/GameCard.tsx`)

**Type:** Server Component (no `'use client'`)
**Props:** `{ deal: Deal }` — CheapShark API object
**Routing:** Renders link to `/game/[gameID]`

The smallest display unit of the system. Displays cover, title, price (normal + sale), promotion badge and metadata.

**Responsibilities:**
- Fetches `stores` from server (`getStores()`) asynchronously
- Calculates `isEpicDeal` (≥85% or free) and `isHistoricalLow` (≥90%)
- Resolves high resolution image via `getHighResImage()`
- Hover on `imageWrapper` reveals action overlay (wishlist, alerts, playlists)

**Embedded sub-components (all Client Components — interactivity boundaries):**
| Component | Purpose | Store |
|---|---|---|
| `<HeartButton />` | Favorite/remove wishlist | `wishlistStore` (Zustand) |
| `<PriceAlertBadge />` | Configure price alert | `alertStore` (Zustand) |
| `<AddToListButton />` | Add to playlist | Gamification |
| `<DealsBadge />` | Visual badge "EPIC" or "HL" | — |

**Usage example on Home:**
```tsx
// src/app/page.tsx — Server Component with Promise.all
const [deals, stores] = await Promise.all([getDeals(), getStores()]);
// ...maps deals to <GameCard deal={deal} />
```

---

## 2. HeroSection (`src/components/HeroSection.tsx`)

**Type:** Client Component (`'use client'`)
**Props:** `{ deals: Deal[] }`
**Animations:** CSS `@keyframes` (no JS runtime). Defined in `globals.css` within `@theme` block.

Featured carousel at the top of the home page. Auto-play with 5s `setInterval`.

**Visual structure:**
1. **Matrix background** — dense grid of 15 cloned thumbnails with Z rotation, creating background texture
2. **Background blur** — current deal cover as diffuse glow (overlay)
3. **Glass panel** — central frosted glass panel: "FEATURED DEAL" badge, title, store badge, platform badges, prices, CTA
4. **Navigation dots** — clickable slide indicators at hero footer

**Why Client Component:**
- `useState` for carousel `currentIndex`
- `useEffect` for auto-play timer
- CSS `@keyframes` transitions

---

## 3. Navbar (`src/components/Navbar.tsx`)

**Type:** Client Component (`'use client'`)
**Props:** `{ serverUser?: SupabaseUser | null }`
**Hooks:** TanStack Query (`useQuery`), Zustand (`useAuth`), nuqs (`useQueryState`)
**Dependencies:** `AuthModal`, `WishlistIndicator`

Fixed navigation bar at the top with:

**Search with debounce:**
- Input controlled via `useQueryState('q')` (synced with URL)
- 300ms debounce with `useState` + `useEffect`
- `useQuery` from TanStack Query calls `searchGamesAction()`
- Results dropdown with thumb + title + price
- Form submission navigates to `/search?q=...`

**Session management:**
- Hydrates from SSR (`serverUser`) or `authStore` (Zustand)
- Lazy import of Supabase browser client (`@/utils/supabase/client`)
- `onAuthStateChange` subscription for real-time login/logout
- "Login" button opens `<AuthModal />`
- Logged in → avatar + name + dropdown menu (Price Alerts, Logout)
- Click outside handler to close dropdowns

---

## 4. SyncManager (`src/components/SyncManager.tsx`)

**Type:** Client Component (`'use client'`)
**Props:** none (renders `null`)
**Consumes:** `authStore`, `wishlistStore`, `alertStore` (Zustand)

Invisible sync manager between Zustand (client) and Supabase (server). Renders `null` — pure side effects.

**Three flows:**

| Flow | Trigger | Action |
|---|---|---|
| Load wishlist from cloud | Login detected | `supabase.from('wishlists').select('gameId')` → merge with local |
| Sync wishlist to cloud | `wishlist` changes | `upsert` with 1s debounce |
| Sync alerts to cloud | `alerts` changes | `upsert` in `price_alerts` with 1s debounce |

**Lazy init pattern (session learning):**
```tsx
let supabaseClient: ReturnType<typeof createClient> | null = null;

export default function SyncManager() {
  if (!supabaseClient) supabaseClient = createClient();
  // ...
}
```
`createClient()` is called inside the component body, not at module level. Avoids SSR issues.

---

## 5. AuthModal (`src/components/AuthModal.tsx`)

**Type:** Client Component (`'use client'`)
**Props:** `{ isOpen: boolean; onClose: () => void }`
**Animations:** CSS transitions (no JS animation runtime)
**Providers:** Google OAuth, Discord OAuth, Magic Link (email)

Authentication modal with three methods:

1. **Google OAuth** — `supabase.auth.signInWithOAuth({ provider: 'google' })`
2. **Discord OAuth** — `supabase.auth.signInWithOAuth({ provider: 'discord' })`
3. **Magic Link** — `supabase.auth.signInWithOtp({ email })`

**UX:**
- Overlay with `backdrop-blur`
- Close via X button, overlay click, or `ESC`
- Loading state during authentication
- Conditional success/error message
- Post-login redirect to `/auth/callback`

---

## 6. CookieBanner (`src/components/CookieBanner.tsx`)

**Type:** Client Component (`'use client'`)
**Props:** none
**State:** `localStorage` (key `gd_cookie_consent`)
**Styling:** Inline styles

GDPR consent banner fixed at the page footer.

**Flow:**
1. `useEffect` checks `localStorage.getItem('gd_cookie_consent')`
2. If it doesn't exist → shows banner
3. "Accept" button → saves `'accepted'`, hides banner
4. "Reject" button → saves `'rejected'`, hides banner

Included in root layout (`src/app/layout.tsx`) — visible on all pages.

---

## 7. WishlistIndicator (`src/components/WishlistIndicator.tsx`)

**Type:** Client Component (`'use client'`)
**Props:** none
**Consumes:** `wishlistStore` (Zustand)
**Routing:** Link to `/wishlist`

Wishlist indicator in the Navbar.

**Hydration protection:**
```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => { setMounted(true); }, []);
const count = mounted ? wishlist.length : 0;
```
Prevents SSR vs client discrepancy. While not mounted, displays count 0 (empty heart).

**Elements:**
- `Heart` icon from Lucide — red fill (`#ef4444`) if `count > 0`
- "Wishlist" text
- Numeric badge with total count

---

## Component Tree in Root Layout

```tsx
// src/app/layout.tsx — Server Component
<NuqsAdapter>
  <ReactQueryProvider>
    <Navbar serverUser={null} />      {/* Client — search + auth */}
    <SyncManager />                    {/* Client — invisible sync */}
    {children}                         {/* Server — pages */}
    {modal}                            {/* Server — intercepted route modal */}
    <CookieBanner />                   {/* Client — GDPR */}
  </ReactQueryProvider>
</NuqsAdapter>
```

**Rule:** Feature components (wishlist, alerts, gamification) are detailed in module [06. Feature Components](06-feature-components.md).
