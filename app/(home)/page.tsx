"use client";

import Link from "next/link";
import {
  MoveRight,
  BarChart3,
  ArrowUpRight,
  PieChart,
  LayoutDashboard,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  const scrollToNasilCalisir = () => {
    document
      .getElementById("nasil-calisir")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col bg-[#050505] text-white selection:bg-primary/30 font-sans">
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white transition-colors group-hover:bg-primary group-hover:border-primary">
              <BarChart3 className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white/90">
              VarlıkTakip
            </span>
          </div>
          <nav className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button>
                  <span className="flex items-center gap-2 font-medium text-sm">
                    Panele Git
                    <MoveRight className="h-4 w-4" />
                  </span>
                </Button>
              </Link>
            ) : (
              <>
                <Button variant="outline">
                  <Link href="/login">Giriş Yap</Link>
                </Button>

                <Button>
                  <Link href="/login">Hemen Başla</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden border-b border-white/5">
          <div className="container mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-white/60 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
              <Badge className="h-1.5 w-1.5 p-0 rounded-full bg-primary border-none" />
              BIST Portföy Yönetimi
            </div>
            <h1 className="mx-auto max-w-4xl text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.15] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              Yatırımlarınızı Modern <br />
              <span className="text-white/40">Bir Çizgide Takip Edin</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/40 sm:text-xl leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
              Karmaşadan uzak, sadece verilere odaklanan minimal bir deneyim.
              Tüm portföyünüz ve anlık BIST verileri tek bir merkezde.
            </p>
            <div className="flex flex-row justify-center items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <Link href={isLoggedIn ? "/dashboard" : "/login"}>
                <Button>
                  {isLoggedIn ? "Panele Dön" : "Ücretsiz Başla"}
                  <MoveRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button onClick={scrollToNasilCalisir} variant="secondary">
                Nasıl Çalışır?
              </Button>
            </div>

            {/* High-Fidelity Minimal Mockup */}
            <div className="mt-24 relative max-w-5xl mx-auto animate-in fade-in zoom-in duration-1000 delay-200">
              <div className="relative rounded-2xl border border-white/10 bg-black shadow-2xl overflow-hidden aspect-16/10">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="h-2 w-24 rounded-full bg-white/10" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded bg-white/5" />
                    <div className="h-6 w-20 rounded bg-white/5" />
                  </div>
                </div>
                {/* Content */}
                <div className="grid grid-cols-12 gap-px bg-white/5 h-full">
                  <div className="col-span-8 bg-black p-8">
                    <div className="space-y-8">
                      <div>
                        <div className="text-white/40 text-xs font-medium uppercase tracking-widest mb-2">
                          Net Değer
                        </div>
                        <div className="text-4xl font-semibold tracking-tight">
                          ₺1.248.590,42
                        </div>
                      </div>

                      <div className="h-40 relative">
                        <svg
                          className="w-full h-full"
                          viewBox="0 0 400 100"
                          preserveAspectRatio="none"
                        >
                          <path
                            d="M0,80 L50,75 L100,78 L150,65 L200,68 L250,55 L300,58 L350,45 L400,48"
                            fill="none"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeOpacity="0.2"
                          />
                          <path
                            d="M0,70 L50,60 L100,65 L150,45 L200,50 L250,30 L300,35 L350,15 L400,20"
                            fill="none"
                            stroke="var(--primary)"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>

                      <div className="grid grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="space-y-2">
                            <div className="h-1.5 w-12 rounded-full bg-white/10" />
                            <div className="h-4 w-20 rounded bg-white/5" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-4 bg-black p-8">
                    <div className="space-y-6">
                      <div className="h-3 w-24 rounded bg-white/10 mb-8" />
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center py-2 border-b border-white/5"
                        >
                          <div className="h-3 w-16 rounded bg-white/5" />
                          <div className="h-3 w-10 rounded bg-primary/20" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="nasil-calisir" className="py-32 border-b border-white/5">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-16 max-w-5xl mx-auto">
              {[
                {
                  icon: LayoutDashboard,
                  title: "Entegrasyon",
                  desc: "Portföyünüzü hızlıca sisteme tanımlayın.",
                },
                {
                  icon: TrendingUp,
                  title: "Canlı Veri",
                  desc: "BIST verilerini anlık olarak izleyin.",
                },
                {
                  icon: PieChart,
                  title: "Analiz",
                  desc: "Kâr-zarar durumunuzu minimal bir ekranda görün.",
                },
              ].map((step, i) => (
                <div key={i} className="flex flex-col">
                  <div className="h-10 w-10 border border-white/10 rounded-lg flex items-center justify-center text-white/40 mb-6 font-medium text-sm">
                    {i + 1}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-white/40 leading-relaxed text-sm font-medium">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Table Style */}
        <section className="py-32">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto border border-white/5 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-white/5">
                {[
                  { label: "Varlık Takibi", val: "Eksiksiz" },
                  { label: "BIST Verisi", val: "Anlık" },
                  { label: "Güvenlik", val: "Maksimum" },
                  { label: "Deneyim", val: "Minimal" },
                ].map((item, i) => (
                  <div key={i} className="p-8 bg-white/[0.01]">
                    <div className="text-white/40 text-xs font-medium uppercase tracking-widest mb-4">
                      {item.label}
                    </div>
                    <div className="text-xl font-medium">{item.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Minimal CTA */}
        <section className="py-40">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-12">
              Geleceğin Yatırım Paneli
            </h2>
            <Link href={isLoggedIn ? "/dashboard" : "/login"}>
              <Button size="lg">
                {isLoggedIn ? "Hemen Panele Git" : "Şimdi Başlayın"}
                <ArrowUpRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-12 bg-black">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-white/40" />
              <span className="font-semibold text-white/90">VarlıkTakip</span>
            </div>
            <nav className="flex gap-8 text-sm font-medium text-white/40">
              <Link
                href="/terms"
                className="hover:text-white transition-colors"
              >
                Şartlar
              </Link>
              <Link
                href="/privacy"
                className="hover:text-white transition-colors"
              >
                Gizlilik
              </Link>
              <button
                onClick={scrollToNasilCalisir}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Rehber
              </button>
            </nav>
            <p className="text-xs text-white/20 font-medium">
              © 2026 BIST Investor Platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
