import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import PublicOffering from "@/lib/models/PublicOffering";
import Asset from "@/lib/models/Asset";
import { auth } from "@/lib/auth";

// Otomatik Portföye Aktarma Kontrolü
async function checkAndProcessIPOs(userId: string) {
    const now = new Date();

    // Türkiye saati ile 10:00 kontrolü (Borsa açılışı)
    // Türkiye (GMT+3) 10:00, UTC 07:00'ye tekabül eder.
    const isAfterOpening = now.getUTCHours() >= 7;

    if (!isAfterOpening) return;

    // Statusu ALLOCATED olan ve listingDate'i bugün veya geçmiş olanları bul
    // listingDate'in sadece gününü karşılaştırmak için UTC başlangıcına çekelim
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const ripeIPOs = await PublicOffering.find({
        userId,
        status: "ALLOCATED",
        listingDate: { $lte: now }
    });

    for (const ipo of ripeIPOs) {
        // Sembolün sonuna .IS ekle (eğer borsa değilse ve kullanıcı eklememişse)
        let symbol = ipo.symbol.toUpperCase();
        if (!symbol.includes(".")) {
            symbol = `${symbol}.IS`;
        }

        // Assets tablosuna ekle
        await Asset.create({
            userId,
            symbol,
            amount: ipo.allocatedAmount,
            buyPrice: ipo.price,
            buyDate: ipo.listingDate || now,
            bankId: ipo.bankId,
            type: "BUY",
            market: "BIST"
        });

        // IPO durumunu güncelle
        ipo.status = "PORTFOLIO";
        await ipo.save();
    }
}

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    try {
        await dbConnect();

        // Verileri çekmeden önce otomatik aktarma kontrolünü çalıştır
        await checkAndProcessIPOs(session.user.id);

        const offerings = await PublicOffering.find({
            userId: session.user.id,
            status: { $ne: "PORTFOLIO" }
        })
            .populate("bankId")
            .sort({ createdAt: -1 });

        return NextResponse.json(offerings);
    } catch (error) {
        console.error("API Error (/api/public-offerings):", error);
        return NextResponse.json({
            error: "Halka arz verileri alınamadı",
            details: error instanceof Error ? error.message : "Bilinmeyen hata"
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    try {
        const body = await request.json();
        await dbConnect();

        // Sembolün sonuna .IS ekle
        let symbol = body.symbol.toUpperCase();
        if (!symbol.includes(".")) {
            symbol = `${symbol}.IS`;
        }

        const newOffering = await PublicOffering.create({
            ...body,
            symbol,
            userId: session.user.id,
            status: "PENDING"
        });

        return NextResponse.json(newOffering, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
