import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Asset from "@/lib/models/Asset";
import { auth } from "@/lib/auth";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    try {
        await dbConnect();
        const { id } = await params;
        const deletedAsset = await Asset.findOneAndDelete({
            _id: id,
            userId: session.user.id,
        });

        if (!deletedAsset) {
            return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
        }

        return NextResponse.json({ message: "Başarıyla silindi" });
    } catch (error) {
        return NextResponse.json({ error: "Silme işlemi başarısız" }, { status: 500 });
    }
}
