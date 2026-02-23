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
        const funds = await FundAsset.find({
            userId: session.user.id,
            type: { $ne: "SELL" } // Sadece aktif fonları getir
        })
            .populate("bankId")
            .sort({ createdAt: -1 });
        return NextResponse.json(funds);
    } catch (error) {
        console.error("API Error (/api/funds):", error);
        return NextResponse.json({
            error: "Fon verileri alınamadı",
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

        const newFund = await FundAsset.create({
            ...body,
            userId: session.user.id,
            symbol: body.symbol.toUpperCase(),
        });

        return NextResponse.json(newFund, { status: 201 });
    } catch (error: any) {
        console.error("API Error (POST /api/funds):", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
