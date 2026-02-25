"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Landmark, Globe, PieChart, Calendar as CalendarIconUI } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { isTodayInIpoDate } from "@/lib/ipo-utils";

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
  const [activeTab, setActiveTab] = useState("bist");
  const [usdRate, setUsdRate] = useState(1);
  const [priceMap, setPriceMap] = useState<Record<string, { price: number; changePercent?: number }>>({});
  const [fundPriceMap, setFundPriceMap] = useState<Record<string, { price: number; changePercent?: number; change?: number; name?: string }>>({});
  const [totals, setTotals] = useState({
    totalVal: 0,
    totalProfit: 0,
    realizedProfit: 0,
    bistVal: 0,
    usVal: 0,
    fundVal: 0,
    bistProfit: 0,
    usProfit: 0,
    fundProfit: 0,
    bistRealizedProfit: 0,
    usRealizedProfit: 0,
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
        const bistRealized = salesData.sales.filter((s: any) => s.market === "BIST").reduce((sum: number, s: any) => sum + (s.realizedProfit || 0), 0);
        const usRealized = salesData.sales.filter((s: any) => s.market === "US").reduce((sum: number, s: any) => sum + (s.realizedProfit || 0), 0);
        return {
          ...prev,
          bistRealizedProfit: bistRealized,
          usRealizedProfit: usRealized,
          realizedProfit: bistRealized + (usRealized * usdRate) + prev.fundRealizedProfit
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
          realizedProfit: prev.bistRealizedProfit + (prev.usRealizedProfit * usdRate) + fundRealized
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
    const fetchUsdRate = async () => {
      try {
        const res = await fetch("/api/prices/USDTRY=X");
        const data = await res.json();
        if (data.price) setUsdRate(data.price);
      } catch (e) { }
    };
    fetchAgendaIpos();
    fetchUsdRate();
  }, []);

  useEffect(() => {
    const calculateTotals = async () => {
      let val = 0;
      let profit = 0;

      // 1. Benzersiz sembolleri ayıkla
      const uniqueSymbols = Array.from(new Set(assets.map((a: any) => a.symbol)));

      // 2. Sembol bazlı güncel fiyatları tek seferde çek
      const currentPriceMap: Record<string, { price: number; changePercent?: number }> = {};
      await Promise.all(
        uniqueSymbols.map(async (symbol) => {
          try {
            const res = await fetch(`/api/prices/${symbol}`);
            const p = await res.json();
            currentPriceMap[symbol] = {
              price: p.price,
              changePercent: p.changePercent
            };
          } catch (e) { }
        })
      );

      // 3. Fonlar için sembol bazlı güncel fiyatları çek
      const uniqueFundSymbols = Array.from(new Set(funds.map((f: any) => f.symbol)));
      const currentFundPriceMap: Record<string, { price: number; changePercent?: number; change?: number; name?: string }> = {};
      await Promise.all(
        uniqueFundSymbols.map(async (symbol) => {
          try {
            const res = await fetch(`/api/prices/fund/${symbol}`);
            const p = await res.json();
            currentFundPriceMap[symbol] = {
              price: p.price,
              changePercent: p.changePercent,
              change: p.change,
              name: p.name
            };
          } catch (e) { }
        })
      );

      // 3.5 ABD Borsası için USD/TRY kurunu çek
      let currentUsdRate = usdRate;
      try {
        const res = await fetch(`/api/prices/USDTRY=X`);
        const p = await res.json();
        if (p.price) {
          currentUsdRate = p.price;
          setUsdRate(p.price);
        }
      } catch (e) {
        console.error("Dolar kuru çekilemedi");
      }

      let bistVal = 0;
      let usVal = 0;
      let fundVal = 0;
      let bistProfit = 0;
      let usProfit = 0;
      let fundProfit = 0;

      // 4. Toplamları hesapla (Hisseler)
      for (const asset of assets as any[]) {
        const priceData = currentPriceMap[asset.symbol];
        if (priceData !== undefined) {
          const currentPrice = priceData.price;
          const itemVal = asset.amount * currentPrice;
          const itemProfit = itemVal - asset.amount * asset.buyPrice;

          if (asset.market === "US") {
            usVal += itemVal;
            usProfit += itemProfit;
            // USD -> TRY çevirisi yaparak toplama ekle
            val += itemVal * currentUsdRate;
            profit += itemProfit * currentUsdRate;
          } else {
            bistVal += itemVal;
            bistProfit += itemProfit;
            val += itemVal;
            profit += itemProfit;
          }
        }
      }

      // 5. Toplamları hesapla (Fonlar)
      for (const fund of funds as any[]) {
        const priceData = currentFundPriceMap[fund.symbol];
        if (priceData !== undefined) {
          const currentPrice = priceData.price;
          const itemVal = fund.amount * currentPrice;
          const itemProfit = itemVal - fund.amount * fund.buyPrice;
          val += itemVal;
          fundVal += itemVal;
          profit += itemProfit;
          fundProfit += itemProfit;
        }
      }

      setPriceMap(currentPriceMap);
      setFundPriceMap(currentFundPriceMap);
      setTotals(prev => ({
        ...prev,
        totalVal: val,
        totalProfit: profit,
        bistVal,
        usVal,
        fundVal,
        bistProfit,
        usProfit,
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
        bistVal: 0,
        usVal: 0,
        fundVal: 0,
        bistProfit: 0,
        usProfit: 0,
        fundProfit: 0,
        bistRealizedProfit: 0,
        usRealizedProfit: 0,
        fundRealizedProfit: 0
      }));
    }
  }, [assets, funds]);

  if (!mounted) return null;

  return (
    <main className="container mx-auto px-6 py-10">
      {/* Özet Kartları */}
      {/* Özet Kartları */}
      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="group relative overflow-hidden gap-y-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Varlık</CardTitle>
            <Wallet className="w-4 h-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              ₺{totals.totalVal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-4 border-t border-zinc-800 pt-4">
              <div className="flex justify-between items-center text-[12px] py-0.5">
                <span className="text-white/70">BIST Hisseleri</span>
                <span className="font-semibold text-white">₺{totals.bistVal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-[12px] py-0.5">
                <span className="text-white/70">ABD Hisseleri</span>
                <span className="font-semibold text-white">${totals.usVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-[12px] py-0.5">
                <span className="text-white/70">Yatırım Fonları</span>
                <span className="font-semibold text-white">₺{totals.fundVal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative gap-y-0">
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
            <div className="mt-4 border-t border-zinc-800 pt-4">
              <div className="flex justify-between items-center text-[12px] py-0.5">
                <span className="text-white/70">BIST Kar/Zarar</span>
                <span className={cn("font-semibold", totals.bistProfit >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {totals.bistProfit >= 0 ? "+" : ""}₺{totals.bistProfit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-[12px] py-0.5">
                <span className="text-white/70">ABD Kar/Zarar</span>
                <span className={cn("font-semibold", totals.usProfit >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {totals.usProfit >= 0 ? "+" : ""}${totals.usProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-[12px] py-0.5">
                <span className="text-white/70">Fon Kar/Zarar</span>
                <span className={cn("font-semibold", totals.fundProfit >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {totals.fundProfit >= 0 ? "+" : ""}₺{totals.fundProfit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden gap-y-0">
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
            <div className="mt-4 border-t border-zinc-800 pt-4">
              <div className="flex justify-between items-center text-[12px] py-0.5">
                <span className="text-white/70">BIST Gerçekleşen Kar</span>
                <span className={cn("font-semibold", totals.bistRealizedProfit >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {totals.bistRealizedProfit >= 0 ? "+" : ""}₺{totals.bistRealizedProfit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-[12px] py-0.5">
                <span className="text-white/70">ABD Gerçekleşen Kar</span>
                <span className={cn("font-semibold", totals.usRealizedProfit >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {totals.usRealizedProfit >= 0 ? "+" : ""}${totals.usRealizedProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-[12px] py-0.5">
                <span className="text-white/70">Fon Gerçekleşen Kar</span>
                <span className={cn("font-semibold", totals.fundRealizedProfit >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {totals.fundRealizedProfit >= 0 ? "+" : ""}₺{totals.fundRealizedProfit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs System */}
      <Tabs defaultValue="bist" className="space-y-8" onValueChange={(val) => setActiveTab(val)}>
        <div className="flex items-center justify-between">
          <TabsList className="bg-zinc-900/50 p-1 border border-zinc-800/50 rounded-xl">
            <TabsTrigger value="bist" className="rounded-lg data-[state=active]:bg-zinc-800 data-[state=active]:text-white transition-all duration-300 gap-2">
              <Landmark className="w-3.5 h-3.5" />
              BIST Hisseleri
            </TabsTrigger>
            <TabsTrigger value="us" className="rounded-lg data-[state=active]:bg-zinc-800 data-[state=active]:text-white transition-all duration-300 gap-2">
              <Globe className="w-3.5 h-3.5" />
              ABD Hisseleri
            </TabsTrigger>
            <TabsTrigger value="funds" className="rounded-lg data-[state=active]:bg-zinc-800 data-[state=active]:text-white transition-all duration-300 gap-2">
              <PieChart className="w-3.5 h-3.5" />
              Yatırım Fonları
            </TabsTrigger>
            <TabsTrigger value="ipo" className="rounded-lg data-[state=active]:bg-zinc-800 data-[state=active]:text-white transition-all duration-300 gap-2">
              <CalendarIconUI className="w-3.5 h-3.5" />
              Halka Arzlar
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="bist" className="space-y-6 outline-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-white">Portföy Detayı (BIST)</h2>
              <p className="text-white/60 text-sm mt-1">Borsa İstanbul hisselerinizi buradan takip edin.</p>
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="w-4 h-4" />
              Yeni Hisse Ekle
            </Button>
          </div>
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/10 rounded-xl border border-zinc-900">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key="bist"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <AssetTable assets={assets} market="BIST" priceMap={priceMap} onRefresh={() => fetchAssetsOnly(false)} />
              </motion.div>
            </AnimatePresence>
          )}
        </TabsContent>

        <TabsContent value="us" className="space-y-6 outline-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-white">Portföy Detayı (ABD)</h2>
              <p className="text-white/60 text-sm mt-1">Amerikan borsalarındaki yatırımlarınızı izleyin.</p>
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="w-4 h-4" />
              Yeni Hisse Ekle
            </Button>
          </div>
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/10 rounded-xl border border-zinc-900">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key="us"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <AssetTable assets={assets} market="US" priceMap={priceMap} onRefresh={() => fetchAssetsOnly(false)} />
              </motion.div>
            </AnimatePresence>
          )}
        </TabsContent>

        <TabsContent value="funds" className="space-y-6 outline-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-white">Fon Takibi</h2>
              <p className="text-white/60 text-sm mt-1">Yatırım fonlarınızı buradan takip edebilir ve yönetebilirsiniz.</p>
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
            <AnimatePresence mode="wait">
              <motion.div
                key="funds"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <FundTable funds={funds} priceMap={fundPriceMap} onRefresh={() => fetchFundsOnly(false)} />
              </motion.div>
            </AnimatePresence>
          )}
        </TabsContent>

        <TabsContent value="ipo" className="space-y-12 outline-none">
          {/* Agenda IPOs */}
          {agendaIpos.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <h2 className="text-xl font-semibold tracking-tight text-white">Yeni Halka Arzlar</h2>
                <Badge variant="outline" className="text-[10px] font-bold border-zinc-800 text-zinc-500">GÜNCEL</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {agendaIpos.map((ipo, idx) => {
                  const isParticipated = publicOfferings.some((p: any) => {
                    const pSymbol = p.symbol.split(".")[0].toUpperCase();
                    const iSymbol = ipo.symbol.toUpperCase();
                    return pSymbol === iSymbol;
                  });

                  const isApplicationToday = isTodayInIpoDate(ipo.date);

                  return (
                    <Card key={idx} className={cn("group transition-all duration-300 hover:border-zinc-700 gap-y-1", isParticipated && "border-emerald-500/50 bg-emerald-500/5 hover:border-emerald-500/70", !isParticipated && isApplicationToday && "border-amber-500/50 bg-amber-500/5")}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-x-1.5">
                            <span className="text-zinc-500 uppercase font-bold text-xs tracking-tight">
                              {ipo.symbol || "IPO"}
                            </span>
                            <TrendingUp className="w-3 h-3 text-zinc-500" />
                          </div>
                          <div className="flex gap-1.5">
                            {!isParticipated && isApplicationToday && (
                              <Badge variant="outline" className="text-amber-400 bg-amber-400/10 animate-pulse border-amber-400/30">
                                Talep Girin
                              </Badge>
                            )}
                            {isParticipated && (
                              <Badge variant="outline" className="text-emerald-400 bg-emerald-400/10">
                                Katıldınız
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardTitle>
                          {ipo.name}
                        </CardTitle>
                        <div className="flex items-center gap-1 mt-2 text-zinc-500">
                          <CalendarIconUI className="w-3 h-3" />
                          <p className="text-[12px] font-medium tracking-tight uppercase">
                            {ipo.date}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Halka Arz Takibi */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-white">Halka Arz Takibi</h2>
                <p className="text-white/60 text-sm mt-1">Halk arz taleplerinizi ve dağıtım sonuçlarını izleyin.</p>
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
              <AnimatePresence mode="wait">
                <motion.div
                  key="ipo"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <IpoList offerings={publicOfferings} onRefresh={() => fetchIposOnly(false)} />
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Ekleme Formları */}
      <AssetForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialMarket={activeTab === "us" ? "US" : "BIST"}
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
