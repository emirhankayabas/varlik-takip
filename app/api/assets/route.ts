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
        const query: any = { userId: session.user.id, type: "BUY" };
        if (market) query.market = market;

        const assets = await Asset.find(query)
            .populate("bankId")
            .sort({ createdAt: -1 });
        return NextResponse.json(assets);
    } catch (error) {
        console.error("API Error (/api/assets):", error);
        return NextResponse.json({
            error: "Veriler alınamadı",
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

        let symbol = body.symbol.toUpperCase();
        const market = body.market || "BIST";

        // Sembolün sonuna .IS ekle (Eğer BIST ise ve kullanıcı eklememişse)
        if (market === "BIST" && !symbol.includes(".")) {
            symbol = `${symbol}.IS`;
        }

        const newAsset = await Asset.create({
            ...body,
            symbol,
            market,
            userId: session.user.id,
        });

        return NextResponse.json(newAsset, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
