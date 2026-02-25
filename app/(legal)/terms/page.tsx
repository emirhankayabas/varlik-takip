"use client";

import Link from "next/link";
import { MoveLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  return (
    <div className="bg-black text-white p-8 md:p-24 selection:bg-white/20">
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
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-medium">Hizmet Şartları</h1>
          <p className="text-zinc-500 text-sm">Son Güncelleme: 14 Şubat 2026</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none space-y-8 text-zinc-400">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              1. Kullanım Amacı
            </h2>
            <p className="leading-relaxed">
              Bu uygulama kişisel yatırım takibi amacıyla sunulmaktadır. Verilen
              hiçbir veri yatırım tavsiyesi niteliği taşımaz. Finansal
              kararlarınızdan kullanıcı bizzat sorumludur.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              2. Veri Doğruluğu
            </h2>
            <p className="leading-relaxed">
              Yahoo Finance üzerinden çekilen veriler 15-20 dakika gecikmeli
              olabilir. Uygulama, üçüncü taraf veri kaynaklarından kaynaklanan
              hatalardan sorumlu tutulamaz.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              3. Hesap Güvenliği
            </h2>
            <p className="leading-relaxed">
              Kullanıcılar e-posta ve şifre bilgilerinin güvenliğinden
              sorumludur. Hesabınızın izinsiz kullanıldığını fark ederseniz
              lütfen bizimle iletişime geçin.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              4. Hizmet Değişikliği
            </h2>
            <p className="leading-relaxed">
              Varlık Takip, hizmet özelliklerini önceden haber vermeksizin
              güncelleme veya değiştirme hakkını saklı tutar.
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
