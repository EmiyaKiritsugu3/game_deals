# Sprint 9 — Coverage Push 75% → 80%

## Objetivo
Elevar line coverage de 74.6% para 80%+ com testes funcionais.

## Estado Atual
- 84 arquivos, 787 testes
- 74.6% lines / 65.4% branches / 66.43% functions
- 0 SonarQube issues

## Prioridades

### Track A: Components (0% → 80%+) — Maior impacto
| Arquivo | Linhas | Prioridade |
|---------|--------|------------|
| Charts.tsx | 26-91 | Alta |
| DealRow.tsx | 10-120 | Alta |
| GameCard.tsx | 11-52 | Alta |
| GameBody.tsx | 51-93 | Média |
| GameHero.tsx | 23-25 | Baixa |
| GameStatsRow.tsx | 22 | Baixa |
| HeroSection.tsx | 10-17 | Baixa |
| HeroSlide.tsx | 18-46 | Média |
| EndingSoon.tsx | 6-25 | Baixa |
| Freebies.tsx | 11-24 | Baixa |
| NotificationBell.tsx | 18-132 | Média |
| WishlistIndicator.tsx | 10-19 | Baixa |
| AlertBadge.tsx | 14-23 | Baixa |
| PriceComparison.tsx | 25-59 | Média |
| DynamicCharts.tsx | 8-58 | Média |
| ListModal.tsx | 28-118 | Média |

### Track B: Pages (0% → 80%+)
| Arquivo | Prioridade |
|---------|------------|
| search/SearchResults.tsx | Alta |
| bundles/ (page) | Média |
| game/[id]/page.tsx | Alta |
| @modal/(.)game/[id]/ | Média |
| collections/[slug]/ | Média |
| out/Redirector.tsx | Baixa |
| wishlist/shared/ | Baixa |
| auth/callback/ | Baixa |

### Track C: knip/fallow cleanup
- Remover `serwist` unused dep (ou justificar)
- Remover `esbuild` unused devDep
- Cleanup `knip.json` hints
- Extrair funções duplicadas em testes

## Estratégia
- Foco em components de alta prioridade (Track A)
- Pages de search/game (Track B) — testes E2E ou componentes
- knip/fallow (Track C) — quick wins

## Meta
- Line coverage: 74.6% → 80%+ (+5.4%)
- Branch coverage: 65.4% → 70%+ (+4.6%)
- Novos testes: ~80-120
