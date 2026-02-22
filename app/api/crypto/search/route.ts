import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
        return NextResponse.json([]);
    }

    try {
        const res = await fetch(`https://api.coingecko.com/api/v3/search?query=${query}`);
        if (!res.ok) throw new Error("CoinGecko search error");

        const data = await res.json();

        // Format results and filter for coins only (CoinGecko returns NFTs, Exchanges etc too)
        const formattedResults = data.coins.slice(0, 50).map((coin: any) => ({
            id: coin.id,
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            image: coin.large || coin.thumb,
            market_cap_rank: coin.market_cap_rank
        }));

        return NextResponse.json(formattedResults || []);
    } catch (error) {
        console.error("Crypto search error:", error);
        return NextResponse.json({ error: "Arama yapılamadı" }, { status: 500 });
    }
}
