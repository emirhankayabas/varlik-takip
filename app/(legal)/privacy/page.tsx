"use client";

import Link from "next/link";
import { MoveLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-24 selection:bg-white/20">
      <div className="max-w-2xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Navigation */}
        <Link href="/login">
          <Button variant="ghost">
            <MoveLeft className="w-4 h-4" />
          </Button>
        </Link>

        {/* Header */}
        <div className="space-y-4 mt-8">
          <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-medium">Gizlilik Politikası</h1>
          <p className="text-zinc-500 text-sm ">
            Son Güncelleme: 14 Şubat 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none space-y-8 text-zinc-400">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              1. Veri Toplama
            </h2>
            <p className="leading-relaxed">
              Varlık Takip uygulaması, size hizmet sunabilmek için minimum
              düzeyde veri toplar. Toplanan veriler şunlardır: E-posta adresi,
              isim ve portföy operasyonlarınız (hisse alım verileri).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              2. Verilerin Kullanımı
            </h2>
            <p className="leading-relaxed">
              Verileriniz sadece portföyünüzü hesaplamak ve size özel dashboard
              sunmak amacıyla kullanılır. Verileriniz üçüncü taraflarla asla
              paylaşılmaz ve reklam amaçlı kullanılmaz.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">3. Güvenlik</h2>
            <p className="leading-relaxed">
              Hesap güvenliğiniz için şifreleriniz{" "}
              <code className="text-zinc-200">bcrypt</code> algoritması ile
              hash'lenerek saklanır. Veritabanı erişimi gelişmiş yetkilendirme
              katmanları ile korunmaktadır.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">4. Çerezler</h2>
            <p className="leading-relaxed">
              Sadece oturum yönetimi (NextAuth) için gerekli yapısal çerezler
              kullanılır. Takip edici veya reklam amaçlı çerezler
              kullanılmamaktadır.
            </p>
          </section>
        </div>

        <footer className="pt-12 border-t border-zinc-900">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold text-center">
            © 2026 Varlık Takip Sistemi
          </p>
        </footer>
      </div>
    </div>
  );
}
