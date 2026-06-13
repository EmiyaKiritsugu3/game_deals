import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Existing patterns
      { protocol: 'https', hostname: 'cdn.cloudflare.steamstatic.com' },
      { protocol: 'https', hostname: 'steamcdn-a.akamaihd.net' },
      { protocol: 'https', hostname: 'img.cheapshark.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      // Store favicon CDNs (from STORE_FAVICON_MAP)
      { protocol: 'https', hostname: 'games.indiegala.com', pathname: '/**' },
      { protocol: 'https', hostname: 'microsoft.com', pathname: '/**' },
      { protocol: 'https', hostname: 'store.epicgames.com', pathname: '/**' },
      { protocol: 'https', hostname: 'www.amazon.com', pathname: '/**' },
      { protocol: 'https', hostname: 'www.cdkeys.com', pathname: '/**' },
      { protocol: 'https', hostname: 'www.dlgamer.com', pathname: '/**' },
      { protocol: 'https', hostname: 'www.eneba.com', pathname: '/**' },
      { protocol: 'https', hostname: 'www.epic.com', pathname: '/**' },
      { protocol: 'https', hostname: 'www.fanatical.com', pathname: '/**' },
      { protocol: 'https', hostname: 'www.gamebillet.com', pathname: '/**' },
      { protocol: 'https', hostname: 'www.gamersgate.com', pathname: '/**' },
      { protocol: 'https', hostname: 'www.gamesplanet.com', pathname: '/**' },
      { protocol: 'https', hostname: 'www.gamivo.com', pathname: '/**' },
      { protocol: 'https', hostname: 'www.gog.com', pathname: '/**' },
      { protocol: 'https', hostname: 'www.greenmangaming.com', pathname: '/**' },
      { protocol: 'https', hostname: 'www.humblebundle.com', pathname: '/**' },
      { protocol: 'https', hostname: 'www.indiegamestand.com', pathname: '/**' },
      { protocol: 'https', hostname: 'www.kinguin.net', pathname: '/**' },
      { protocol: 'https', hostname: 'www.nuuvem.com', pathname: '/**' },
      { protocol: 'https', hostname: 'www.origin.com', pathname: '/**' },
      { protocol: 'https', hostname: 'www.steampowered.com', pathname: '/**' },
      { protocol: 'https', hostname: 'www.voidu.com', pathname: '/**' },
      { protocol: 'https', hostname: 'www.wingamestore.com', pathname: '/**' },
    ],
  },
};

export default nextConfig;
