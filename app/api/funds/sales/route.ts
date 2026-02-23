import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FundAsset from "@/lib/models/FundAsset";
import { auth } from "@/lib/auth";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    try {
        await dbConnect();

        // Sadece SELL tipi işlemleri getir (Satışlar)
        const sales = await FundAsset.find({
            userId: session.user.id,
            type: "SELL"
        })
            .populate("bankId")
            .sort({ buyDate: -1 });

        // Toplam gerçekleşen karı hesapla
        const totalRealizedProfit = sales.reduce((sum, sale) => sum + (sale.realizedProfit || 0), 0);

        return NextResponse.json({
            sales,
            totalRealizedProfit
        });
    } catch (error) {
        console.error("API Error (/api/funds/sales):", error);
        return NextResponse.json({
            error: "Fon satış verileri alınamadı",
            details: error instanceof Error ? error.message : "Bilinmeyen hata"
        }, { status: 500 });
    }
}
