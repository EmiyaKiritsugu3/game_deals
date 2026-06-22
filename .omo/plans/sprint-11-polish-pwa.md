# Sprint 11 — Polish & PWA (Phase C — High Priority P2 Items)

> [!NOTE]
> This document may not reflect the current implementation.
> See the final report for up-to-date state:
> [Final Report](../docs/compose/reports/sprint11-accessibility-and-quality.md)

## Objetivo
Entregar experiência PWA, toggle de tema, e itens P2 de alto impacto enquanto eliminamos débito técnico crítico.

## Estado Real (audited 2026-06-20)
PRD P0/P1 quase totalmente implementado. Foco agora em:
- PWA (P1 restante — service worker não implementado)
- Theme toggle (P2 — componente existe mas não integrado)
- Quick wins de bug fix e qualidade
- Acessibilidade e débito técnico

## Duração Estimada: 5-7 dias (1 engenheiro)

---

## Track A: PWA & Offline (3 dias) — P1

### A1. Service Worker Implementation (2d)
| Item | Arquivo | Ação |
|------|---------|------|
| Criar service worker | `public/sw.js` | Cache-first para assets estáticos, network-first para páginas |
| Registrar service worker | `src/app/layout.tsx` | Adicionar `navigator.serviceWorker.register('/sw.js')` |
| Offline fallback | `public/offline.html` | Página offline amigável |
| Cache strategy | `public/sw.js` | Cache de: fonts, images, CSS, JS bundles |

**Estratégia de Cache:**
- **Assets estáticos** (fonts, images, CSS): Cache-first (servir do cache, atualizar em background)
- **Páginas**: Network-first (tentar rede, fallback para cache)
- **API calls**: Network-only (não cachear dados dinâmicos)

### A2. Manifest Updates (1h)
| Item | Arquivo | Ação |
|------|---------|------|
| Atualizar manifest | `public/manifest.json` | Adicionar `start_url`, `display: standalone`, `theme_color` |
| Ícones | `public/icon-192.png`, `public/icon-512.png` | Verificar existência e qualidade |

### A3. PWA Test (1h)
| Item | Arquivo | Ação |
|------|---------|------|
| Teste de registro | `tests/e2e/pwa.spec.ts` | Verificar service worker registra corretamente |
| Teste offline | `tests/e2e/pwa.spec.ts` | Verificar fallback offline funciona |

**Acceptance:**
- Service worker registra sem erros
- Assets estáticos funcionam offline
- Página offline mostra fallback amigável
- Manifest válido (Lighthouse PWA >80)

---

## Track B: Theme Toggle Integration (1 dia) — P2

### B1. Theme Provider Setup (4h)
| Item | Arquivo | Ação |
|------|---------|------|
| Configurar ThemeProvider | `src/app/layout.tsx` | Envolver com `next-themes` ThemeProvider |
| Integrar ThemeToggle | `src/components/Navbar.tsx` | Adicionar ThemeToggle existente |
| Persistência | localStorage | Salvar preferência do usuário |

**Padrão:**
```tsx
'use client';
import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
```

### B2. Theme Tests (4h)
| Item | Arquivo | Ação |
|------|---------|------|
| Teste toggle | `src/components/ThemeToggle.test.tsx` | Verificar alternância dark/light |
| Teste persistência | `src/components/ThemeToggle.test.tsx` | Verificar localStorage |

**Acceptance:**
- Toggle funciona (dark ↔ light)
- Preferência persiste entre sessões
- System preference detectado
- Não causa flash of unstyled content (FOUC)

---

## Track C: Quick Wins & Bug Fixes (1 dia)

### C1. Discord Button Icon Fix (30min)
| Item | Arquivo | Ação |
|------|---------|------|
| Corrigir ícone | `src/components/AuthModal.tsx:124` | Substituir GitHub icon por Discord icon (simple-icons) |

### C2. lint-staged Markdown Fix (15min)
| Item | Arquivo | Ação |
|------|---------|------|
| Remover md do pattern | `package.json` lint-staged | Remover `md` de `*.{json,css,md}` |

### C3. Drizzle Snapshot Stubs (30min)
| Item | Arquivo | Ação |
|------|---------|------|
| Criar stubs | `drizzle/meta/` | Criar snapshots para 0002-0007 |

### C4. Double Encoding Fix (15min)
| Item | Arquivo | Ação |
|------|---------|------|
| Remover encodeURIComponent | `src/actions/deals.ts:35` | `sanitizeTitle()` não deve usar encodeURIComponent |

### C5. Dependency Vulnerability Scanning (1h)
| Item | Arquivo | Ação |
|------|---------|------|
| Adicionar pnpm audit | `.github/workflows/ci.yml` | Passo `pnpm audit --audit-level=high` |

**Acceptance:**
- Discord mostra ícone correto
- Commits com .md não bloqueados
- `drizzle-kit check` sem erros
- Títulos com caracteres especiais funcionam
- CI detecta vulnerabilidades

---

## Track D: Accessibility & Quality (1 dia)

### D1. Aria-Live Regions (1h)
| Item | Arquivo | Ação |
|------|---------|------|
| NotificationBell | `src/components/NotificationBell.tsx` | Adicionar `aria-live="polite"` |
| WishlistIndicator | `src/components/WishlistIndicator.tsx` | Adicionar `aria-live="polite"` |

### D2. AlertsPage Complexity Extraction (2h)
| Item | Arquivo | Ação |
|------|---------|------|
| Extrair AlertCard | `src/app/alerts/page.tsx` | Criar sub-componente `AlertCard.tsx` |
| Reduzir complexidade | `src/app/alerts/page.tsx` | De 205 para ~100 linhas |

### D3. Deferred Cubic Review Items (4h)
| Item | Arquivo | Ação |
|------|---------|------|
| UserMenu a11y | `src/components/UserMenu.tsx` | Converter button+links para links acessíveis |
| BaseModal accessible name | `src/components/BaseModal.tsx` | Adicionar `aria-label` |
| WishlistGrid heart button | `src/components/WishlistGrid.tsx` | Mover de absolute para flow |
| GameBody redundant field | `src/components/GameBody.tsx` | Remover `bestCurrentPrice` redundante |
| AlertsGrid opacity | `src/components/AlertsGrid.tsx` | Corrigir opacidade composta |

**Acceptance:**
- Componentes dinâmicos anunciam mudanças para screen readers
- AlertsPage complexidade < 30 CRAP
- Todos os itens cubic review resolvidos

---

## Ordem de Execução

```
Dia 1-3: Track A (PWA — maior impacto)
Dia 4: Track B (Theme Toggle)
Dia 5: Track C (Quick Wins)
Dia 6: Track D (A11y & Quality)
Dia 7: Gate final + PR
```

## Meta

- [ ] Service worker implementado e funcionando
- [ ] Theme toggle integrado com persistência
- [ ] 5+ bugs quick wins resolvidos
- [ ] Aria-live regions adicionados
- [ ] AlertsPage complexidade reduzida
- [ ] 5 itens cubic review resolvidos
- [ ] Todos os testes existentes passando
- [ ] Coverage mantida ou melhorada (≥82% linhas)
- [ ] 0 novos issues SonarQube

## Variáveis de Ambiente Nenhuma
Todas as features deste sprint usam infraestrutura existente.

## Riscos

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Service worker pode causar cache stale | Usuários veem conteúdo antigo | Network-first para páginas, cache-first apenas para assets |
| Theme toggle pode causar FOUC | Flash de tema errado | Usar `attribute="class"` + `defaultTheme="system"` |
| Drizzle stubs podem quebrar migrações | Deploy falha | Testar `pnpm db:migrate` localmente |

## Verification Strategy

### Self-Gate (antes de push, ~60s)
```bash
biome check .                                    # → 0 errors
tsc --noEmit                                      # → 0 errors
pnpm test -- --run                                # → ALL pass
pnpm test:coverage                                # → ≥82% linhas
pnpm knip                                         # → 0 dead code
```

### E2E Gate
```bash
pnpm test:e2e                                     # → ALL pass
```

## Commit Strategy

- 1 commit por arquivo: `feat(scope): description`
- Ordem: Track A → Track B → Track C → Track D → Gate → PR
- Cada commit: mudanças + gate local

## Success Criteria

- [ ] PWA: Service worker registra, assets cacheados offline
- [ ] Theme: Toggle funciona, persiste, detecta system preference
- [ ] Bugs: Discord icon, lint-staged, drizzle stubs, double encoding corrigidos
- [ ] Security: pnpm audit no CI
- [ ] A11y: Aria-live regions funcionando
- [ ] Quality: AlertsPage < 30 CRAP, cubic review items resolvidos
- [ ] Tests: Todos existentes passam + novos testes para features novas
- [ ] Coverage: ≥82% linhas mantida
- [ ] PR criado para review
