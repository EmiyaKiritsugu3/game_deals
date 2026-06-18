import { readFileSync, readdirSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..', '..', '..', 'src');

const PORTUGUESE_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
  { pattern: /Grátis|GRÁTIS/gu, description: 'Grátis (Free)' },
  { pattern: /Gratuitos/gu, description: 'Gratuitos (Free)' },
  { pattern: /Ofertas\s*(Relâmpago|Épicas)/gu, description: 'Ofertas (Deals)' },
  { pattern: /Lançamentos/gu, description: 'Lançamentos (New Releases)' },
  { pattern: /Jogos\s*GRÁTIS/gu, description: 'Jogos Grátis (Free Games)' },
  { pattern: /(Nenhum|Nenhuma)\s+(alerta|jogo|resultado)/gu, description: 'Nenhum (No/None)' },
  { pattern: /Carregando/gu, description: 'Carregando (Loading)' },
  { pattern: /Resgate\s+Agora/gu, description: 'Resgate Agora (Claim Now)' },
  { pattern: /CUPOM/gu, description: 'CUPOM (Coupon)' },
  { pattern: /Ver\s+(Tudo|Oferta|Detalhes|Favoritos)/gu, description: 'Ver (View)' },
  { pattern: /Compartilhar\s+Wishlist/gu, description: 'Compartilhar (Share)' },
  { pattern: /Link\s+copiado/gu, description: 'Link copiado (Link copied)' },
  { pattern: /Ordenar\s+por/gu, description: 'Ordenar por (Sort by)' },
  { pattern: /Maior\s+Desconto/gu, description: 'Maior Desconto (Best Discount)' },
  { pattern: /Menor\s+Preço/gu, description: 'Menor Preço (Lowest Price)' },
  { pattern: /Ordem\s+Alfabética/gu, description: 'Ordem Alfabética (Alphabetical)' },
  { pattern: /Valor\s+da\s+Carteira/gu, description: 'Valor da Carteira (Portfolio Value)' },
  { pattern: /Meus\s+Alertas/gu, description: 'Meus Alertas (My Alerts)' },
  { pattern: /Monitoramento\s+Ativo/gu, description: 'Monitoramento Ativo (Active Monitoring)' },
  { pattern: /Ir\s+para\s+Jogo/gu, description: 'Ir para Jogo (View Game)' },
  { pattern: /Sua\s+lista\s+está\s+vazia/gu, description: 'Lista vazia (Empty list)' },
  { pattern: /Descobrir\s+Ofertas\s+Épicas/gu, description: 'Descobrir Ofertas Épicas' },
  { pattern: /Aplicando\s+Desconto/gu, description: 'Aplicando Desconto (Applying Discount)' },
  { pattern: /Transferindo\s+você/gu, description: 'Transferindo você (Transferring you)' },
  { pattern: /Preparando\s+conexão/gu, description: 'Preparando conexão (Preparing connection)' },
  { pattern: /Carregando\s+link\s+seguro/gu, description: 'Carregando link seguro (Loading secure link)' },
  { pattern: /Wishlist\s+não\s+encontrada/gu, description: 'Wishlist não encontrada' },
  { pattern: /O\s+link\s+pode\s+estar\s+expirado/gu, description: 'Link expirado (Expired link)' },
  { pattern: /Ir\s+para\s+a\s+Home/gu, description: 'Ir para a Home (Go to Home)' },
  { pattern: /Comprar\s+como\s+Presente/gu, description: 'Comprar como Presente (Buy as Gift)' },
  { pattern: /Wishlist\s+Compartilhada/gu, description: 'Wishlist Compartilhada (Shared Wishlist)' },
  { pattern: /Presenteie\s+usando/gu, description: 'Presenteie usando (Gift using)' },
  { pattern: /[Pp]reço\s+baixar/gu, description: 'preço baixar (price drop)' },
  { pattern: /Meu\s+Dashboard/gu, description: 'Meu Dashboard (My Dashboard)' },
  { pattern: /Gerencie\s+seus\s+jogos/gu, description: 'Gerencie seus jogos (Manage your games)' },
  { pattern: /Inclui\s+Keyshops|Apenas\s+Oficiais/gu, description: 'Keyshop labels' },
];

const IGNORE_FILES = new Set([
  'english-strings.test.ts',
  'node_modules',
  '.next',
]);

const INCLUDE_EXT = new Set(['.tsx', '.ts']);

function* walkDir(dir: string): Generator<string> {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE_FILES.has(entry.name)) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkDir(fullPath);
    } else if (entry.isFile() && INCLUDE_EXT.has(extname(entry.name))) {
      yield fullPath;
    }
  }
}

function isTestFile(filePath: string): boolean {
  return /\.(test|spec)\.(ts|tsx)$/.test(filePath);
}

function isConfigFile(filePath: string): boolean {
  return filePath.endsWith('.config.ts') || filePath.includes('/drizzle/');
}

function findPortugueseStrings(filePath: string): Array<{ pattern: string; match: string }> {
  const content = readFileSync(filePath, 'utf-8');
  const results: Array<{ pattern: string; match: string }> = [];

  for (const { pattern, description } of PORTUGUESE_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      for (const match of matches) {
        results.push({ pattern: description, match });
      }
    }
  }

  return results;
}

describe('User-facing strings must be in English', () => {
  const violations: Array<{ file: string; pattern: string; match: string }> = [];

  for (const file of walkDir(ROOT)) {
    if (isTestFile(file) || isConfigFile(file)) continue;
    const results = findPortugueseStrings(file);
    for (const { pattern, match } of results) {
      violations.push({ file, pattern, match });
    }
  }

  it('should have no Portuguese user-facing strings in source files', () => {
    if (violations.length > 0) {
      const message = violations
        .map(
          (v) =>
            `  ${v.file}: Found "${v.match}" (matched: ${v.pattern})`
        )
        .join('\n');
      expect.fail(`Found ${violations.length} Portuguese string(s):\n${message}`);
    }
  });
});
