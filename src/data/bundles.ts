/**
 * Simulated bundle data for the Bundles Aggregator page.
 * In production, this would come from APIs like Humble Bundle, Fanatical, etc.
 */

export interface BundleGame {
    title: string;
    retailPrice: number;
    thumb: string;
}

export interface Bundle {
    id: string;
    name: string;
    store: string;
    storeIcon: string;
    price: number;
    totalValue: number;
    expiresAt: string; // ISO date string
    games: BundleGame[];
    url: string;
    tier?: string;
}

export const BUNDLES: Bundle[] = [
    {
        id: 'humble-choice-mar-2026',
        name: 'Humble Choice — March 2026',
        store: 'Humble Bundle',
        storeIcon: 'https://www.humblebundle.com/favicon.ico',
        price: 11.99,
        totalValue: 189.92,
        expiresAt: '2026-04-01T00:00:00Z',
        tier: 'Choice',
        url: '/out?url=https://www.humblebundle.com/membership&store=Humble%20Bundle',
        games: [
            { title: 'DOOM Eternal', retailPrice: 39.99, thumb: 'https://cdn.cloudflare.steamstatic.com/steam/apps/782330/header.jpg' },
            { title: 'Celeste', retailPrice: 19.99, thumb: 'https://cdn.cloudflare.steamstatic.com/steam/apps/504230/header.jpg' },
            { title: 'Slay the Spire', retailPrice: 24.99, thumb: 'https://cdn.cloudflare.steamstatic.com/steam/apps/646570/header.jpg' },
            { title: 'Outer Wilds', retailPrice: 24.99, thumb: 'https://cdn.cloudflare.steamstatic.com/steam/apps/753640/header.jpg' },
            { title: 'Hades', retailPrice: 24.99, thumb: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/header.jpg' },
            { title: 'Inscryption', retailPrice: 19.99, thumb: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1092790/header.jpg' },
            { title: 'Disco Elysium', retailPrice: 34.99, thumb: 'https://cdn.cloudflare.steamstatic.com/steam/apps/632470/header.jpg' },
        ],
    },
    {
        id: 'fanatical-platinum-mar-2026',
        name: 'Platinum Collection — Build Your Own',
        store: 'Fanatical',
        storeIcon: 'https://www.fanatical.com/favicon.ico',
        price: 9.99,
        totalValue: 119.95,
        expiresAt: '2026-03-28T00:00:00Z',
        tier: '5 Games',
        url: '/out?url=https://www.fanatical.com/en/pick-and-mix&store=Fanatical',
        games: [
            { title: 'Control Ultimate', retailPrice: 29.99, thumb: 'https://cdn.cloudflare.steamstatic.com/steam/apps/870780/header.jpg' },
            { title: 'Ghostrunner', retailPrice: 29.99, thumb: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1139900/header.jpg' },
            { title: 'Katana ZERO', retailPrice: 14.99, thumb: 'https://cdn.cloudflare.steamstatic.com/steam/apps/460950/header.jpg' },
            { title: 'Hollow Knight', retailPrice: 14.99, thumb: 'https://cdn.cloudflare.steamstatic.com/steam/apps/367520/header.jpg' },
            { title: 'Cuphead', retailPrice: 19.99, thumb: 'https://cdn.cloudflare.steamstatic.com/steam/apps/268910/header.jpg' },
        ],
    },
    {
        id: 'humble-indie-2026',
        name: 'Indie Hits Bundle',
        store: 'Humble Bundle',
        storeIcon: 'https://www.humblebundle.com/favicon.ico',
        price: 14.99,
        totalValue: 159.92,
        expiresAt: '2026-04-10T00:00:00Z',
        tier: 'Full Pack',
        url: '/out?url=https://www.humblebundle.com/games/indie-hits&store=Humble%20Bundle',
        games: [
            { title: 'Stardew Valley', retailPrice: 14.99, thumb: 'https://cdn.cloudflare.steamstatic.com/steam/apps/413150/header.jpg' },
            { title: 'Terraria', retailPrice: 9.99, thumb: 'https://cdn.cloudflare.steamstatic.com/steam/apps/105600/header.jpg' },
            { title: 'Dead Cells', retailPrice: 24.99, thumb: 'https://cdn.cloudflare.steamstatic.com/steam/apps/588650/header.jpg' },
            { title: 'Ori and the Blind Forest', retailPrice: 19.99, thumb: 'https://cdn.cloudflare.steamstatic.com/steam/apps/261570/header.jpg' },
            { title: 'Risk of Rain 2', retailPrice: 24.99, thumb: 'https://cdn.cloudflare.steamstatic.com/steam/apps/632360/header.jpg' },
            { title: 'Subnautica', retailPrice: 29.99, thumb: 'https://cdn.cloudflare.steamstatic.com/steam/apps/264710/header.jpg' },
            { title: 'Undertale', retailPrice: 9.99, thumb: 'https://cdn.cloudflare.steamstatic.com/steam/apps/391540/header.jpg' },
            { title: 'Rimworld', retailPrice: 34.99, thumb: 'https://cdn.cloudflare.steamstatic.com/steam/apps/294100/header.jpg' },
        ],
    },
];
