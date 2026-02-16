import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import PublicOffering from "@/lib/models/PublicOffering";
import { auth } from "@/lib/auth";

export async function PATCH(
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

        const updatedOffering = await PublicOffering.findOneAndUpdate(
            { _id: id, userId: session.user.id },
            { ...body },
            { new: true }
        );

        if (!updatedOffering) {
            return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
        }

        return NextResponse.json(updatedOffering);
    } catch (error: any) {
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

        const deletedOffering = await PublicOffering.findOneAndDelete({
            _id: id,
            userId: session.user.id,
        });

        if (!deletedOffering) {
            return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
        }

        return NextResponse.json({ message: "Başarıyla silindi" });
    } catch (error) {
        return NextResponse.json({ error: "Silme işlemi başarısız" }, { status: 500 });
    }
}
