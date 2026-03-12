"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  ArrowLeft,
  CalendarDays,
  ChartSpline,
  CircleDollarSign,
  Loader2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Summary {
  totalLots: number;
  totalTransactions: number;
  buyTransactions: number;
  sellTransactions: number;
  totalCost: number;
  avgCost: number;
  currentPrice: number;
  currentValue: number;
  totalProfit: number;
  totalProfitPercent: number;
}

interface BankBreakdown {
  bankName: string;
  totalLots: number;
  totalCost: number;
  avgCost: number;
  lotRatioPercent: number;
}

interface Operation {
  id: string;
  type: "BUY" | "SELL";
  amount: number;
  price: number;
  date: string;
  bankName: string;
  totalValue: number;
  realizedProfit: number;
  costBasis: number;
}

interface DailyPerformance {
  date: string;
  label: string;
  close: number;
  positionValue: number;
  totalProfit: number;
  dailyGain: number;
  dailyGainPercent: number;
}

interface MonthlyPerformance {
  monthKey: string;
  monthLabel: string;
  firstClose: number;
  lastClose: number;
  gain: number;
  gainPercent: number;
  endValue: number;
  endProfit: number;
  endDate: string;
}

interface AnalyticsResponse {
  symbol: string;
  displaySymbol: string;
  market: "BIST" | "US";
  currencySymbol: string;
  summary: Summary;
  bankBreakdown: BankBreakdown[];
  operations: Operation[];
  dailyPerformance: DailyPerformance[];
  monthlyPerformance: MonthlyPerformance[];
}

function formatAmount(value: number, market: "BIST" | "US") {
  return value.toLocaleString(market === "BIST" ? "tr-TR" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatLot(value: number) {
  return value.toLocaleString("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}

export default function StockAnalyticsPage() {
  const params = useParams<{ market: string; symbol: string }>();
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/assets/analytics/${params.market}/${params.symbol}`,
          { cache: "no-store" },
        );
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Analitik verisi alınamadı.");
        }

        if (isMounted) {
          setData(payload);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Beklenmeyen bir hata oluştu.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [params.market, params.symbol]);


  const chartData = useMemo(() => {
    if (!data?.dailyPerformance) return [];
    return data.dailyPerformance.slice(-120);
  }, [data]);

  // Show/hide state for daily/monthly tables
  const [showAllDaily, setShowAllDaily] = useState(false);
  const [showAllMonthly, setShowAllMonthly] = useState(false);
  const DAILY_LIMIT = 10;
  const DAILY_MAX = 30;
  const MONTHLY_LIMIT = 10;

  const dailyRows = useMemo(() => {
    if (!data?.dailyPerformance) return [];
    const all = [...data.dailyPerformance].reverse();
    const capped = all.slice(0, DAILY_MAX);
    return showAllDaily ? capped : capped.slice(0, DAILY_LIMIT);
  }, [data, showAllDaily]);

  const monthlyRows = useMemo(() => {
    if (!data?.monthlyPerformance) return [];
    const all = [...data.monthlyPerformance].reverse();
    return showAllMonthly ? all : all.slice(0, MONTHLY_LIMIT);
  }, [data, showAllMonthly]);

  if (loading) {
    return (
      <main className="container mx-auto px-6 py-10">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="container mx-auto px-6 py-10">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <Card className="bg-zinc-950/40 border-zinc-900">
          <CardHeader>
            <CardTitle>Veri Alınamadı</CardTitle>
            <CardDescription>
              {error || "Analitik verisi şu an yüklenemiyor."}
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const currency = data.currencySymbol;

  return (
    <main className="container mx-auto px-6 py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              {data.displaySymbol} Detay Analiz
            </h1>
            <Badge variant="outline" className="border-zinc-800 text-zinc-400">
              {data.market}
            </Badge>
          </div>
          <p className="text-sm text-zinc-500 ml-10">
            Günlük ve aylık kazanç trendi, işlem geçmişi ve hesap bazlı lot
            dağılımı.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <Card className="bg-zinc-950/40 border-zinc-900 gap-y-0">
          <CardHeader>
            <CardDescription className="text-xs">Toplam Lot</CardDescription>
            <CardTitle className="text-xl font-bold text-white">
              {formatLot(data.summary.totalLots)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-zinc-500">
            Aktif pozisyon adedi
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/40 border-zinc-900 gap-y-0">
          <CardHeader>
            <CardDescription className="text-xs">Toplam İşlem</CardDescription>
            <CardTitle className="text-xl font-bold text-white">
              {data.summary.totalTransactions}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-zinc-500">
            {data.summary.buyTransactions} alış / {data.summary.sellTransactions} satış
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/40 border-zinc-900 gap-y-0">
          <CardHeader>
            <CardDescription className="text-xs">Ortalama Maliyet</CardDescription>
            <CardTitle className="text-xl font-bold text-white">
              {currency}
              {formatAmount(data.summary.avgCost, data.market)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-zinc-500">
            Lot başına ortalama maliyet
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/40 border-zinc-900 gap-y-0">
          <CardHeader>
            <CardDescription className="text-xs">Güncel Değer</CardDescription>
            <CardTitle className="text-xl font-bold text-white">
              {currency}
              {formatAmount(data.summary.currentValue, data.market)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-zinc-500">
            Fiyat: {currency}
            {formatAmount(data.summary.currentPrice, data.market)}
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/40 border-zinc-900 gap-y-0">
          <CardHeader>
            <CardDescription className="text-xs">Toplam Kar/Zarar</CardDescription>
            <CardTitle
              className={cn(
                "text-xl font-bold",
                data.summary.totalProfit >= 0 ? "text-emerald-400" : "text-red-400",
              )}
            >
              {data.summary.totalProfit >= 0 ? "+" : ""}
              {currency}
              {formatAmount(data.summary.totalProfit, data.market)}
            </CardTitle>
          </CardHeader>
          <CardContent
            className={cn(
              "pt-0 text-xs",
              data.summary.totalProfit >= 0 ? "text-emerald-400" : "text-red-400",
            )}
          >
            %{data.summary.totalProfitPercent.toFixed(2)}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 bg-zinc-950/35 border-zinc-900">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ChartSpline className="w-4 h-4 text-zinc-400" />
              <CardTitle>Kar/Zarar Trendi (Son 120 Gün)</CardTitle>
            </div>
            <CardDescription>
              Gün sonu fiyatlarına göre pozisyon değerinizin zaman içindeki değişimi.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[360px]">
            {chartData.length === 0 ? (
              <div className="h-full rounded-xl border border-zinc-900 bg-zinc-950/40 flex items-center justify-center text-zinc-500 text-sm">
                Grafik için yeterli fiyat verisi yok.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="valueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="label"
                    stroke="#71717a"
                    tick={{ fontSize: 12 }}
                    minTickGap={24}
                  />
                  <YAxis stroke="#71717a" tick={{ fontSize: 12 }} width={90} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      backgroundColor: "#09090b",
                      border: "1px solid #27272a",
                    }}
                    formatter={(value, _name, entry) => {
                      const numericValue = Number(value ?? 0);
                      const dataKey = String(entry?.dataKey || "");
                      if (dataKey === "close") {
                        return [`${currency}${formatAmount(numericValue, data.market)}`, "Fiyat"];
                      }
                      if (dataKey === "positionValue") {
                        return [
                          `${currency}${formatAmount(numericValue, data.market)}`,
                          "Pozisyon Değeri",
                        ];
                      }
                      return [`${currency}${formatAmount(numericValue, data.market)}`, "Toplam Kar/Zarar"];
                    }}
                    labelFormatter={(_, payload) => {
                      const point = payload?.[0]?.payload as DailyPerformance | undefined;
                      if (!point) return "";
                      return format(new Date(point.date), "dd MMM yyyy", { locale: tr });
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="positionValue"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    fill="url(#valueFill)"
                    name="Pozisyon Değeri"
                  />
                  <Area
                    type="monotone"
                    dataKey="totalProfit"
                    stroke="#34d399"
                    strokeWidth={2}
                    fill="url(#profitFill)"
                    name="Toplam Kar/Zarar"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/35 border-zinc-900">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-zinc-400" />
              <CardTitle>Hesap Bazlı Lot Dağılımı</CardTitle>
            </div>
            <CardDescription>
              Birden fazla hesapta aldıysanız lot dağılımı burada ayrı görünür.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.bankBreakdown.length === 0 ? (
              <div className="rounded-xl border border-zinc-900 bg-zinc-950/50 text-zinc-500 text-sm p-4 text-center">
                Hesap kırılımı için kayıt bulunamadı.
              </div>
            ) : (
              data.bankBreakdown.map((item) => (
                <div key={item.bankName} className="rounded-xl border border-zinc-900 bg-zinc-950/45 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-zinc-200 text-sm">{item.bankName}</span>
                    <Badge variant="outline" className="border-zinc-800 text-zinc-400 text-[10px]">
                      %{item.lotRatioPercent.toFixed(1)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-zinc-400">
                    <div>
                      <p className="text-zinc-500">Lot</p>
                      <p className="text-zinc-200 font-semibold">{formatLot(item.totalLots)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Ortalama</p>
                      <p className="text-zinc-200 font-semibold">
                        {currency}
                        {formatAmount(item.avgCost, data.market)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-950/35 border-zinc-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-zinc-400" />
            <CardTitle>Performans Tabloları</CardTitle>
          </div>
          <CardDescription>
            Son 30 gün günlük ve son 12 ay aylık performansınız.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="daily" className="space-y-4">
            <TabsList className="bg-zinc-900/60 border border-zinc-800/60">
              <TabsTrigger value="daily">Günlük</TabsTrigger>
              <TabsTrigger value="monthly">Aylık</TabsTrigger>
            </TabsList>

            <TabsContent value="daily">
              <div className="rounded-xl border border-zinc-900 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-900 hover:bg-transparent">
                      <TableHead>Tarih</TableHead>
                      <TableHead className="text-right">Fiyat</TableHead>
                      <TableHead className="text-right">Günlük Kazanç</TableHead>
                      <TableHead className="text-right">Toplam Kar/Zarar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyRows.length === 0 ? (
                      <TableRow className="border-zinc-900">
                        <TableCell colSpan={4} className="text-center py-8 text-zinc-500">
                          Günlük performans için veri bulunamadı.
                        </TableCell>
                      </TableRow>
                    ) : (
                      dailyRows.map((row) => (
                        <TableRow key={row.date} className="border-zinc-900">
                          <TableCell className="text-zinc-300">
                            {format(new Date(row.date), "dd MMM yyyy", { locale: tr })}
                          </TableCell>
                          <TableCell className="text-right text-zinc-200 font-medium">
                            {currency}
                            {formatAmount(row.close, data.market)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-semibold",
                              row.dailyGain >= 0 ? "text-emerald-400" : "text-red-400",
                            )}
                          >
                            {row.dailyGain >= 0 ? "+" : ""}
                            {currency}
                            {formatAmount(row.dailyGain, data.market)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-semibold",
                              row.totalProfit >= 0 ? "text-emerald-400" : "text-red-400",
                            )}
                          >
                            {row.totalProfit >= 0 ? "+" : ""}
                            {currency}
                            {formatAmount(row.totalProfit, data.market)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {/* Show more/less button */}
                {data?.dailyPerformance && data.dailyPerformance.length > DAILY_LIMIT && (
                  <div className="flex justify-center py-3 bg-zinc-950/60 border-t border-zinc-900">
                    <button
                      className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors px-4 py-1 rounded-lg border border-zinc-800 bg-zinc-900/40"
                      onClick={() => setShowAllDaily((v) => !v)}
                    >
                      {showAllDaily
                        ? "Daha Az Göster"
                        : `Daha Fazla Göster (${Math.max(
                            0,
                            Math.min(data.dailyPerformance.length, DAILY_MAX) - DAILY_LIMIT,
                          )})`}
                    </button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="monthly">
              <div className="rounded-xl border border-zinc-900 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-900 hover:bg-transparent">
                      <TableHead>Ay</TableHead>
                      <TableHead className="text-right">Ay Sonu Fiyat</TableHead>
                      <TableHead className="text-right">Aylık Kazanç</TableHead>
                      <TableHead className="text-right">Ay Sonu Toplam Kar/Zarar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyRows.length === 0 ? (
                      <TableRow className="border-zinc-900">
                        <TableCell colSpan={4} className="text-center py-8 text-zinc-500">
                          Aylık performans için veri bulunamadı.
                        </TableCell>
                      </TableRow>
                    ) : (
                      monthlyRows.map((row) => (
                        <TableRow key={row.monthKey} className="border-zinc-900">
                          <TableCell className="text-zinc-300">{row.monthLabel}</TableCell>
                          <TableCell className="text-right text-zinc-200 font-medium">
                            {currency}
                            {formatAmount(row.lastClose, data.market)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-semibold",
                              row.gain >= 0 ? "text-emerald-400" : "text-red-400",
                            )}
                          >
                            {row.gain >= 0 ? "+" : ""}
                            {currency}
                            {formatAmount(row.gain, data.market)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-semibold",
                              row.endProfit >= 0 ? "text-emerald-400" : "text-red-400",
                            )}
                          >
                            {row.endProfit >= 0 ? "+" : ""}
                            {currency}
                            {formatAmount(row.endProfit, data.market)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {/* Show more/less button */}
                {data?.monthlyPerformance && data.monthlyPerformance.length > MONTHLY_LIMIT && (
                  <div className="flex justify-center py-3 bg-zinc-950/60 border-t border-zinc-900">
                    <button
                      className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors px-4 py-1 rounded-lg border border-zinc-800 bg-zinc-900/40"
                      onClick={() => setShowAllMonthly((v) => !v)}
                    >
                      {showAllMonthly ? "Daha Az Göster" : `Daha Fazla Göster (${data.monthlyPerformance.length - MONTHLY_LIMIT})`}
                    </button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="bg-zinc-950/35 border-zinc-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CircleDollarSign className="w-4 h-4 text-zinc-400" />
            <CardTitle>İşlem Geçmişi</CardTitle>
          </div>
          <CardDescription>
            Daha önce yaptığınız alış/satış işlemleri detaylarıyla listelenir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-zinc-900 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-900 hover:bg-transparent">
                  <TableHead>Tarih</TableHead>
                  <TableHead>İşlem</TableHead>
                  <TableHead>Hesap</TableHead>
                  <TableHead className="text-right">Lot</TableHead>
                  <TableHead className="text-right">Fiyat</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead className="text-right">Gerçekleşen Kar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.operations.length === 0 ? (
                  <TableRow className="border-zinc-900">
                    <TableCell colSpan={7} className="text-center py-10 text-zinc-500">
                      Bu hisse için henüz işlem kaydı bulunamadı.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.operations.map((operation) => (
                    <TableRow key={operation.id} className="border-zinc-900">
                      <TableCell className="text-zinc-300">
                        {format(new Date(operation.date), "dd MMM yyyy", { locale: tr })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-zinc-800",
                            operation.type === "BUY"
                              ? "text-emerald-400 bg-emerald-400/10"
                              : "text-red-400 bg-red-400/10",
                          )}
                        >
                          {operation.type === "BUY" ? (
                            <span className="inline-flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" /> ALIŞ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <TrendingDown className="w-3 h-3" /> SATIŞ
                            </span>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-300">{operation.bankName}</TableCell>
                      <TableCell className="text-right text-zinc-200 font-medium">
                        {formatLot(operation.amount)}
                      </TableCell>
                      <TableCell className="text-right text-zinc-200 font-medium">
                        {currency}
                        {formatAmount(operation.price, data.market)}
                      </TableCell>
                      <TableCell className="text-right text-zinc-200 font-medium">
                        {currency}
                        {formatAmount(operation.totalValue, data.market)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-semibold",
                          operation.realizedProfit >= 0
                            ? "text-emerald-400"
                            : "text-red-400",
                        )}
                      >
                        {operation.type === "SELL" ? (
                          <>
                            {operation.realizedProfit >= 0 ? "+" : ""}
                            {currency}
                            {formatAmount(operation.realizedProfit, data.market)}
                          </>
                        ) : (
                          <span className="text-zinc-500">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
