"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Wallet,
  TrendingUp,
  Landmark,
  LogOut,
  Loader2,
  RefreshCw,
  User as UserIcon,
  ChevronDown,
  History,
  HandCoins,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { AssetForm } from "@/components/asset-form";
import { AssetTable } from "@/components/asset-table";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ totalVal: 0, totalProfit: 0, realizedProfit: 0 });

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const [assetRes, salesRes] = await Promise.all([
        fetch("/api/assets"),
        fetch("/api/assets/sales")
      ]);

      const assetData = await assetRes.json();
      const salesData = await salesRes.json();

      setAssets(assetData);
      setTotals(prev => ({ ...prev, realizedProfit: salesData.totalRealizedProfit || 0 }));
    } catch (error) {
      console.error("Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchAssets();
  }, [fetchAssets]);

  useEffect(() => {
    const calculateTotals = async () => {
      let val = 0;
      let profit = 0;

      for (const asset of assets as any[]) {
        try {
          const res = await fetch(`/api/prices/${asset.symbol}`);
          const p = await res.json();
          const currentPrice = p.price;
          val += asset.amount * currentPrice;
          profit += asset.amount * currentPrice - asset.amount * asset.buyPrice;
        } catch (e) { }
      }
      setTotals(prev => ({ ...prev, totalVal: val, totalProfit: profit }));
    };

    if (assets.length > 0) {
      calculateTotals();
    } else {
      setTotals(prev => ({ ...prev, totalVal: 0, totalProfit: 0 }));
    }
  }, [assets]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20">
      {/* Header */}
      <header className="border-b border-zinc-900 sticky top-0 z-50 bg-black/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800 shadow-xl">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">
              Varlık Takip
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  <div className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:border-zinc-700 transition-all">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <div className="hidden md:flex flex-col items-start leading-none gap-1">
                    <span className="text-xs font-semibold tracking-tight">
                      {session?.user?.name || "Kullanıcı"}
                    </span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-zinc-500 group-hover:text-white transition-all ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold leading-none tracking-tight">
                      {session?.user?.name || "Kullanıcı"}
                    </p>
                    <p className="text-[10px] leading-none text-zinc-500 font-medium overflow-hidden text-ellipsis">
                      {session?.user?.email || "E-posta bulunamadı"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/dashboard/sales">
                  <DropdownMenuItem className="cursor-pointer">
                    <History className="h-4 w-4" />
                    <span>Gerçekleşen Karlar</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Güvenli Çıkış</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Özet Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="group">
            <CardHeader className="flex items-center gap-x-2">
              <CardTitle>Toplam Varlık</CardTitle>
              <Wallet className="w-3.5 h-3.5 text-zinc-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tighter">
                ₺
                {totals.totalVal.toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                })}
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-zinc-500 font-medium">
                  Anlık Veri
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="group">
            <CardHeader className="flex items-center gap-x-2">
              <CardTitle>Toplam Kar / Zarar</CardTitle>
              <TrendingUp className="w-3.5 h-3.5 text-zinc-600" />
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "text-2xl font-semibold tracking-tighter",
                  totals.totalProfit >= 0 ? "text-green-400" : "text-red-400",
                )}
              >
                {totals.totalProfit >= 0 ? "+" : ""}₺
                {totals.totalProfit.toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                })}
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 font-medium">
                Bütünsel Performans
              </p>
            </CardContent>
          </Card>

          <Card className="group overflow-hidden relative">
            <Link href="/dashboard/sales" className="absolute inset-0 z-10" />
            <CardHeader className="flex items-center justify-between gap-x-2">
              <CardTitle>Gerçekleşen Kar</CardTitle>
              <HandCoins className="w-3.5 h-3.5 text-zinc-600" />
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-semibold tracking-tighter",
                totals.realizedProfit >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {totals.realizedProfit >= 0 ? "+" : ""}₺{totals.realizedProfit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 font-medium flex items-center gap-1">
                Geçmiş Satış Performansı <ChevronDown className="w-2 h-2 -rotate-90" />
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Aksiyon Barı */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Portföy Detayı
            </h2>
            <p className="text-zinc-500 text-sm mt-1">
              İşlemlerinizi buradan takip edebilir ve yönetebilirsiniz.
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4" />
            Yeni Hisse Ekle
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 bg-zinc-900/20 rounded-md">
            <div className="relative">
              <Loader2 className="h-10 w-10 animate-spin text-white opacity-20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-1.5 w-1.5 bg-white rounded-full" />
              </div>
            </div>
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-[0.2em]">
              Varlıklarınız İşleniyor
            </p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-top-4 duration-1000">
            <AssetTable assets={assets} onRefresh={fetchAssets} />
          </div>
        )}

        {/* Ekleme Formu */}
        <AssetForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSuccess={fetchAssets}
        />
      </main>
    </div>
  );
}
