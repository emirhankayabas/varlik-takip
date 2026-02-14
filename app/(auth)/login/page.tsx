"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Apple, Wallet, Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("E-posta veya şifre hatalı.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Bir hata oluştu.");
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
            Varlık Takip'e Hoş Geldiniz
          </h1>
          <p className="text-sm text-zinc-400">
            Hesabınız yok mu?{" "}
            <Link
              href="/register"
              className="text-white hover:text-zinc-300 transition-colors font-medium underline underline-offset-4"
            >
              Kayıt Olun
            </Link>
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <Label htmlFor="password">Şifre</Label>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 font-medium text-center animate-shake">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="bg-white text-black hover:bg-zinc-200 transition-all font-medium w-full"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Giriş yap
              </>
            )}
          </Button>
        </form>

        {/* Separator */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs lowercase">
            <span className="bg-black px-2 text-zinc-500">
              Veya şununla devam et
            </span>
          </div>
        </div>

        {/* Social Logins */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className=" border-zinc-800 bg-transparent text-white hover:bg-zinc-900 transition-all font-medium"
            type="button"
          >
            <svg
              className="mr-2 h-4 w-4"
              aria-hidden="true"
              focusable="false"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 384 512"
            >
              <path
                fill="currentColor"
                d="M318.7 268.7c-.2-36.3 16.4-67.1 49.6-86.8-17.3-25.1-44.2-39.7-74.1-41.6-34.8-2.4-66.5 21.3-84.1 21.3-17.5 0-44.8-19.1-73.6-18.1-38 1.4-73.1 23.1-92.6 57.1-39.6 69.1-10.1 171.3 28.5 227 18.9 27.3 41.5 57.8 70.8 56.7 28.3-1.1 38.9-18.2 73.1-18.2 34.1 0 43.6 18.2 73.6 17.6 30.7-.5 50.4-27.4 69.2-54.6 21.7-31.4 30.6-61.9 31-63.4-.7-.3-60.1-23.2-60.3-91.3zM277.5 70.4c15.6-18.8 26.1-44.8 23.2-70.4-22.4 1-49.1 15-65.1 33.7-14.3 16.6-26.8 43.3-23.4 68 24.8 1.9 49.7-12.6 65.3-31.3z"
              ></path>
            </svg>
            Apple
          </Button>
          <Button
            variant="outline"
            className=" border-zinc-800 bg-transparent text-white hover:bg-zinc-900 transition-all font-medium"
            type="button"
          >
            <svg
              className="mr-2 h-4 w-4"
              aria-hidden="true"
              focusable="false"
              data-prefix="fab"
              data-icon="google"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
            >
              <path
                fill="currentColor"
                d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
              ></path>
            </svg>
            Google
          </Button>
        </div>

        {/* Footer */}
        <p className="px-8 text-center text-[10px] leading-relaxed text-zinc-500">
          Devam ederek{" "}
          <Link
            href="/terms"
            className="underline underline-offset-4 hover:text-zinc-300 transition-colors"
          >
            Hizmet Şartlarımızı
          </Link>{" "}
          ve{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-4 hover:text-zinc-300 transition-colors"
          >
            Gizlilik Politikamızı
          </Link>{" "}
          kabul etmiş olursunuz.
        </p>
      </div>
    </div>
  );
}
