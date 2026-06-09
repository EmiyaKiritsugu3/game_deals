# ADR-002: Data Source Strategy — CheapShark API + Simulated Keyshops

**Status**: Aceito
**Data**: 2026-06-09
**Autor**: EmiyaKiritsugu3

---

## Contexto

Precisamos agregar preços de jogos de múltiplas fontes para:
- Comparar preços "Official Stores" vs "Keyshops" (estilo gg.deals)
- Exibir Historical Lows verificados
- Gerar affiliate links para monetização
- Cobrir mercado brasileiro (região BR prioritária)

APIs avaliadas:
| API | Pros | Contras |
|-----|------|---------|
| **CheapShark** | Gratuita, sem auth, cobre 30+ lojas oficiais, dealRating | Bloqueia keyshops (CDKeys, Kinguin, Eneba); rate limit não documentado |
| **IsThereAnyDeal (ITAD)** | Cobertura completa (official + keyshops), historical lows, webhooks | Requer auth/parceria; aprovação manual; custos para volume alto |
| **Steam Store API** | Preços oficiais Steam, metadados ricos | Apenas Steam; sem keyshops; rate limit estrito |
| **IGDB (Twitch)** | Metadados ricos (screenshots, genres, HLTB) | Não tem preços; rate limit; foco em metadata |
| **GG.deals API** | Dados completos | Não pública; só para parceiros |

## Decisão

**Estratégia Híbrida:**

1. **Fonte Primária (Real-time)**: **CheapShark API** para lojas oficiais (Steam, Epic, GOG, Humble, Fanatical, GreenManGaming, etc.)
   - Endpoint: `https://www.cheapshark.com/api/1.0/deals`
   - Parâmetros: `storeID`, `upperPrice`, `lowerPrice`, `metacritic`, `steamRating`, `pageSize`, `sortBy`
   - `dealRating` usado para "Value-for-Money" badge

2. **Keyshops (Simulados)**: Gerar deals sintéticos para CDKeys, Kinguin, Eneba, G2A, Instant Gaming
   - Lógica em `api.ts`: pega preço oficial mais baixo → aplica desconto aleatório 15-35%
   - `cheapestPriceEver` recalculado para refletir floor real (fixado na Phase 9)
   - Separados visualmente no UI: badge "Keyshop", cor distinta, aviso de risco

3. **Metadados Enriquecidos**: **IGDB** (via Twitch OAuth) para:
   - Cover art, screenshots, genres, platforms
   - HLTB (HowLongToBeat) → cost-per-hour metric
   - Steam/Epic/GOG DRM detection

4. **Affiliate Mapping**: Tabela de mapeamento `storeID` → `affiliate_network` + `tracking_template`
   - Rakuten (Steam, Epic, GOG, Humble, Fanatical, GMG)
   - CJ / Awin (keyshops + algumas lojas oficiais)
   - Cloaking via `/out` route (ver ADR-006)

## Consequências

### Positivas
- **Zero custo inicial**: CheapShark gratuita, sem auth
- **Controle total**: Keyshops simulados permitem testar UI/UX sem depender de APIs terceiras
- **Flexibilidade**: Fácil swapping para ITAD quando aprovação sair
- **Região BR**: CheapShark suporta `region=br` (preços em BRL)

### Negativas / Trade-offs
- **Keyshops não são reais**: Usuário avançado pode notar; mitigado com disclaimer visual
- **CheapShark rate limits**: Não documentados; implementar cache agressivo (revalidate 300s) + fallback
- **Cobertura incompleta**: Algumas lojas BR (Nuuvem, GreenManGaming BR) podem faltar

### Plano de Evolução
- **Curto prazo**: Manter simulação; adicionar mais lojas oficiais conforme CheapShark expande
- **Médio prazo**: Integrar ITAD (quando aprovado) → substituir keyshops simulados por reais
- **Longo prazo**: Próprio scraper com FlareSolverr para Cloudflare (Nuuvem, etc.) + cache Redis

---

## Referências
- [Implementation Plan Phase 5](../implementation_plan.md#phase-5-api-expansion--business-model-affiliates)
- `src/services/api.ts` — implementação da lógica híbrida
- `src/data/fallbackDeals.ts` — dados de fallback