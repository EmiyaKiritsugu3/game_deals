/**
 * Static curated collections data for the Collections Index and Detail pages.
 * Each collection contains CheapShark gameIDs for real-time price fetching.
 * In production, this would be stored in a CMS (Contentful, Sanity, etc.).
 */

export interface Collection {
    slug: string;
    title: string;
    description: string;
    emoji: string;
    gameIDs: string[]; // CheapShark game IDs
}

export const COLLECTIONS: Collection[] = [
    {
        slug: 'best-coop-under-20',
        title: 'Best Co-op Games Under $20',
        description: 'Grab a friend and dive into these incredible cooperative experiences without breaking the bank.',
        emoji: '🤝',
        gameIDs: ['612', '128', '169872', '21048', '162886', '146091'],
    },
    {
        slug: 'rpg-essentials-under-15',
        title: 'RPG Essentials Under $15',
        description: 'Hundreds of hours of adventure packed into budget-friendly prices.',
        emoji: '⚔️',
        gameIDs: ['146091', '136463', '175282', '128', '612'],
    },
    {
        slug: 'horror-marathon',
        title: 'Horror Marathon Pack',
        description: "Sleep is overrated. These spine-chilling titles will keep you up all night — and they're all on sale.",
        emoji: '👻',
        gameIDs: ['169872', '21048', '162886', '612', '128'],
    },
    {
        slug: 'indie-gems-2026',
        title: 'Hidden Indie Gems of 2026',
        description: 'Under-the-radar masterpieces that deserve a spot in your library.',
        emoji: '💎',
        gameIDs: ['128', '136463', '146091', '175282', '612'],
    },
    {
        slug: 'weekend-couch-gaming',
        title: 'Weekend Couch Gaming',
        description: 'Local multiplayer perfection. Pizza, drinks, and these games = unforgettable weekend.',
        emoji: '🎮',
        gameIDs: ['612', '21048', '128', '169872', '162886'],
    },
];
