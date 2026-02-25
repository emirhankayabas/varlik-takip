import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import VerificationToken from "@/lib/models/VerificationToken";
import { sendVerificationEmail } from "@/lib/resend";

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: "E-posta zorunludur." }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
        }

        if (user.emailVerified) {
            return NextResponse.json({ error: "Hesap zaten doğrulanmış." }, { status: 400 });
        }

        // Eski token'ları sil (varsa)
        await VerificationToken.deleteMany({ userId: user._id, type: "EMAIL_VERIFICATION" });

        // Yeni kod üret
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        await VerificationToken.create({
            userId: user._id,
            token: verificationCode,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 dakika
            type: "EMAIL_VERIFICATION",
        });

        await sendVerificationEmail(email, verificationCode);

        return NextResponse.json({ message: "Yeni kod gönderildi." }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
