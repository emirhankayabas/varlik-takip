import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import PriceCache from "@/lib/models/PriceCache";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ symbol: string }> }
) {
    const { symbol: rawSymbol } = await params;
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "true";
    const symbol = rawSymbol?.toUpperCase();

    if (!symbol) {
        return NextResponse.json({ error: "Sembol gerekli" }, { status: 400 });
    }

    try {
        await dbConnect();

        // 1. Önce Cache'e (MongoDB) bak (eğer forceRefresh değilse)
        if (!forceRefresh) {
            const cachedData = await PriceCache.findOne({ symbol });
            if (cachedData) {
                const now = new Date();
                const createdAt = new Date(cachedData.createdAt);
                const diffInMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

                // Eğer 5 dakikadan kısaysa cache'den dön
                if (diffInMinutes < 5) {
                    console.log(`Cache Hit: ${symbol} (${Math.round(diffInMinutes * 60)}s old)`);
                    return NextResponse.json({
                        symbol: cachedData.symbol,
                        price: cachedData.price,
                        currency: cachedData.currency,
                        previousClose: cachedData.previousClose,
                        change: cachedData.change,
                        changePercent: cachedData.changePercent,
                        isCached: true,
                        cachedAt: cachedData.createdAt
                    }, {
                        headers: {
                            "Cache-Control": "no-store, max-age=0"
                        }
                    });
                } else {
                    console.log(`Cache Stale: ${symbol}. Re-fetching...`);
                }
            }
        } else {
            console.log(`Force Refresh: ${symbol}. Bypassing cache...`);
        }

        console.log(`Fetching from Yahoo Finance: ${symbol}...`);

        // 2. Yahoo Finance'den çek (Tahmin edilenden daha taze veri için cache: "no-store")
        const response = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
            {
                cache: "no-store", // Next.js fetch cache'ini tamamen kapatıyoruz
            }
        );

        if (!response.ok) {
            throw new Error(`Yahoo Finance yanıt vermedi: ${response.status}`);
        }

        const data = await response.json();
        const result = data.chart.result?.[0];

        if (!result) {
            return NextResponse.json({ error: "Hisse bulunamadı" }, { status: 404 });
        }

        const price = result.meta.regularMarketPrice;
        const currency = result.meta.currency;
        const previousClose = result.meta.previousClose;

        const responseData = {
            symbol,
            price,
            currency,
            previousClose,
            change: price - previousClose,
            changePercent: ((price - previousClose) / previousClose) * 100,
        };

        // 3. Çekilen veriyi Cache'e (MongoDB) kaydet
        await PriceCache.findOneAndUpdate(
            { symbol },
            { ...responseData, createdAt: new Date() },
            { upsert: true, returnDocument: "after" }
        );

        return NextResponse.json(
            { ...responseData, isCached: false, cachedAt: new Date() },
            {
                headers: {
                    "Cache-Control": "no-store, max-age=0"
                }
            }
        );
    } catch (error) {
        console.error("Fiyat çekme hatası:", error);
        return NextResponse.json(
            { error: "Fiyat bilgisi alınamadı" },
            { status: 500 }
        );
    }
}
