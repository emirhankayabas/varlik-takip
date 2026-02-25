"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2, Wallet, RefreshCwIcon, ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function VerifyEmailForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, update } = useSession();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [verificationCode, setVerificationCode] = useState("");
    const [resending, setResending] = useState(false);

    useEffect(() => {
        const e = searchParams.get("email");
        if (e) setEmail(e);
        else if (session?.user?.email) setEmail(session.user.email);
    }, [searchParams, session]);

    // url'de resend=true varsa otomatik kod gönder
    useEffect(() => {
        const shouldResend = searchParams.get("resend") === "true";
        if (shouldResend && email && !resending) {
            handleResendCode();
            // Parametreyi URL'den temizle (sayfa yenilenince tekrar atmasın)
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.delete("resend");
            router.replace(`/verify-email?${newParams.toString()}`);
        }
    }, [email, searchParams]);

    const handleVerify = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (verificationCode.length !== 6) return;

        setLoading(true);

        try {
            const response = await fetch("/api/auth/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code: verificationCode }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("E-posta adresiniz doğrulandı!");

                // Session'ı güncelle ki banner gitsin
                await update({ emailVerified: true });

                setTimeout(() => {
                    router.push("/dashboard");
                }, 1000);
            } else {
                toast.error(data.error || "Doğrulama başarısız.");
            }
        } catch (err) {
            toast.error("Bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (!email) {
            toast.error("E-posta adresi bulunamadı.");
            return;
        }
        setResending(true);
        try {
            const response = await fetch("/api/auth/resend-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                toast.success("Yeni kod gönderildi.");
            } else {
                toast.error("Kod gönderilemedi.");
            }
        } catch (err) {
            toast.error("Bir hata oluştu.");
        } finally {
            setResending(false);
        }
    };

    if (!email) {
        return (
            <Card className="mx-auto border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
                <CardContent className="pt-6 text-center space-y-4">
                    <p className="text-sm text-zinc-400">Geçersiz erişim. Lütfen kayıt sayfasından tekrar başlayın.</p>
                    <Button onClick={() => router.push("/register")} className="w-full">
                        Kayıt Ol Sayfasına Git
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mx-auto border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
            <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/5 shadow-xl">
                        <Wallet className="h-6 w-6 text-white" />
                    </div>
                </div>
                <CardTitle>E-postanızı Doğrulayın</CardTitle>
                <CardDescription className="mt-1 text-sm"><span className="text-white font-medium">{email}</span> adresine gönderilen kodu girin.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleVerify} className="space-y-4">
                    <Field>
                        <div className="flex items-center justify-between mb-1">
                            <FieldLabel className="text-zinc-400">
                                Doğrulama Kodu
                            </FieldLabel>
                            <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                onClick={handleResendCode}
                                disabled={resending}
                            >
                                <RefreshCwIcon className={cn("h-3 w-3", resending && "animate-spin")} />
                                Tekrar Gönder
                            </Button>
                        </div>

                        <div className="flex justify-center">
                            <InputOTP
                                maxLength={6}
                                id="otp-verification"
                                value={verificationCode}
                                onChange={(value) => setVerificationCode(value)}
                                onComplete={() => handleVerify()}
                                required
                            >
                                <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-10 *:data-[slot=input-otp-slot]:w-13 *:data-[slot=input-otp-slot]:text-lg *:data-[slot=input-otp-slot]:bg-zinc-900/50 *:data-[slot=input-otp-slot]:border-zinc-800">
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                </InputOTPGroup>
                                <InputOTPSeparator className="mx-2 text-zinc-700" />
                                <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-10 *:data-[slot=input-otp-slot]:w-13 *:data-[slot=input-otp-slot]:text-lg *:data-[slot=input-otp-slot]:bg-zinc-900/50 *:data-[slot=input-otp-slot]:border-zinc-800">
                                    <InputOTPSlot index={3} />
                                    <InputOTPSlot index={4} />
                                    <InputOTPSlot index={5} />
                                </InputOTPGroup>
                            </InputOTP>
                        </div>

                        <FieldDescription className="text-[11px] text-zinc-500 mt-2">
                            Mail gelmediyse lütfen gereksiz (spam) klasörünü kontrol edin.
                        </FieldDescription>
                    </Field>

                    <Button
                        type="submit"
                        disabled={loading || verificationCode.length !== 6}
                        className="bg-white text-black hover:bg-zinc-200 transition-all font-medium w-full"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                Hesabı Onayla
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2 pt-2">
                <Button
                    variant="ghost"
                    onClick={() => router.push("/register")}
                    className="text-sm"
                >
                    <ArrowLeft className="h-3 w-3" />
                    Bilgileri Güncelle
                </Button>
                <div className="text-white/60 text-xs text-center">
                    Destek için <a href="#" className="underline hover:text-zinc-400">bizimle iletişime geçin</a>.
                </div>
            </CardFooter>
        </Card>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-6">
            <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in duration-500">
                <Suspense fallback={<div className="flex justify-center"><Loader2 className="animate-spin" /></div>}>
                    <VerifyEmailForm />
                </Suspense>
            </div>
        </div>
    );
}
