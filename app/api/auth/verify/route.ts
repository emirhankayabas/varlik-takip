import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import VerificationToken from "@/lib/models/VerificationToken";

export async function POST(request: Request) {
    try {
        const { email, code } = await request.json();

        if (!email || !code) {
            return NextResponse.json({ error: "E-posta ve kod zorunludur." }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
        }

        const verificationToken = await VerificationToken.findOne({
            userId: user._id,
            token: code,
            type: "EMAIL_VERIFICATION",
        });

        if (!verificationToken) {
            return NextResponse.json({ error: "Geçersiz veya süresi dolmuş kod." }, { status: 400 });
        }

        // Kodun süresi dolmuş mu?
        if (new Date() > verificationToken.expiresAt) {
            return NextResponse.json({ error: "Kodun süresi dolmuş." }, { status: 400 });
        }

        // Kullanıcıyı doğrula
        user.emailVerified = true;
        await user.save();

        // Token'ı sil
        await VerificationToken.deleteOne({ _id: verificationToken._id });

        return NextResponse.json({ message: "E-posta başarıyla doğrulandı." }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
