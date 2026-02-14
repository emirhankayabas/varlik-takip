import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Asset from "@/lib/models/Asset";
import { auth } from "@/lib/auth";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    try {
        await dbConnect();

        // Sadece SELL tipi işlemleri getir (Satışlar)
        const sales = await Asset.find({
            userId: session.user.id,
            type: "SELL"
        })
            .populate("bankId")
            .sort({ buyDate: -1 }); // Satış tarihine göre sırala

        // Toplam gerçekleşen karı hesapla
        const totalRealizedProfit = sales.reduce((sum, sale) => sum + (sale.realizedProfit || 0), 0);

        return NextResponse.json({
            sales,
            totalRealizedProfit
        });
    } catch (error) {
        return NextResponse.json({ error: "Satış verileri alınamadı" }, { status: 500 });
    }
}
