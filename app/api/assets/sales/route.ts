import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Asset from "@/lib/models/Asset";
import Bank from "@/lib/models/Bank";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const market = searchParams.get("market");

    try {
        await dbConnect();

        const query: any = {
            userId: session.user.id,
            type: "SELL"
        };
        if (market) query.market = market;

        // Sadece SELL tipi işlemleri getir (Satışlar)
        const sales = await Asset.find(query)
            .populate("bankId")
            .sort({ buyDate: -1 }); // Satış tarihine göre sırala

        // Toplam gerçekleşen karı hesapla
        const totalRealizedProfit = sales.reduce((sum, sale) => sum + (sale.realizedProfit || 0), 0);

        return NextResponse.json({
            sales,
            totalRealizedProfit
        });
    } catch (error) {
        console.error("API Error (/api/assets/sales):", error);
        return NextResponse.json({
            error: "Satış verileri alınamadı",
            details: error instanceof Error ? error.message : "Bilinmeyen hata"
        }, { status: 500 });
    }
}
