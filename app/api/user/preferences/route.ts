import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { auth } from "@/lib/auth";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    try {
        await dbConnect();
        const user = await User.findById(session.user.id).select("cryptoWatchlist");

        let watchlist = user?.cryptoWatchlist || [];

        // Migration: If it's old string format
        if (watchlist.length > 0 && typeof watchlist[0] === 'string') {
            const COIN_MAP: Record<string, { id: string, name: string, image: string }> = {
                BTC: { id: "bitcoin", name: "Bitcoin", image: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png" },
                ETH: { id: "ethereum", name: "Ethereum", image: "https://assets.coingecko.com/coins/images/279/small/ethereum.png" },
                SOL: { id: "solana", name: "Solana", image: "https://assets.coingecko.com/coins/images/4128/small/solana.png" },
                XRP: { id: "ripple", name: "Ripple", image: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png" },
                DOGE: { id: "dogecoin", name: "Dogecoin", image: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png" },
            };
            watchlist = (watchlist as any).map((s: string) => ({
                id: COIN_MAP[s]?.id || s.toLowerCase(),
                symbol: s,
                name: COIN_MAP[s]?.name || s,
                image: COIN_MAP[s]?.image || ""
            }));
        }

        if (watchlist.length === 0) {
            watchlist = [
                { id: "bitcoin", symbol: "BTC", name: "Bitcoin", image: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png" },
                { id: "ethereum", symbol: "ETH", name: "Ethereum", image: "https://assets.coingecko.com/coins/images/279/small/ethereum.png" },
                { id: "solana", symbol: "SOL", name: "Solana", image: "https://assets.coingecko.com/coins/images/4128/small/solana.png" },
                { id: "ripple", symbol: "XRP", name: "Ripple", image: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png" },
                { id: "dogecoin", symbol: "DOGE", name: "Dogecoin", image: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png" },
            ];
        }

        return NextResponse.json({ watchlist });
    } catch (error) {
        return NextResponse.json({ error: "Tercihler alınamadı" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    try {
        const { watchlist } = await request.json();
        if (!Array.isArray(watchlist)) {
            return NextResponse.json({ error: "Geçersiz veri formatı" }, { status: 400 });
        }

        await dbConnect();
        await User.findByIdAndUpdate(session.user.id, {
            cryptoWatchlist: watchlist
        });

        return NextResponse.json({ success: true, watchlist });
    } catch (error) {
        return NextResponse.json({ error: "Tercihler kaydedilemedi" }, { status: 500 });
    }
}
