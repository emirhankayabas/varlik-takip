import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (email: string, code: string) => {
    try {
        const { data, error } = await resend.emails.send({
            from: "Varlık Takip <noreply@varliktakip.com.tr>",
            to: email,
            subject: "E-posta Doğrulama Kodu",
            html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                </style>
            </head>
            <body style="margin: 0; padding: 0; background-color: #09090b; color: #fafafa;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 20px;">
                    <tr>
                        <td align="center">
                            <table width="100%" max-width="500" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #09090b;">
                                <!-- Logo/Header -->
                                <tr>
                                    <td align="center" style="padding-bottom: 32px;">
                                        <div style="height: 40px; width: 40px; background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; display: inline-block; line-height: 40px; text-align: center;">
                                            <span style="font-size: 20px; color: #fff;">V</span>
                                        </div>
                                        <h1 style="margin: 16px 0 0 0; font-size: 24px; font-weight: 600; letter-spacing: -0.025em; color: #ffffff;">Varlık Takip</h1>
                                        <p style="margin: 4px 0 0 0; font-size: 14px; color: #a1a1aa;">Yatırım Portföy Yönetimi</p>
                                    </td>
                                </tr>
                                <!-- Main Card -->
                                <tr>
                                    <td style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 40px; text-align: center;">
                                        <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #ffffff;">Doğrulama Kodunuz</h2>
                                        <p style="margin: 0 0 32px 0; font-size: 14px; line-height: 24px; color: #a1a1aa;">Hesabınızı doğrulamak ve güvenle işlem yapmak için aşağıdaki 6 haneli kodu kullanın.</p>
                                        
                                        <!-- OTP Display -->
                                        <div style="background-color: #09090b; border: 1px solid #27272a; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                                            <span style="font-size: 32px; font-weight: 700; letter-spacing: 12px; color: #ffffff; font-family: monospace;">${code}</span>
                                        </div>

                                        <p style="margin: 0; font-size: 12px; color: #71717a;">Bu kod 10 dakika boyunca geçerlidir.</p>
                                    </td>
                                </tr>
                                <!-- Footer -->
                                <tr>
                                    <td align="center" style="padding-top: 32px;">
                                        <p style="margin: 0; font-size: 12px; color: #52525b; line-height: 18px;">
                                            Eğer bu talebi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.<br>
                                            &copy; 2026 Varlık Takip. Tüm hakları saklıdır.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `,
        });

        if (error) {
            console.error("Resend Error:", error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error("Resend Catch Error:", error);
        return { success: false, error };
    }
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
    const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}&email=${email}`;

    try {
        const { data, error } = await resend.emails.send({
            from: "Varlık Takip <noreply@varliktakip.com.tr>",
            to: email,
            subject: "Şifre Sıfırlama Talebi",
            html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                </style>
            </head>
            <body style="margin: 0; padding: 0; background-color: #09090b; color: #fafafa;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 20px;">
                    <tr>
                        <td align="center">
                            <table width="100%" max-width="500" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #09090b;">
                                <!-- Logo/Header -->
                                <tr>
                                    <td align="center" style="padding-bottom: 32px;">
                                        <div style="height: 40px; width: 40px; background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; display: inline-block; line-height: 40px; text-align: center;">
                                            <span style="font-size: 20px; color: #fff;">V</span>
                                        </div>
                                        <h1 style="margin: 16px 0 0 0; font-size: 24px; font-weight: 600; letter-spacing: -0.025em; color: #ffffff;">Varlık Takip</h1>
                                        <p style="margin: 4px 0 0 0; font-size: 14px; color: #a1a1aa;">Güvenlik Merkezi</p>
                                    </td>
                                </tr>
                                <!-- Main Card -->
                                <tr>
                                    <td style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 40px; text-align: center;">
                                        <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #ffffff;">Şifre Sıfırlama</h2>
                                        <p style="margin: 0 0 32px 0; font-size: 14px; line-height: 24px; color: #a1a1aa;">Hesabınızın şifresini sıfırlamak için bir talep aldık. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz.</p>
                                        
                                        <!-- Action Button -->
                                        <div style="margin-bottom: 32px;">
                                            <a href="${resetLink}" style="background-color: #ffffff; color: #000000; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">Şifreyi Sıfırla</a>
                                        </div>

                                        <p style="margin: 0; font-size: 12px; color: #71717a;">Bu bağlantı 30 dakika boyunca geçerlidir.</p>
                                    </td>
                                </tr>
                                <!-- Footer -->
                                <tr>
                                    <td align="center" style="padding-top: 32px;">
                                        <p style="margin: 0; font-size: 12px; color: #52525b; line-height: 18px;">
                                            Şifrenizi sıfırlamak istemiyorsanız bu e-postayı silebilirsiniz.<br>
                                            &copy; 2026 Varlık Takip. Tüm hakları saklıdır.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `,
        });

        if (error) return { success: false, error };
        return { success: true, data };
    } catch (error) {
        return { success: false, error };
    }
};
