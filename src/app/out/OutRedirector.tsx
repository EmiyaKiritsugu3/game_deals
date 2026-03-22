'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

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
            
            // Real Affiliate Mapping Logic
            const storeLower = store?.toLowerCase() || '';
            
            if (storeLower.includes('humble')) {
                targetUrl.searchParams.append('charity', 'gamedeals'); // Example Humble charity param
                targetUrl.searchParams.append('partner', 'gamedealsBR');
            } else if (storeLower.includes('eneba')) {
                targetUrl.searchParams.append('af_id', 'gamedeals_prod');
            } else if (storeLower.includes('cdkeys')) {
                targetUrl.searchParams.append('mw_aref', 'gamedeals_link');
            } else if (storeLower.includes('fanatical')) {
                targetUrl.searchParams.append('aff_id', 'gamedeals_fnt');
            } else {
                // Fallback generic tag
                targetUrl.searchParams.append('ref', 'gamedealsBR_gen');
            }

            // High-trust redirection delay
            const timer = setTimeout(() => {
                window.location.replace(targetUrl.toString());
            }, 1000);

            return () => clearTimeout(timer);
        } catch {
            window.location.replace('/');
        }
    }, [url, store]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
            <div className="mb-6 h-16 w-16 animate-spin rounded-full border-4 border-white/10 border-t-primary"></div>
            <h2 className="mb-2 text-2xl font-black text-white md:text-3xl">Aplicando Desconto...</h2>
            {store ? (
                <p className="text-lg font-medium text-muted-foreground">Transferindo você para a loja parceira <strong className="text-white">{store}</strong>.</p>
            ) : (
                <p className="text-lg font-medium text-muted-foreground">Preparando conexão segura com a loja parceira.</p>
            )}
        </div>
    );
}
