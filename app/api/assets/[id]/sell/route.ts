import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Asset from "@/lib/models/Asset";
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
        const originalAsset = await Asset.findOne({
            _id: id,
            userId: session.user.id,
            type: "BUY"
        });

        if (!originalAsset) {
            return NextResponse.json({ error: "Varlık bulunamadı" }, { status: 0 });
        }

        if (originalAsset.amount < amount) {
            return NextResponse.json({ error: "Yetersiz lot miktarı" }, { status: 400 });
        }

        // 2. Kar/Zarar Hesapla: (Satış Fiyatı - Alış Fiyatı) * Satılan Adet
        const profit = (sellPrice - originalAsset.buyPrice) * amount;

        // 3. Yeni bir SELL işlemi kaydet (Geçmiş için)
        await Asset.create({
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
            // Eğer tümü satıldıysa, bu BUY kaydını "KAPALİ" yapabiliriz veya silebiliriz.
            // Şimdilik siliyoruz ya da amount'u 0 yapıyoruz (Table'da görünüp görünmemesi GET'te ayarlanır)
            await Asset.findByIdAndDelete(id);
        } else {
            originalAsset.amount -= amount;
            await originalAsset.save();
        }

        return NextResponse.json({ success: true, profit });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
