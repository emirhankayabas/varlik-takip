import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import VerificationToken from "@/lib/models/VerificationToken";

export async function POST(request: Request) {
    try {
        const { email, token, password } = await request.json();

        if (!email || !token || !password) {
            return NextResponse.json({ error: "Tüm alanlar zorunludur." }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
        }

        const resetToken = await VerificationToken.findOne({
            userId: user._id,
            token: token,
            type: "PASSWORD_RESET",
        });

        if (!resetToken) {
            return NextResponse.json({ error: "Geçersiz veya süresi dolmuş sıfırlama bağlantısı." }, { status: 400 });
        }

        if (new Date() > resetToken.expiresAt) {
            return NextResponse.json({ error: "Sıfırlama bağlantısının süresi dolmuş." }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        user.password = hashedPassword;
        await user.save();

        // Token'ı sil
        await VerificationToken.deleteOne({ _id: resetToken._id });

        return NextResponse.json({ message: "Şifreniz başarıyla güncellendi." }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
