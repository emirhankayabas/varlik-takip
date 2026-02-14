import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Bank from "@/lib/models/Bank";
import { auth } from "@/lib/auth";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    try {
        await dbConnect();
        const deletedBank = await Bank.findOneAndDelete({
            _id: id,
            userId: session.user.id,
        });

        if (!deletedBank) {
            return NextResponse.json({ error: "Banka bulunamadı" }, { status: 404 });
        }

        return NextResponse.json({ message: "Banka silindi" });
    } catch (error) {
        return NextResponse.json({ error: "Silme işlemi başarısız" }, { status: 500 });
    }
}
