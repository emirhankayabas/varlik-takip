"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Wallet, TrendingUp, Loader2, HandCoins, ChevronDown } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AssetForm } from "@/components/asset-form";
import { AssetTable } from "@/components/asset-table";
import { IpoForm } from "@/components/ipo-form";
import { IpoList } from "@/components/ipo-list";
import { FundForm } from "@/components/fund-form";
import { FundTable } from "@/components/fund-table";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isIpoFormOpen, setIsIpoFormOpen] = useState(false);
  const [isFundFormOpen, setIsFundFormOpen] = useState(false);
  const [assets, setAssets] = useState([]);
  const [funds, setFunds] = useState([]);
  const [publicOfferings, setPublicOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({
    totalVal: 0,
    totalProfit: 0,
    realizedProfit: 0,
    stockVal: 0,
    fundVal: 0,
    stockProfit: 0,
    fundProfit: 0,
    stockRealizedProfit: 0,
    fundRealizedProfit: 0
  });

  const fetchAssetsOnly = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [assetRes, salesRes] = await Promise.all([
        fetch("/api/assets"),
        fetch("/api/assets/sales")
      ]);

      const assetData = await assetRes.json();
      const salesData = await salesRes.json();

      setAssets(assetData);
      setTotals(prev => {
        const stockRealized = salesData.totalRealizedProfit || 0;
        return {
          ...prev,
          stockRealizedProfit: stockRealized,
          realizedProfit: stockRealized + prev.fundRealizedProfit
        };
      });
    } catch (error) {
      console.error("Varlıklar yüklenemedi");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const fetchIposOnly = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch("/api/public-offerings");
      const data = await res.json();
      setPublicOfferings(data);
    } catch (error) {
      console.error("Halka arzlar yüklenemedi");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const fetchFundsOnly = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [fundsRes, salesRes] = await Promise.all([
        fetch("/api/funds"),
        fetch("/api/funds/sales")
      ]);
      const data = await fundsRes.json();
      const salesData = await salesRes.json();

      setFunds(data);
      setTotals(prev => {
        const fundRealized = salesData.totalRealizedProfit || 0;
        return {
          ...prev,
          fundRealizedProfit: fundRealized,
          realizedProfit: prev.stockRealizedProfit + fundRealized
        };
      });
    } catch (error) {
      console.error("Fonlar yüklenemedi");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const fetchEverything = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchAssetsOnly(false),
      fetchIposOnly(false),
      fetchFundsOnly(false)
    ]);
    setLoading(false);
  }, [fetchAssetsOnly, fetchIposOnly, fetchFundsOnly]);

  useEffect(() => {
    setMounted(true);
    fetchEverything();
  }, [fetchEverything]);

  const [agendaIpos, setAgendaIpos] = useState<any[]>([]);

  useEffect(() => {
    const fetchAgendaIpos = async () => {
      try {
        const res = await fetch("/api/halkarz");
        const data = await res.json();
        setAgendaIpos(data);
      } catch (error) {
        console.error("Halkarz verisi çekilemedi:", error);
      }
    };
    fetchAgendaIpos();
  }, []);

  useEffect(() => {
    const calculateTotals = async () => {
      let val = 0;
      let profit = 0;

      // 1. Benzersiz sembolleri ayıkla
      const uniqueSymbols = Array.from(new Set(assets.map((a: any) => a.symbol)));

      // 2. Sembol bazlı güncel fiyatları tek seferde çek
      const priceMap: Record<string, number> = {};
      await Promise.all(
        uniqueSymbols.map(async (symbol) => {
          try {
            const res = await fetch(`/api/prices/${symbol}`);
            const p = await res.json();
            priceMap[symbol] = p.price;
          } catch (e) { }
        })
      );

      // 3. Fonlar için sembol bazlı güncel fiyatları çek
      const uniqueFundSymbols = Array.from(new Set(funds.map((f: any) => f.symbol)));
      const fundPriceMap: Record<string, number> = {};
      await Promise.all(
        uniqueFundSymbols.map(async (symbol) => {
          try {
            const res = await fetch(`/api/prices/fund/${symbol}`);
            const p = await res.json();
            fundPriceMap[symbol] = p.price;
          } catch (e) { }
        })
      );

      let stockVal = 0;
      let fundVal = 0;
      let stockProfit = 0;
      let fundProfit = 0;

      // 4. Toplamları hesapla (Hisseler)
      for (const asset of assets as any[]) {
        const currentPrice = priceMap[asset.symbol];
        if (currentPrice !== undefined) {
          const itemVal = asset.amount * currentPrice;
          const itemProfit = itemVal - asset.amount * asset.buyPrice;
          val += itemVal;
          stockVal += itemVal;
          profit += itemProfit;
          stockProfit += itemProfit;
        }
      }

      // 5. Toplamları hesapla (Fonlar)
      for (const fund of funds as any[]) {
        const currentPrice = fundPriceMap[fund.symbol];
        if (currentPrice !== undefined) {
          const itemVal = fund.amount * currentPrice;
          const itemProfit = itemVal - fund.amount * fund.buyPrice;
          val += itemVal;
          fundVal += itemVal;
          profit += itemProfit;
          fundProfit += itemProfit;
        }
      }

      setTotals(prev => ({
        ...prev,
        totalVal: val,
        totalProfit: profit,
        stockVal,
        fundVal,
        stockProfit,
        fundProfit
      }));
    };

    if (assets.length > 0 || funds.length > 0) {
      calculateTotals();
    } else {
      setTotals(prev => ({
        ...prev,
        totalVal: 0,
        totalProfit: 0,
        stockVal: 0,
        fundVal: 0,
        stockProfit: 0,
        fundProfit: 0,
        stockRealizedProfit: 0,
        fundRealizedProfit: 0
      }));
    }
  }, [assets, funds]);

  if (!mounted) return null;

  return (
    <main className="container mx-auto px-6 py-10 max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Özet Kartları */}
      {/* Özet Kartları */}
      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="group relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Varlık</CardTitle>
            <Wallet className="w-4 h-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              ₺{totals.totalVal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-4 space-y-2 border-t border-zinc-800 pt-4">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-500">Hisse Toplamı</span>
                <span className="font-semibold text-zinc-300">₺{totals.stockVal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-500">Fon Toplamı</span>
                <span className="font-semibold text-zinc-300">₺{totals.fundVal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kar / Zarar</CardTitle>
            <TrendingUp className="w-4 h-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold tracking-tight",
              totals.totalProfit >= 0 ? "text-emerald-400" : "text-red-400"
            )}>
              {totals.totalProfit >= 0 ? "+" : ""}₺{totals.totalProfit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-4 space-y-2 border-t border-zinc-800 pt-4">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-500">Hisse Kar/Zarar</span>
                <span className={cn("font-semibold", totals.stockProfit >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {totals.stockProfit >= 0 ? "+" : ""}₺{totals.stockProfit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-500">Fon Kar/Zarar</span>
                <span className={cn("font-semibold", totals.fundProfit >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {totals.fundProfit >= 0 ? "+" : ""}₺{totals.fundProfit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden">
          <Link href="/dashboard/sales" className="absolute inset-0 z-10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gerçekleşen Kar</CardTitle>
            <HandCoins className="w-4 h-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold tracking-tight",
              totals.realizedProfit >= 0 ? "text-emerald-400" : "text-red-400"
            )}>
              {totals.realizedProfit >= 0 ? "+" : ""}₺{totals.realizedProfit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-4 space-y-2 border-t border-zinc-800 pt-4">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-500">Hisse Gerçekleşen Kar</span>
                <span className={cn("font-semibold", totals.stockRealizedProfit >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {totals.stockRealizedProfit >= 0 ? "+" : ""}₺{totals.stockRealizedProfit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-500">Fon Gerçekleşen Kar</span>
                <span className={cn("font-semibold", totals.fundRealizedProfit >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {totals.fundRealizedProfit >= 0 ? "+" : ""}₺{totals.fundRealizedProfit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agenda IPOs */}
      {agendaIpos.length > 0 && (
        <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-semibold tracking-tight">Yeni Halka Arzlar</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agendaIpos.map((ipo, idx) => {
              const isParticipated = publicOfferings.some((p: any) => {
                const pSymbol = p.symbol.split(".")[0].toUpperCase();
                const iSymbol = ipo.symbol.toUpperCase();
                return pSymbol === iSymbol;
              });

              return (
                <Card key={idx} className={cn(isParticipated && "border-emerald-500/50 bg-emerald-500/5")}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-x-1">
                        <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                          {ipo.symbol || "IPO"}
                        </span>
                        <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
                      </div>
                      {isParticipated && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                          KATILDINIZ
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="line-clamp-1">
                      {ipo.name}
                    </CardTitle>
                    <p className="text-xs mt-2 text-zinc-400">
                      {ipo.date}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Portföy Detayı */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 mt-12">
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
        <div className="flex flex-col items-center justify-center gap-4 bg-zinc-900/20 rounded-md p-12">
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
          <AssetTable assets={assets} onRefresh={() => fetchAssetsOnly(false)} />
        </div>
      )}

      {/* Fon Takibi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 mt-16">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Fon Takibi
          </h2>
          <p className="text-zinc-500 text-sm mt-1">
            Yatırım fonlarınızı buradan takip edebilir ve yönetebilirsiniz.
          </p>
        </div>
        <Button onClick={() => setIsFundFormOpen(true)}>
          <Plus className="w-4 h-4" />
          Yeni Fon Ekle
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/10 rounded-xl border border-zinc-900">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-top-4 duration-1000">
          <FundTable funds={funds} onRefresh={() => fetchFundsOnly(false)} />
        </div>
      )}

      {/* Halka Arz Takibi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 mt-16">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Halka Arz Takibi
          </h2>
          <p className="text-zinc-500 text-sm mt-1">
            Halk arz taleplerinizi ve dağıtım sonuçlarını izleyin.
          </p>
        </div>
        <Button onClick={() => setIsIpoFormOpen(true)}>
          <Plus className="w-4 h-4" />
          Yeni Halka Arz Ekle
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/10 rounded-xl border border-zinc-900">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-top-4 duration-1000">
          <IpoList offerings={publicOfferings} onRefresh={() => fetchIposOnly(false)} />
        </div>
      )}

      {/* Ekleme Formları */}
      <AssetForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => fetchAssetsOnly(false)}
      />
      <IpoForm
        open={isIpoFormOpen}
        onOpenChange={setIsIpoFormOpen}
        onSuccess={() => fetchIposOnly(false)}
      />
      <FundForm
        open={isFundFormOpen}
        onOpenChange={setIsFundFormOpen}
        onSuccess={() => fetchFundsOnly(false)}
      />
    </main>
  );
}
