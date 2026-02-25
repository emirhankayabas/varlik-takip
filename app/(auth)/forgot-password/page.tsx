"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Wallet, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSubmitted(true);
        toast.success("Sıfırlama bağlantısı gönderildi.");
      } else {
        const data = await response.json();
        toast.error(data.error || "Bir hata oluştu.");
      }
    } catch (err) {
      toast.error("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-6">
      <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in duration-500">
        {/* Logo & Header */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/5 shadow-xl">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mt-4">
            {submitted ? "E-postanızı Kontrol Edin" : "Şifremi Unuttum"}
          </h1>
          <p className="text-sm text-zinc-400">
            {submitted
              ? `${email} adresine bir sıfırlama bağlantısı gönderdik.`
              : "Hesabınıza bağlı e-posta adresini girin, size bir sıfırlama bağlantısı gönderelim."}
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                placeholder="ali@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="bg-white text-black hover:bg-zinc-200 transition-all font-medium w-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Sıfırlama Bağlantısı Gönder
                </>
              )}
            </Button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-[10px] text-zinc-500 leading-relaxed px-4">
              Mail kutunuzu (ve gereksiz klasörünü) kontrol etmeyi unutmayın.
              Eğer ulaşmadıysa tekrar deneyebilirsiniz.
            </p>
            <Button
              variant="outline"
              className="w-full border-zinc-800 hover:bg-zinc-900 transition-all font-medium h-10"
              onClick={() => setSubmitted(false)}
            >
              Tekrar Dene
            </Button>
          </div>
        )}

        {/* Footer Link */}
        <div className="text-center pt-2">
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Giriş ekranına dön
          </Link>
        </div>
      </div>
    </div>
  );
}
