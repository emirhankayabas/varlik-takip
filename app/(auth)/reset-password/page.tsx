"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Wallet, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [token, setToken] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const t = searchParams.get("token");
        const e = searchParams.get("email");
        if (t) setToken(t);
        if (e) setEmail(e);
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Şifreler eşleşmiyor.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, token, password }),
            });

            if (response.ok) {
                setSuccess(true);
                toast.success("Şifreniz başarıyla sıfırlandı.");
                setTimeout(() => {
                    router.push("/login");
                }, 2000);
            } else {
                const data = await response.json();
                toast.error(data.error || "Şifre sıfırlanamadı.");
            }
        } catch (err) {
            toast.error("Bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="text-center space-y-4">
                <p className="text-red-500">Geçersiz veya eksik doğrulama anahtarı.</p>
                <Button onClick={() => router.push("/forgot-password")} variant="outline">
                    Yeni Bağlantı İste
                </Button>
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex flex-col items-center space-y-4 text-center animate-in fade-in zoom-in">
                <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 mb-2">
                    <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-bold">Şifre Değiştirildi!</h2>
                <p className="text-sm text-zinc-400">Yeni şifrenizle giriş yapabilirsiniz. Yönlendiriliyorsunuz...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="password">Yeni Şifre</Label>
                <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
                <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
            </div>

            <Button
                type="submit"
                disabled={loading || !password}
                className="bg-white text-black hover:bg-zinc-200 transition-all font-medium w-full"
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Şifreyi Güncelle"}
            </Button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-6">
            <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="flex flex-col items-center space-y-2 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/5 shadow-xl">
                        <Wallet className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight mt-4">Yeni Şifre Belirleyin</h1>
                    <p className="text-sm text-zinc-400">Lütfen hesabınız için güvenli bir şifre seçin.</p>
                </div>

                <Suspense fallback={<div className="flex justify-center"><Loader2 className="animate-spin" /></div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
