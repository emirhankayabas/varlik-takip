import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Goal from "@/lib/models/Goal";
import { auth } from "@/lib/auth";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json();
        await dbConnect();

        // Metadata alanlarını temizle
        const { _id, userId, createdAt, updatedAt, ...updateData } = body;

        const goal = await Goal.findOneAndUpdate(
            { _id: id, userId: session.user.id },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!goal) {
            return NextResponse.json({ error: "Hedef bulunamadı" }, { status: 404 });
        }

        return NextResponse.json(goal);
    } catch (error: any) {
        console.error("PUT /api/goals/[id] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    try {
        const { id } = await params;
        await dbConnect();
        const goal = await Goal.findOneAndDelete({
            _id: id,
            userId: session.user.id,
        });

        if (!goal) {
            return NextResponse.json({ error: "Hedef bulunamadı" }, { status: 404 });
        }

        return NextResponse.json({ message: "Hedef başarıyla silindi" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
