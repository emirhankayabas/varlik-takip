import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import PriceCache from "@/lib/models/PriceCache";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ symbol: string }> }
) {
    const { symbol } = await params;

    if (!symbol) {
        return NextResponse.json({ error: "Sembol gerekli" }, { status: 400 });
    }

    try {
        await dbConnect();

        // 1. Önce Cache'e (MongoDB) bak
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
                    isCached: true
                }, {
                    headers: {
                        "Cache-Control": "no-store, max-age=0"
                    }
                });
            } else {
                console.log(`Cache Stale: ${symbol}. Re-fetching...`);
            }
        }

        console.log(`Cache Miss: ${symbol}. Fetching from API...`);

        // 2. Cache'de yoksa Yahoo Finance'den çek
        const response = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
            {
                next: { revalidate: 300 }, // Next.js seviyesinde de 5 dk tut
            }
        );

        if (!response.ok) {
            throw new Error("Yahoo Finance yanıt vermedi");
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
        // (Vercel'de arka planda sessizce yapabiliriz ama burada beklemek daha garanti)
        await PriceCache.findOneAndUpdate(
            { symbol },
            { ...responseData, createdAt: new Date() },
            { upsert: true, returnDocument: "after" }
        );

        return NextResponse.json(
            { ...responseData, isCached: false },
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
