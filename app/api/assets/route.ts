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
        const assets = await Asset.find({ userId: session.user.id, type: "BUY" })
            .populate("bankId")
            .sort({ createdAt: -1 });
        return NextResponse.json(assets);
    } catch (error) {
        return NextResponse.json({ error: "Veriler alınamadı" }, { status: 500 });
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

        // Sembolün sonuna .IS ekle (eğer borsa değilse ve kullanıcı eklememişse)
        // Bu basit bir varsayımdır, kullanıcı THYAO yazarsa THYAO.IS olur.
        let symbol = body.symbol.toUpperCase();
        if (!symbol.includes(".")) {
            symbol = `${symbol}.IS`;
        }

        const newAsset = await Asset.create({
            ...body,
            symbol,
            userId: session.user.id,
        });

        return NextResponse.json(newAsset, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
