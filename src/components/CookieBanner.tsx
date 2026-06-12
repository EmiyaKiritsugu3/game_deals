'use client';

import { useEffect, useState } from 'react';

const COOKIE_KEY = 'gd_cookie_consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem(COOKIE_KEY, 'rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(0,0,0,0.95)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        padding: '1rem 1.5rem',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
        backdropFilter: 'blur(10px)',
      }}
    >
      <p style={{ margin: 0, fontSize: '0.875rem', color: '#ccc', flex: 1 }}>
        🍪 Usamos cookies pra melhorar sua experiência e rastrear cliques em links de afiliados. Ao
        continuar navegando, você concisa com nossa{' '}
        <a href="/privacy" style={{ color: '#4ade80' }}>
          Política de Privacidade.
        </a>
      </p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={reject}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#999',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          Rejeitar
        </button>
        <button
          type="button"
          onClick={accept}
          style={{
            background: '#4ade80',
            border: 'none',
            color: '#000',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.875rem',
          }}
        >
          Aceitar
        </button>
      </div>
    </div>
  );
}
