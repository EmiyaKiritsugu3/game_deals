import { getDeals, getGame } from './src/services/api';

async function testHL() {
    console.log("Fetching candidates...");
    const candidates = await getDeals({ sortBy: 'Deal Rating', pageSize: '50', onSale: '1' });
    console.log(`Found ${candidates.length} candidates.`);

    const results = await Promise.all(candidates.map(async (deal) => {
        try {
            const gameInfo = await getGame(deal.gameID);
            if (!gameInfo || !gameInfo.cheapestPriceEver) return null;
            const currentPrice = parseFloat(deal.salePrice);
            const historicalLow = parseFloat(gameInfo.cheapestPriceEver.price);
            const isHL = currentPrice <= historicalLow * 1.01;
            console.log(`- ${deal.title}: Current $${currentPrice}, HL $${historicalLow} -> ${isHL ? 'YES' : 'NO'}`);
            return isHL ? deal : null;
        } catch {
            return null;
        }
    }));

    const verified = results.filter(r => r !== null);
    console.log(`Total Verified HLs: ${verified.length}`);
}

testHL();
