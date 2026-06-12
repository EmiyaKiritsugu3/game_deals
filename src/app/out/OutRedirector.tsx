'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import styles from './out.module.css';

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

export default function OutRedirector() {
  const searchParams = useSearchParams();
  const url = searchParams.get('url');
  const store = searchParams.get('store');

  useEffect(() => {
    if (!url) {
      window.location.replace('/');
      return;
    }

    try {
      const targetUrl = new URL(url);

      // Validar contra allowlist
      if (!ALLOWED_HOSTNAMES.has(targetUrl.hostname)) {
        console.warn(`Blocked redirect to non-allowlisted domain: ${targetUrl.hostname}`);
        window.location.replace('/');
        return;
      }

      // Affiliate params
      const storeLower = store?.toLowerCase() || '';
      if (storeLower.includes('humble')) {
        targetUrl.searchParams.append('charity', 'gamedeals');
        targetUrl.searchParams.append('partner', 'gamedealsBR');
      } else if (storeLower.includes('eneba')) {
        targetUrl.searchParams.append('af_id', 'gamedeals_prod');
      } else if (storeLower.includes('cdkeys')) {
        targetUrl.searchParams.append('mw_aref', 'gamedeals_link');
      } else if (storeLower.includes('fanatical')) {
        targetUrl.searchParams.append('aff_id', 'gamedeals_fnt');
      } else {
        targetUrl.searchParams.append('ref', 'gamedealsBR_gen');
      }

      const timer = setTimeout(() => {
        window.location.replace(targetUrl.toString());
      }, 1000);

      return () => clearTimeout(timer);
    } catch {
      window.location.replace('/');
    }
  }, [url, store]);

  return (
    <div className={styles.redirectContainer}>
      <div className={styles.spinner}></div>
      <h2>Aplicando Desconto...</h2>
      {store ? (
        <p>
          Transferindo você para a loja parceira <strong>{store}</strong>.
        </p>
      ) : (
        <p>Preparando conexão segura com a loja parceira.</p>
      )}
    </div>
  );
}
