/**
 * Serialize entries to sitemap XML. Returns a Response for Next.js .xml routes.
 */
export interface SitemapEntry {
  url: string;
  lastModified?: Date;
  changeFrequency?: string;
  priority?: number;
}

const LESS = String.fromCharCode(60);
const GREATER = String.fromCharCode(62);
const AMP = String.fromCharCode(38);
const QUOT = String.fromCharCode(34);
const APOS = String.fromCharCode(39);

function escapeXml(s: string): string {
  return s
    .split(AMP)
    .join(`${AMP}amp;`)
    .split(LESS)
    .join(`${AMP}lt;`)
    .split(GREATER)
    .join(`${AMP}gt;`)
    .split(QUOT)
    .join(`${AMP}quot;`)
    .split(APOS)
    .join(`${AMP}apos;`);
}

export function sitemapXmlResponse(entries: SitemapEntry[]): Response {
  const body = entries
    .map((e) => {
      const parts = [`${LESS}loc${GREATER}${escapeXml(e.url)}${LESS}/loc${GREATER}`];
      if (e.lastModified) {
        parts.push(
          `${LESS}lastmod${GREATER}${e.lastModified.toISOString()}${LESS}/lastmod${GREATER}`
        );
      }
      if (e.changeFrequency) {
        parts.push(
          `${LESS}changefreq${GREATER}${escapeXml(e.changeFrequency)}${LESS}/changefreq${GREATER}`
        );
      }
      if (e.priority !== undefined) {
        parts.push(`${LESS}priority${GREATER}${e.priority.toFixed(1)}${LESS}/priority${GREATER}`);
      }
      return `  ${LESS}url${GREATER}\n${parts.join('\n')}\n  ${LESS}/url${GREATER}`;
    })
    .join('\n');
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '\n' +
    LESS +
    'urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' +
    GREATER +
    '\n' +
    body +
    '\n' +
    LESS +
    '/urlset' +
    GREATER;
  return new Response(xml, {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
}
