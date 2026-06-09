# ADR-007: Gamification System — Badges, XP, Playlists, Social

**Status**: Proposto
**Data**: 2026-06-09
**Autor**: EmiyaKiritsugu3

---

## Contexto

O GameDeals está evoluindo de "price aggregator" para **plataforma social gamificada** (Phase 19+). Objetivos:
- **Retenção**: Usuários voltam para completar conquistas, manter streaks
- **UGC**: Playlists, reviews, collections geram conteúdo SEO + engajamento
- **Viralidade**: Shareable wishlists, public profiles, badges exibíveis
- **Dados**: Métricas de comportamento para melhorar recomendações + affiliate conversion

## Decisão

### Sistema de Conquistas (Badges)

| Componente | Detalhes |
|------------|----------|
| **Tabela `badges`** | Mestre de conquistas disponíveis (name, description, icon_svg, rarity, criteria JSON) |
| **Tabela `user_stats`** | Contadores incrementais (playlists_count, reviews_count, xp) — evita COUNT(*) em queries |
| **Tabela `user_badges`** | Junction table (user_id, badge_id, awarded_at) |
| **Trigger Logic** | Edge Function (Supabase) ou Server Action: no INSERT/UPDATE de playlists/reviews → incrementa `user_stats` → verifica `badges.criteria` → INSERT em `user_badges` se qualificado |

#### Exemplo de Badge
```json
{
  "id": "uuid",
  "name": "Playlist Master",
  "description": "Created 10 public playlists",
  "icon_svg": "<svg>...</svg>",
  "rarity": "Rare",
  "criteria": { "type": "playlists_count", "threshold": 10, "condition": "public_only": true }
}
```

### XP & Levels (Futuro)
- `user_stats.xp` incrementado por ações (playlist: +50, review: +100, daily login: +10)
- Level = `Math.floor(Math.sqrt(xp / 100))` ou tabela `levels` com thresholds

### Playlists (UGC Core)
- **Criação**: User seleciona jogos → salva como playlist pública/privada
- **Slug**: `/playlist/[slug]` — shareable, SEO-friendly
- **Discovery**: `/playlists` page com filtros (tags, autor, games count)
- **Gamificação**: Badges por contagem, curadoria (staff picks), plays/views

### Reviews
- **Estrutura**: Rating 1-10, hours_played, is_recommended, content (markdown)
- **Exibição**: Game detail page + user profile
- **Moderação**: Report system + auto-filter toxicidade (Perspective API fut.)

### Public Profile (`/user/[username]`)
- Header: avatar, display_name, bio, badge gallery (horizontal scroll)
- Tabs: Playlists | Reviews | Wishlist (se público) | Badges | Activity
- **Privacy**: User controla o que é público (wishlist, playlists, reviews)

### Activity Feed
- Real-time via Supabase Realtime: novos badges, playlists, reviews de followed users
- **Gamificação**: "Emiya conquistou 'Playlist Master' 🏆"

## Consequências

### Positivas
- **Loop de engajamento**: Cria playlist → ganha badge → exibe no profile → amigos veem → criam suas próprias
- **SEO UGC**: Playlists públicas = páginas indexáveis com long-tail keywords ("best co-op games 2024", "games under $10")
- **Dados comportamentais**: Quais jogos aparecem em playlists → sinais de recomendação + affiliate targeting
- **Diferenciação**: gg.deals/ITAD não têm camada social forte; moat defensável

### Negativas / Trade-offs
- **Complexidade backend**: Triggers, RLS, realtime, moderação
- **Abuso potencial**: Users criam playlists spam para badges; mitigado: `criteria.public_only`, rate limits, moderação
- **Performance**: Badge gallery no profile = múltiplas queries; mitigado: `icon_svg` inline, `user_stats` denormalizado
- **Privacidade**: LGPD — export/delete de dados UGC; anonimização de activity feed

### Riscos & Mitigações
| Risco | Mitigação |
|-------|-----------|
| Badge inflation (todos viram "Legendary") | Curva de raridade exponencial; novos badges trimestrais |
| Spam playlists | Min 3 jogos/playlist; cooldown 10min; auto-flag duplicatas |
| Toxic reviews | Perspective API score > 0.7 → shadowban; report flow |
| Profile scraping | Rate limit `/user/[username]`; `robots.txt` disallow para bots não-SEO |

---

## Referências
- [Gamification Plan](../gamification_plan.md)
- [Task.md Phase 19](../task.md#phase-19-gamification--social-foundation-beta)
- `docs/adr/ADR-004-auth-backend.md` — schema Supabase relacionado