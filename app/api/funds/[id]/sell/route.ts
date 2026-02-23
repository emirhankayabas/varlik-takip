import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FundAsset from "@/lib/models/FundAsset";
import { auth } from "@/lib/auth";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();
        const { amount, sellPrice, sellDate } = body;

        await dbConnect();

        // 1. Orijinal varlığı (BUY işlemini) bul
        const originalAsset = await FundAsset.findOne({
            _id: id,
            userId: session.user.id,
            type: "BUY"
        });

        if (!originalAsset) {
            return NextResponse.json({ error: "Fon varlığı bulunamadı" }, { status: 0 });
        }

        if (originalAsset.amount < amount) {
            return NextResponse.json({ error: "Yetersiz fon adedi" }, { status: 400 });
        }

        // 2. Kar/Zarar Hesapla: (Satış Fiyatı - Alış Fiyatı) * Satılan Adet
        const profit = (sellPrice - originalAsset.buyPrice) * amount;

        // 3. Yeni bir SELL işlemi kaydet (Geçmiş için)
        await FundAsset.create({
            userId: session.user.id,
            symbol: originalAsset.symbol,
            amount: amount,
            buyPrice: sellPrice, // Satış fiyatı
            buyDate: sellDate || new Date(),
            bankId: originalAsset.bankId,
            type: "SELL",
            realizedProfit: profit,
            costBasis: originalAsset.buyPrice, // Alış maliyeti
        });

        // 4. Orijinal varlığın lot sayısını düşür
        if (originalAsset.amount === amount) {
            await FundAsset.findByIdAndDelete(id);
        } else {
            originalAsset.amount -= amount;
            await originalAsset.save();
        }

        return NextResponse.json({ success: true, profit });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
