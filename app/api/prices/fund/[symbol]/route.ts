import { NextResponse } from "next/server";
import { fetchFundPrice } from "@/lib/tefas-fetcher";
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
        return NextResponse.json({ error: "Fon kodu gerekli" }, { status: 400 });
    }

    const cacheKey = `FUND_${symbol}`;

    try {
        await dbConnect();

        // 1. Önce Cache'e (MongoDB) bak (eğer forceRefresh değilse)
        if (!forceRefresh) {
            const cachedData = await PriceCache.findOne({ symbol: cacheKey });
            if (cachedData) {
                const now = new Date();
                const createdAt = new Date(cachedData.createdAt);
                const diffInMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

                // Fonlar günlük güncellendiği için 12 saatlik (720 dk) cache yeterli
                if (diffInMinutes < 720) {
                    console.log(`Fon Cache Hit: ${symbol} (${Math.round(diffInMinutes)} dk önce güncellendi)`);
                    return NextResponse.json({
                        symbol: symbol,
                        price: cachedData.price,
                        currency: cachedData.currency,
                        previousClose: cachedData.previousClose,
                        change: cachedData.change,
                        changePercent: cachedData.changePercent,
                        name: cachedData.name || symbol,
                        isCached: true,
                        cachedAt: cachedData.createdAt,
                        cachedAtFormatted: new Date(cachedData.createdAt).toLocaleString("tr-TR", {
                            timeZone: "Europe/Istanbul",
                            day: "2-digit",
                            month: "2-digit",
                            year: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                        }).replace(",", "")
                    });
                }
            }
        } else {
            console.log(`Force Refresh: ${symbol} (Fund). Bypassing cache...`);
        }

        console.log(`Fetching from TEFAS: ${symbol}...`);
        // 2. TEFAS'tan çek
        const fundData = await fetchFundPrice(symbol);

        if (!fundData) {
            return NextResponse.json({ error: "Fon bulunamadı" }, { status: 404 });
        }

        const responseData = {
            symbol: symbol,
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

        return NextResponse.json({
            ...responseData,
            isCached: false,
            cachedAt: new Date(),
            cachedAtFormatted: new Date().toLocaleString("tr-TR", {
                timeZone: "Europe/Istanbul",
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            }).replace(",", "")
        });
    } catch (error) {
        console.error("Fon fiyat çekme hatası:", error);
        return NextResponse.json(
            { error: "Fon bilgisi alınamadı" },
            { status: 500 }
        );
    }
}
