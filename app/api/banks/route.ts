import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Bank from "@/lib/models/Bank";
import { auth } from "@/lib/auth";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    try {
        await dbConnect();
        const banks = await Bank.find({ userId: session.user.id }).sort({ name: 1 });
        return NextResponse.json(banks);
    } catch (error) {
        return NextResponse.json({ error: "Bankalar alınamadı" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    try {
        const { name } = await request.json();
        if (!name) return NextResponse.json({ error: "Banka adı zorunludur" }, { status: 400 });

        await dbConnect();
        const newBank = await Bank.create({
            name,
            userId: session.user.id,
        });

        return NextResponse.json(newBank, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
