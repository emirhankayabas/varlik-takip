import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import VerificationToken from "@/lib/models/VerificationToken";
import { sendVerificationEmail } from "@/lib/resend";
import crypto from "crypto";

export async function POST(request: Request) {
    try {
        const { email, password, name } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "E-posta ve şifre zorunludur." },
                { status: 400 }
            );
        }

        await dbConnect();

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { error: "Bu e-posta adresi zaten kullanımda." },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            email,
            password: hashedPassword,
            name,
            emailVerified: false,
        });

        // 6 haneli doğrulama kodu üret
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Kodunu DB'ye kaydet
        await VerificationToken.create({
            userId: user._id,
            token: verificationCode,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 dakika
            type: "EMAIL_VERIFICATION",
        });

        // E-posta gönder
        await sendVerificationEmail(email, verificationCode);

        return NextResponse.json(
            {
                message: "Hesap oluşturuldu. E-posta adresinize doğrulama kodu gönderildi.",
                userId: user._id,
                pendingVerification: true
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Register Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
