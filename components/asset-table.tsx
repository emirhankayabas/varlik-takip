"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { SellDialog } from "./sell-dialog";

interface Asset {
  _id: string;
  symbol: string;
  amount: number;
  buyPrice: number;
  bankId?: {
    _id: string;
    name: string;
  };
  buyDate: string;
}

interface AssetWithPrice extends Asset {
  currentPrice?: number;
  changePercent?: number;
}

interface AssetTableProps {
  assets: Asset[];
  onRefresh: () => void;
}

export function AssetTable({ assets, onRefresh }: AssetTableProps) {
  const [data, setData] = useState<AssetWithPrice[]>([]);
  const [sellingAsset, setSellingAsset] = useState<AssetWithPrice | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      // 1. Benzersiz sembolleri ayıkla (Örn: "BESTE.IS" iki kez varsa tek liste al)
      const uniqueSymbols = Array.from(new Set(assets.map((a) => a.symbol)));

      try {
        // 2. Sadece benzersiz semboller için fiyatları çek
        const priceMap: Record<
          string,
          { price: number; changePercent?: number }
        > = {};

        await Promise.all(
          uniqueSymbols.map(async (symbol) => {
            try {
              const res = await fetch(`/api/prices/${symbol}`);
              const priceData = await res.json();
              priceMap[symbol] = {
                price: priceData.price,
                changePercent: priceData.changePercent,
              };
            } catch (error) {
              console.error(`${symbol} fiyatı çekilemedi`);
            }
          }),
        );

        // 3. Çekilen bu fiyatları tüm orijinal varlıklara dağıt
        const updatedData = assets.map((asset) => ({
          ...asset,
          currentPrice: priceMap[asset.symbol]?.price,
          changePercent: priceMap[asset.symbol]?.changePercent,
        }));

        setData(updatedData);
      } catch (error) {
        console.error("Fiyatlar güncellenirken hata oluştu");
      }
    };

    if (assets.length > 0) {
      fetchPrices();
    } else {
      setData([]);
    }
  }, [assets]);

  if (assets.length === 0) {
    return (
      <div className="text-center py-20 bg-zinc-950/20 rounded-3xl border border-zinc-900 border-dashed">
        <p className="text-zinc-500 text-sm">Hala bir varlık eklemediniz.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 overflow-hidden backdrop-blur-sm shadow-2xl animate-in fade-in slide-in-from-top-4 duration-1000">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Hisse</TableHead>
            <TableHead>Kurum</TableHead>
            <TableHead className="text-right">Adet</TableHead>
            <TableHead className="text-right">Maliyet (₺)</TableHead>
            <TableHead className="text-right">Fiyat (₺)</TableHead>
            <TableHead className="text-right">Toplam Değer</TableHead>
            <TableHead className="text-right">Performans</TableHead>
            <TableHead className="w-10 "></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((asset) => {
            const cost = asset.amount * asset.buyPrice;
            const currentVal = asset.currentPrice
              ? asset.amount * asset.currentPrice
              : null;
            const profit = currentVal ? currentVal - cost : null;
            const profitPercent = profit ? (profit / cost) * 100 : null;

            return (
              <TableRow key={asset._id} className=" group">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm tracking-tight">
                      {asset.symbol.replace(".IS", "")}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-medium">
                      Portföy Varlığı
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {asset.bankId?.name || "Bilinmiyor"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{asset.amount}</TableCell>
                <TableCell className="text-right">
                  ₺
                  {asset.buyPrice.toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  {asset.currentPrice ? (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-white font-medium">
                        ₺
                        {asset.currentPrice.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      {asset.changePercent !== undefined && (
                        <span
                          className={cn(
                            "text-[10px] font-bold px-1 rounded flex items-center gap-0.5",
                            asset.changePercent >= 0
                              ? "text-emerald-400 bg-emerald-400/10"
                              : "text-red-400 bg-red-400/10",
                          )}
                        >
                          {asset.changePercent >= 0 ? "+" : ""}
                          {asset.changePercent.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  ) : (
                    <Loader2 className="inline h-3 w-3 animate-spin text-zinc-700" />
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {currentVal !== null ? (
                    <span className="font-bold text-zinc-100">
                      ₺{currentVal.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  ) : (
                    <span className="text-zinc-700">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {profit !== null ? (
                    <div className="flex flex-col">
                      <span
                        className={cn(
                          "text-xs font-bold",
                          profit >= 0 ? "text-emerald-400" : "text-red-400",
                        )}
                      >
                        {profit >= 0 ? "+" : ""}₺
                        {profit.toLocaleString("tr-TR", {
                          maximumFractionDigits: 0,
                        })}
                      </span>
                      <div className="flex items-center justify-end text-[10px] font-bold opacity-80 mt-0.5 whitespace-nowrap">
                        {profit >= 0 ? (
                          <span className="text-emerald-500 flex items-center gap-0.5">
                            <TrendingUp className="w-2.5 h-2.5" />%
                            {profitPercent?.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-red-500 flex items-center gap-0.5">
                            <TrendingDown className="w-2.5 h-2.5" />%
                            {Math.abs(profitPercent || 0).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-zinc-700">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSellingAsset(asset)}
                    className="h-8 w-8 rounded-full text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  >
                    <TrendingDown className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {sellingAsset && (
        <SellDialog
          open={!!sellingAsset}
          onOpenChange={(open) => !open && setSellingAsset(null)}
          assetId={sellingAsset._id}
          symbol={sellingAsset.symbol}
          currentAmount={sellingAsset.amount}
          avgBuyPrice={sellingAsset.buyPrice}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
}

// Helpers
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
