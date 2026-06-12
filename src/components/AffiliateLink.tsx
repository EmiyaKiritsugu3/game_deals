'use client';

import type { ReactNode } from 'react';

interface AffiliateLinkProps {
  readonly storeId: string;
  readonly gameSlug: string;
  readonly children: ReactNode;
  readonly className?: string;
}

/**
 * Componente de link de afiliado
 * Gera URL /out/[storeId]/[gameSlug] que loga click e redireciona
 */
export default function AffiliateLink({
  storeId,
  gameSlug,
  children,
  className,
}: AffiliateLinkProps) {
  // URL do /out route que loga click e redireciona
  const href = `/out/${storeId}/${encodeURIComponent(gameSlug)}`;

  return (
    <a
      href={href}
      className={className}
      target="_blank"
      rel="noopener noreferrer sponsored"
      data-store={storeId}
      data-game={gameSlug}
    >
      {children}
    </a>
  );
}
