import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import VerificationToken from "@/lib/models/VerificationToken";
import { sendPasswordResetEmail } from "@/lib/resend";
import crypto from "crypto";

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: "E-posta zorunludur." }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findOne({ email });
        if (!user) {
            // Güvenlik için kullanıcı bulunmasa bile başarılıymış gibi davranabiliriz (User Enumeration engellemek için)
            // Ama çoğu küçük projede bilgilendirici hata istenir.
            return NextResponse.json({ message: "Eğer bu e-posta adresi kayıtlıysa, şifre sıfırlama bağlantısı gönderilecektir." }, { status: 200 });
        }

        // Eski şifre sıfırlama token'larını sil
        await VerificationToken.deleteMany({ userId: user._id, type: "PASSWORD_RESET" });

        // Rastgele bir token üret (şifre sıfırlama için linkte kullanılacak)
        const resetToken = crypto.randomBytes(32).toString("hex");

        await VerificationToken.create({
            userId: user._id,
            token: resetToken,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 dakika
            type: "PASSWORD_RESET",
        });

        await sendPasswordResetEmail(email, resetToken);

        return NextResponse.json({ message: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi." }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
