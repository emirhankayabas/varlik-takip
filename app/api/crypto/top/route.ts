import { NextResponse } from "next/server";

let topCoinsCache: any = null;
let lastFetchTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export async function GET() {
    const now = Date.now();

    if (topCoinsCache && (now - lastFetchTime < CACHE_DURATION)) {
        return NextResponse.json(topCoinsCache);
    }

    try {
        const res = await fetch(
            "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false",
            { next: { revalidate: 600 } } // Also use Next.js fetch cache if available
        );

        if (!res.ok) throw new Error("CoinGecko API error");

        const data = await res.json();
        const formattedData = data.map((coin: any) => ({
            id: coin.id,
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            image: coin.image,
            market_cap_rank: coin.market_cap_rank
        }));

        topCoinsCache = formattedData;
        lastFetchTime = now;

        return NextResponse.json(formattedData);
    } catch (error) {
        console.error("Top coins fetch error:", error);
        // Fallback to minimal data if API fails to prevent empty UI
        return NextResponse.json([
            { id: "bitcoin", symbol: "BTC", name: "Bitcoin", image: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png" },
            { id: "ethereum", symbol: "ETH", name: "Ethereum", image: "https://assets.coingecko.com/coins/images/279/small/ethereum.png" },
            { id: "solana", symbol: "SOL", name: "Solana", image: "https://assets.coingecko.com/coins/images/4128/small/solana.png" },
        ]);
    }
}
