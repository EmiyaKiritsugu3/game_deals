'use client';

import { useCallback, useState } from 'react';

export function useShareWishlist(wishlist: string[]) {
  const [copied, setCopied] = useState(false);

  const share = useCallback(() => {
    const encoded = btoa(wishlist.join(','));
    const url = `${globalThis.location.origin}/wishlist/shared?ids=${encoded}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [wishlist]);

  return { copied, share };
}
