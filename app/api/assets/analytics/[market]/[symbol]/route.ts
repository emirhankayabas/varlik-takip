import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Asset from "@/lib/models/Asset";

type MarketType = "BIST" | "US";

interface PricePoint {
  date: string;
  label: string;
  close: number;
  positionValue: number;
  totalProfit: number;
  dailyGain: number;
  dailyGainPercent: number;
}

function normalizeMarket(input: string): MarketType | null {
  const upper = input.toUpperCase();
  if (upper === "BIST") return "BIST";
  if (upper === "US") return "US";
  return null;
}

function normalizeSymbol(input: string, market: MarketType): string {
  const raw = decodeURIComponent(input).toUpperCase();
  if (market === "BIST" && !raw.includes(".")) {
    return `${raw}.IS`;
  }
  return raw;
}

function toDateLabel(date: Date): string {
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function toMonthLabel(year: number, month: number): string {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("tr-TR", {
    month: "short",
    year: "numeric",
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ market: string; symbol: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const routeParams = await params;
  const market = normalizeMarket(routeParams.market);

  if (!market) {
    return NextResponse.json(
      { error: "Geçersiz piyasa. Yalnızca BIST veya US kullanılabilir." },
      { status: 400 },
    );
  }

  const symbol = normalizeSymbol(routeParams.symbol, market);

  try {
    await dbConnect();

    const operationsRaw = await Asset.find({
      userId: session.user.id,
      symbol,
    })
      .populate("bankId", "name")
      .sort({ buyDate: -1, createdAt: -1 })
      .lean();

    const operations = operationsRaw.map((op: any) => {
      const bank = op.bankId as { _id?: string; name?: string } | null;
      const opPrice = Number(op.buyPrice || 0);
      const opAmount = Number(op.amount || 0);

      return {
        id: String(op._id),
        type: op.type,
        amount: opAmount,
        price: opPrice,
        date: new Date(op.buyDate).toISOString(),
        bankName: bank?.name || "Bilinmiyor",
        totalValue: opAmount * opPrice,
        realizedProfit: Number(op.realizedProfit || 0),
        costBasis: Number(op.costBasis || 0),
      };
    });

    const buyOperations = operations.filter((op) => op.type === "BUY");
    const sellOperations = operations.filter((op) => op.type === "SELL");

    const totalLots = buyOperations.reduce((sum, op) => sum + op.amount, 0);
    const totalCost = buyOperations.reduce(
      (sum, op) => sum + op.amount * op.price,
      0,
    );
    const avgCost = totalLots > 0 ? totalCost / totalLots : 0;

    const bankMap = new Map<
      string,
      { bankName: string; totalLots: number; totalCost: number }
    >();

    for (const op of buyOperations) {
      const current = bankMap.get(op.bankName) || {
        bankName: op.bankName,
        totalLots: 0,
        totalCost: 0,
      };

      current.totalLots += op.amount;
      current.totalCost += op.amount * op.price;
      bankMap.set(op.bankName, current);
    }

    const bankBreakdown = Array.from(bankMap.values())
      .map((item) => ({
        ...item,
        avgCost: item.totalLots > 0 ? item.totalCost / item.totalLots : 0,
        lotRatioPercent: totalLots > 0 ? (item.totalLots / totalLots) * 100 : 0,
      }))
      .sort((a, b) => b.totalLots - a.totalLots);

    let priceSeries: PricePoint[] = [];
    let currentPrice = 0;

    try {
      const priceResponse = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1y&interval=1d`,
        {
          cache: "no-store",
        },
      );

      if (priceResponse.ok) {
        const payload = await priceResponse.json();
        const result = payload?.chart?.result?.[0];

        const timestamps: number[] = result?.timestamp || [];
        const closeValues: Array<number | null> =
          result?.indicators?.quote?.[0]?.close || [];
        const marketPrice = Number(result?.meta?.regularMarketPrice || 0);

        const parsed = timestamps
          .map((ts, index) => {
            const close = Number(closeValues[index]);
            if (!Number.isFinite(close) || close <= 0) {
              return null;
            }

            const pointDate = new Date(ts * 1000);

            return {
              pointDate,
              close,
            };
          })
          .filter((item): item is { pointDate: Date; close: number } => !!item)
          .sort((a, b) => a.pointDate.getTime() - b.pointDate.getTime());

        priceSeries = parsed.map((entry, index) => {
          const previous = parsed[index - 1];
          const dailyGain = previous
            ? (entry.close - previous.close) * totalLots
            : 0;
          const dailyGainPercent = previous
            ? ((entry.close - previous.close) / previous.close) * 100
            : 0;
          const positionValue = entry.close * totalLots;

          return {
            date: entry.pointDate.toISOString(),
            label: toDateLabel(entry.pointDate),
            close: entry.close,
            positionValue,
            totalProfit: positionValue - totalCost,
            dailyGain,
            dailyGainPercent,
          };
        });

        currentPrice =
          marketPrice > 0
            ? marketPrice
            : priceSeries[priceSeries.length - 1]?.close || 0;
      }
    } catch (priceError) {
      console.error("Fiyat geçmişi alınamadı:", priceError);
    }

    const monthMap = new Map<
      string,
      {
        year: number;
        month: number;
        firstClose: number;
        lastClose: number;
        endDate: string;
      }
    >();

    for (const point of priceSeries) {
      const d = new Date(point.date);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const key = `${year}-${String(month).padStart(2, "0")}`;
      const existing = monthMap.get(key);

      if (!existing) {
        monthMap.set(key, {
          year,
          month,
          firstClose: point.close,
          lastClose: point.close,
          endDate: point.date,
        });
      } else {
        existing.lastClose = point.close;
        existing.endDate = point.date;
      }
    }

    const monthlyPerformance = Array.from(monthMap.entries())
      .map(([monthKey, value]) => {
        const monthlyGain = (value.lastClose - value.firstClose) * totalLots;
        const monthlyGainPercent =
          value.firstClose > 0
            ? ((value.lastClose - value.firstClose) / value.firstClose) * 100
            : 0;
        const endValue = value.lastClose * totalLots;

        return {
          monthKey,
          monthLabel: toMonthLabel(value.year, value.month),
          firstClose: value.firstClose,
          lastClose: value.lastClose,
          gain: monthlyGain,
          gainPercent: monthlyGainPercent,
          endValue,
          endProfit: endValue - totalCost,
          endDate: value.endDate,
        };
      })
      .sort((a, b) =>
        new Date(a.endDate).getTime() - new Date(b.endDate).getTime(),
      );

    const currentValue = currentPrice * totalLots;
    const totalProfit = currentValue - totalCost;
    const totalProfitPercent =
      totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    return NextResponse.json({
      symbol,
      displaySymbol: symbol.replace(".IS", ""),
      market,
      currencySymbol: market === "BIST" ? "₺" : "$",
      summary: {
        totalLots,
        totalTransactions: operations.length,
        buyTransactions: buyOperations.length,
        sellTransactions: sellOperations.length,
        totalCost,
        avgCost,
        currentPrice,
        currentValue,
        totalProfit,
        totalProfitPercent,
      },
      bankBreakdown,
      operations,
      dailyPerformance: priceSeries,
      monthlyPerformance,
    });
  } catch (error) {
    console.error("API Error (/api/assets/analytics):", error);
    return NextResponse.json(
      {
        error: "Hisse analitiği alınamadı",
        details: error instanceof Error ? error.message : "Bilinmeyen hata",
      },
      { status: 500 },
    );
  }
}
