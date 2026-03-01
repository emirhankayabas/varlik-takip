import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Goal from "@/lib/models/Goal";
import { auth } from "@/lib/auth";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    try {
        await dbConnect();
        const goals = await Goal.find({ userId: session.user.id }).sort({ createdAt: -1 });
        return NextResponse.json(goals);
    } catch (error) {
        console.error("API Error (/api/goals):", error);
        return NextResponse.json({ error: "Hedefler alınamadı" }, { status: 500 });
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

        // Metadata alanlarını temizle
        const { _id, userId: _, createdAt, updatedAt, ...goalData } = body;

        const newGoal = await Goal.create({
            ...goalData,
            userId: session.user.id,
        });

        return NextResponse.json(newGoal, { status: 201 });
    } catch (error: any) {
        console.error("POST /api/goals Error:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
