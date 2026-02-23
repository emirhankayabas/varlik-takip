import { NextResponse } from "next/server";
import { fetchFundPrice } from "@/lib/tefas-fetcher";
import dbConnect from "@/lib/db";
import PriceCache from "@/lib/models/PriceCache";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ symbol: string }> }
) {
    const { symbol } = await params;

    if (!symbol) {
        return NextResponse.json({ error: "Fon kodu gerekli" }, { status: 400 });
    }

    const cacheKey = `FUND_${symbol.toUpperCase()}`;

    try {
        await dbConnect();

        // 1. Önce Cache'e (MongoDB) bak
        const cachedData = await PriceCache.findOne({ symbol: cacheKey });
        if (cachedData) {
            const now = new Date();
            const createdAt = new Date(cachedData.createdAt);
            const diffInMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

            // Eğer 30 dakikadan kısaysa cache'den dön (Fonlar günlük güncellenir)
            if (diffInMinutes < 30) {
                return NextResponse.json({
                    symbol: symbol.toUpperCase(),
                    price: cachedData.price,
                    currency: cachedData.currency,
                    previousClose: cachedData.previousClose,
                    change: cachedData.change,
                    changePercent: cachedData.changePercent,
                    name: cachedData.name || symbol,
                    isCached: true
                });
            }
        }

        // 2. TEFAS'tan çek
        const fundData = await fetchFundPrice(symbol);

        if (!fundData) {
            return NextResponse.json({ error: "Fon bulunamadı" }, { status: 404 });
        }

        const responseData = {
            symbol: symbol.toUpperCase(),
            price: fundData.FIYAT,
            currency: "TRY",
            previousClose: fundData.FIYAT / (1 + fundData.GUNLUK_GETIRI / 100),
            change: fundData.FIYAT - (fundData.FIYAT / (1 + fundData.GUNLUK_GETIRI / 100)),
            changePercent: fundData.GUNLUK_GETIRI,
            name: fundData.AD
        };

        // 3. Cache'e kaydet
        await PriceCache.findOneAndUpdate(
            { symbol: cacheKey },
            { ...responseData, symbol: cacheKey, createdAt: new Date() },
            { upsert: true }
        );

        return NextResponse.json({ ...responseData, isCached: false });
    } catch (error) {
        console.error("Fon fiyat çekme hatası:", error);
        return NextResponse.json(
            { error: "Fon bilgisi alınamadı" },
            { status: 500 }
        );
    }
}
