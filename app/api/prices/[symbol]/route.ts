import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ symbol: string }> }
) {
    const { symbol } = await params;

    if (!symbol) {
        return NextResponse.json({ error: "Sembol gerekli" }, { status: 400 });
    }

    try {
        // Yahoo Finance Query API
        const response = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
            {
                next: { revalidate: 60 }, // 1 dakika cache
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

        return NextResponse.json({
            symbol,
            price,
            currency,
            previousClose,
            change: price - previousClose,
            changePercent: ((price - previousClose) / previousClose) * 100,
        });
    } catch (error) {
        console.error("Fiyat çekme hatası:", error);
        return NextResponse.json(
            { error: "Fiyat bilgisi alınamadı" },
            { status: 500 }
        );
    }
}
