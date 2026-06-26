'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

const ALLOWED_HOSTNAMES = new Set([
  'store.steampowered.com',
  'www.gog.com',
  'www.humblebundle.com',
  'www.fanatical.com',
  'www.wingamestore.com',
  'store.epicgames.com',
  'www.gamebillet.com',
  'www.voidu.com',
  'www.gamesplanet.com',
  'games.indiegala.com',
  'www.dlgamer.com',
  'www.nuuvem.com',
  'www.cdkeys.com',
  'www.kinguin.net',
  'www.eneba.com',
  'www.gamivo.com',
]);

function isHostnameAllowed(hostname: string): boolean {
  return ALLOWED_HOSTNAMES.has(hostname);
}

function applyOutAffiliateParams(url: URL, store: string | null): void {
  const storeLower = store?.toLowerCase() || '';
  if (storeLower.includes('humble')) {
    url.searchParams.append('charity', 'gamedeals');
    url.searchParams.append('partner', 'gamedealsBR');
  } else if (storeLower.includes('eneba')) {
    url.searchParams.append('af_id', 'gamedeals_prod');
  } else if (storeLower.includes('cdkeys')) {
    url.searchParams.append('mw_aref', 'gamedeals_link');
  } else if (storeLower.includes('fanatical')) {
    url.searchParams.append('aff_id', 'gamedeals_fnt');
  } else {
    url.searchParams.append('ref', 'gamedealsBR_gen');
  }
}

function redirectWithDelay(url: string, delay: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      globalThis.location.replace(url);
      resolve();
    }, delay);
  });
}

export default function OutRedirector() {
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;

    async function redirect() {
      const rawUrl = searchParams.get('url');
      const store = searchParams.get('store');

      if (!rawUrl) {
        return;
      }

      let parsed: URL;
      try {
        parsed = new URL(decodeURIComponent(rawUrl));
      } catch {
        return;
      }

      if (!isHostnameAllowed(parsed.hostname)) {
        return;
      }

      applyOutAffiliateParams(parsed, store);

      await redirectWithDelay(parsed.toString(), 1500);

      if (!cancelled) {
        globalThis.location.replace(parsed.toString());
      }
    }

    redirect();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
      <div className="w-[60px] h-[60px] border-5 border-muted border-t-primary rounded-full animate-[spin_1s_infinite_cubic-bezier(0.55,0.15,0.45,0.85)]" />
      <h2 className="text-2xl text-foreground">Redirecting...</h2>
      <p className="text-muted-foreground text-lg">
        You are being redirected to <strong className="text-primary">our partner store</strong>.
      </p>
    </div>
  );
}
