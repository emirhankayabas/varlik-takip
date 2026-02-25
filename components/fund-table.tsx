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
import { cn } from "@/lib/utils";
import { FundSellDialog } from "./fund-sell-dialog";

interface FundAsset {
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

interface FundWithPrice extends FundAsset {
    currentPrice?: number;
    changePercent?: number;
    dailyChange?: number;
    name?: string;
}

interface FundTableProps {
    funds: FundAsset[];
    priceMap: Record<string, { price: number; changePercent?: number; change?: number; name?: string }>;
    onRefresh: () => void;
}

export function FundTable({ funds, priceMap, onRefresh }: FundTableProps) {
    const [data, setData] = useState<FundWithPrice[]>([]);
    const [sellingAsset, setSellingAsset] = useState<FundWithPrice | null>(null);

    useEffect(() => {
        const updatedData = funds.map((fund) => ({
            ...fund,
            currentPrice: priceMap[fund.symbol]?.price,
            changePercent: priceMap[fund.symbol]?.changePercent,
            dailyChange: priceMap[fund.symbol]?.change,
            name: priceMap[fund.symbol]?.name,
        }));

        setData(updatedData);
    }, [funds, priceMap]);

    if (funds.length === 0) {
        return (
            <div className="text-center py-20 bg-zinc-950/20 rounded-3xl border border-zinc-900 border-dashed">
                <p className="text-zinc-500 text-sm">Hala bir fon varlığı eklemediniz.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 overflow-hidden backdrop-blur-sm shadow-2xl">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Fon</TableHead>
                        <TableHead>Kurum</TableHead>
                        <TableHead className="text-right">Adet</TableHead>
                        <TableHead className="text-right">Maliyet (₺)</TableHead>
                        <TableHead className="text-right">Fiyat (₺)</TableHead>
                        <TableHead className="text-right">Günlük</TableHead>
                        <TableHead className="text-right">Toplam Değer</TableHead>
                        <TableHead className="text-right">Performans</TableHead>
                        <TableHead className="w-10 "></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((fund) => {
                        const cost = fund.amount * fund.buyPrice;
                        const currentVal = fund.currentPrice
                            ? fund.amount * fund.currentPrice
                            : null;
                        const profit = currentVal ? currentVal - cost : null;
                        const profitPercent = profit ? (profit / cost) * 100 : null;

                        return (
                            <TableRow key={fund._id} className=" group leading-tight">
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm tracking-tight">
                                            {fund.symbol}
                                        </span>
                                        <span className="text-[10px] text-zinc-500 font-medium line-clamp-1 max-w-[150px]">
                                            {fund.name || "Yatırım Fonu"}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">
                                        {fund.bankId?.name || "Bilinmiyor"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">{fund.amount.toLocaleString("tr-TR")}</TableCell>
                                <TableCell className="text-right">
                                    ₺
                                    {fund.buyPrice.toLocaleString("tr-TR", {
                                        minimumFractionDigits: 6,
                                        maximumFractionDigits: 6,
                                    })}
                                </TableCell>
                                <TableCell className="text-right">
                                    {fund.currentPrice ? (
                                        <span className="text-white font-medium whitespace-nowrap">
                                            ₺
                                            {fund.currentPrice.toLocaleString("tr-TR", {
                                                minimumFractionDigits: 6,
                                                maximumFractionDigits: 6,
                                            })}
                                        </span>
                                    ) : (
                                        <Loader2 className="inline h-3 w-3 animate-spin text-zinc-700" />
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    {fund.changePercent !== undefined ? (
                                        <div className="flex flex-col items-end">
                                            <span
                                                className="text-white font-medium"
                                            >
                                                {fund.changePercent >= 0 ? "+" : ""}₺
                                                {(fund.amount * (fund.dailyChange || 0)).toLocaleString("tr-TR", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </span>
                                            <span
                                                className={cn(
                                                    "text-[10px] font-medium px-1 rounded inline-flex items-center mt-0.5",
                                                    fund.changePercent >= 0
                                                        ? "text-emerald-400 bg-emerald-400/10"
                                                        : "text-red-400 bg-red-400/10",
                                                )}
                                            >
                                                {fund.changePercent >= 0 ? "+" : ""}
                                                {fund.changePercent.toFixed(2)}%
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-zinc-700">-</span>
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
                                                    maximumFractionDigits: 2,
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
                                        onClick={() => setSellingAsset(fund)}
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
                <FundSellDialog
                    open={!!sellingAsset}
                    onOpenChange={(open) => !open && setSellingAsset(null)}
                    fundId={sellingAsset._id}
                    symbol={sellingAsset.symbol}
                    currentAmount={sellingAsset.amount}
                    avgBuyPrice={sellingAsset.buyPrice}
                    currentPrice={sellingAsset.currentPrice}
                    onSuccess={onRefresh}
                />
            )}
        </div>
    );
}
