"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  HandCoins,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Sale {
  _id: string;
  symbol: string;
  amount: number;
  buyPrice: number; // Sale price
  costBasis: number; // Original buy price
  buyDate: string; // Sale date
  realizedProfit: number;
  bankId?: {
    _id: string;
    name: string;
  };
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [totalProfit, setTotalProfit] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await fetch("/api/assets/sales");
      const data = await response.json();
      setSales(data.sales || []);
      setTotalProfit(data.totalRealizedProfit || 0);
    } catch (error) {
      console.error("Satışlar yüklenemedi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans selection:bg-white/10">
      <div className="container mx-auto px-6 py-10 max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="space-y-2">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              className="p-0 h-8 w-8 rounded-full text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 mt-8">
          <div>
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Gerçekleşen Karlar
            </CardTitle>
            <CardDescription className="text-zinc-500 text-sm mt-1">
              Geçmişteki satış işlemleriniz ve elde ettiğiniz net kazançlar.
            </CardDescription>
          </div>

          <Card className="min-w-60 gap-0!">
            <CardHeader>
              <CardDescription>Toplam Net Kazanç</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "text-xl font-medium tracking-tight",
                  totalProfit >= 0 ? "text-emerald-400" : "text-red-400",
                )}
              >
                {totalProfit >= 0 ? "+" : ""}₺
                {totalProfit.toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : sales.length === 0 ? (
          <div className="ring-foreground/10 text-card-foreground gap-4 rounded-3xl text-sm ring-1 py-32 flex flex-col items-center text-center bg-zinc-950/50 border-zinc-800 shadow-2xl relative overflow-hidden transition-all">
            <div className="flex items-center justify-center rounded-2xl bg-zinc-900/50 border border-zinc-800 h-16 w-16 mb-4">
              <HandCoins className="w-8 h-8 text-zinc-700" />
            </div>
            <div className="space-y-2">
              <p className="text-zinc-200 text-xl font-bold tracking-tight">
                Henüz Satış Yapılmadı
              </p>
              <p className="text-zinc-500 text-sm max-w-sm leading-relaxed">
                Hisselerinizi sattığınızda gerçekleşen kar ve zarar detayları
                burada listelenecektir.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 overflow-hidden backdrop-blur-sm shadow-2xl animate-in fade-in slide-in-from-top-4 duration-1000">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead>Hisse</TableHead>
                  <TableHead>Kurum</TableHead>
                  <TableHead className="text-right">Adet</TableHead>
                  <TableHead className="text-right">Maliyet (₺)</TableHead>
                  <TableHead className="text-right">Satış Fiyatı (₺)</TableHead>
                  <TableHead className="text-right">Kar / Zarar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow
                    key={sale._id}
                    className="border-zinc-900 hover:bg-zinc-900/40 transition-colors group"
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                          {sale.symbol.replace(".IS", "")}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
                          <CalendarIcon className="w-2.5 h-2.5" />
                          <span>
                            {format(new Date(sale.buyDate), "dd.MM.yyyy", {
                              locale: tr,
                            })}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-zinc-900/50 border-zinc-800 text-zinc-400"
                      >
                        {sale.bankId?.name || "Bilinmiyor"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-zinc-300">
                      {sale.amount}
                    </TableCell>
                    <TableCell className="text-right text-zinc-300">
                      ₺
                      {sale.costBasis.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right text-white font-medium">
                      ₺
                      {sale.buyPrice.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className={cn(
                          "flex flex-col items-end",
                          sale.realizedProfit >= 0
                            ? "text-emerald-400"
                            : "text-red-400",
                        )}
                      >
                        <div className="flex items-center font-bold text-sm tracking-tighter">
                          {sale.realizedProfit >= 0 ? "+" : ""}₺
                          {Math.abs(sale.realizedProfit).toLocaleString(
                            "tr-TR",
                            { minimumFractionDigits: 0 },
                          )}
                        </div>
                        <span className="text-[10px] font-bold opacity-80 mt-0.5">
                          {sale.realizedProfit >= 0 ? (
                            <div className="flex items-center gap-0.5">
                              <TrendingUp className="w-2.5 h-2.5" />
                              <span>KAZANÇ</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-0.5">
                              <TrendingDown className="w-2.5 h-2.5" />
                              <span>KAYIP</span>
                            </div>
                          )}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
