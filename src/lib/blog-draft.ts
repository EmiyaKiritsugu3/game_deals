import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Deal } from '@/types/game';
import { getPost, parsePost } from './blog';

export const DRAFT_MIN_WORDS = 600;
export const DRAFT_MIN_DEALS = 3;
export const DRAFT_MAX_DEALS = 8;

export interface DraftDeal {
  title: string;
  salePrice: number;
  normalPrice: number;
  savings: number;
  store: string;
  gameID: string;
}

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

function brl(n: number): string {
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
}

/** CheapShark deal → draft deal, salePrice===0 only (caller filters). */
export function toDraftDeals(raw: Deal[], stores: Record<string, string>): DraftDeal[] {
  return raw
    .filter((d) => Number(d.salePrice) === 0)
    .map((d) => ({
      title: d.title,
      salePrice: 0,
      normalPrice: Number(d.normalPrice),
      savings: Math.round(Number(d.savings)),
      store: stores[d.storeID] ?? `Loja ${d.storeID}`,
      gameID: d.gameID,
    }));
}

export function draftSlug(now: Date): string {
  return `jogos-gratis-da-semana-${now.toISOString().slice(0, 10)}`;
}

/** First free slug: base, base-2, base-3… (getPost returns null when missing). */
export async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let n = 2;
  while (await getPost(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

function dealSection(d: DraftDeal): string {
  return [
    `## ${d.title}`,
    '',
    `${d.title} está gratuito para resgatar: de ${brl(d.normalPrice)} por R$ 0,00 ` +
      `(${d.savings}% de desconto) na ${d.store}. É o tipo de oferta que some rápido — ` +
      `a janela de resgate costuma durar poucos dias e, quando fecha, o preço volta ao normal. ` +
      `Se você já tinha o jogo na lista de desejos, esta é a melhor hora possível para garantir a sua cópia.`,
    '',
    `Para garantir o seu, abra a página do jogo, clique em resgatar e confira se ele apareceu ` +
      `na sua biblioteca antes de fechar a aba. Vale fazer isso mesmo que você não pretenda jogar agora: ` +
      `uma vez resgatado, o jogo é seu para sempre. Se o botão de resgate não aparecer de primeira, ` +
      `recarregue a página ou tente em uma aba anônima — as lojas costumam exigir login para liberar o resgate.`,
    '',
  ].join('\n');
}

export function buildDraftMarkdown(deals: DraftDeal[], now: Date): string {
  const iso = now.toISOString().slice(0, 10);
  const br = iso.split('-').reverse().join('/');
  const front = [
    '---',
    `title: Jogos grátis da semana — ${br}`,
    `description: ${deals.length} jogos gratuitos para resgatar esta semana nas principais lojas de PC. Oferta por tempo limitado.`,
    `date: ${iso}`,
    'published: false',
    `dealIds: ${deals.map((d) => d.gameID).join(', ')}`,
    '---',
    '',
  ].join('\n');
  const intro = [
    'Toda semana as lojas de PC liberam jogos gratuitos por tempo limitado, e este resumo reúne ' +
      `os destaques que valem o seu clique. Todos os preços foram verificados no momento da publicação — ` +
      `resgate o quanto antes, porque quando a janela fecha o preço volta ao normal. ` +
      `A lista abaixo traz ${deals.length} jogos gratuitos desta semana, cada um com link direto para a página de resgate.`,
    '',
  ].join('\n');
  const howto = [
    '## Como resgatar',
    '',
    'O processo é o mesmo em praticamente todas as lojas: abra a página do jogo pelo link do resumo, ' +
      `faça login na sua conta e clique no botão de resgate ou de compra com preço zero. Confira se o jogo ` +
      `apareceu na sua biblioteca antes de fechar a aba — às vezes o pedido fica alguns minutos como ` +
      `pendente antes de ser liberado. Se algum jogo da lista já voltou ao preço normal quando você chegou, ` +
      `não desanime: as lojas renovam as ofertas gratuitas toda semana e o próximo resumo já está a caminho. ` +
      `Vale também conferir se há DLCs ou pacotes gratuitos na mesma página, que muitas vezes passam despercebidos.`,
    '',
  ].join('\n');
  const outro = [
    '## Dica final',
    '',
    'Ative os alertas de preço do GameDeals para os jogos pagos da sua lista de desejos: assim você ' +
      `é avisado quando eles entrarem em promoção. E volte toda segunda-feira — este resumo é atualizado ` +
      `automaticamente com os novos jogos gratuitos da semana.`,
    '',
  ].join('\n');
  return front + intro + deals.map(dealSection).join('\n') + howto + outro;
}

/** Word count of the post body (frontmatter excluded via parsePost). */
export function bodyWords(markdown: string): number {
  const post = parsePost('draft', markdown);
  if (!post) return 0;
  return post.body.split(/\s+/).filter(Boolean).length;
}

export async function saveDraft(slug: string, markdown: string): Promise<void> {
  await fs.mkdir(BLOG_DIR, { recursive: true });
  await fs.writeFile(path.join(BLOG_DIR, `${slug}.md`), markdown, 'utf8');
}
