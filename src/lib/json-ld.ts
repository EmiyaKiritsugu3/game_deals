/**
 * Serializa objeto para JSON-LD seguro dentro de <script type="application/ld+json">.
 * JSON.stringify não escapa `<` — título externo (CheapShark) com `</script>`
 * quebraria o bloco e injetaria HTML/JS. Escape evita o vetor XSS.
 */
export function safeJsonLdStringify(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
