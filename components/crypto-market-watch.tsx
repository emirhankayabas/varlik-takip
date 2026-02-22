import { useEffect, useState, useRef, useMemo, memo, useCallback } from "react";
import { Loader2, TrendingUp, TrendingDown, Settings, Search, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "./ui/sparkline";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { toast } from "sonner";

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  image: string;
}

// Memoized List Item to prevent laggy selection
const CoinListItem = memo(({
  coin,
  isSelected,
  onToggle,
  disabled
}: {
  coin: WatchlistItem;
  isSelected: boolean;
  onToggle: (coin: WatchlistItem) => void;
  disabled: boolean;
}) => {
  return (
    <div
      onClick={() => !disabled && onToggle(coin)}
      className={cn(
        "flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-colors shrink-0",
        isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background border shadow-sm overflow-hidden">
          <Image
            src={coin.image}
            alt={coin.symbol}
            width={24}
            height={24}
            className="object-contain"
            loading="lazy"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{coin.symbol}</span>
          <span className="text-[10px] text-muted-foreground uppercase">{coin.name}</span>
        </div>
      </div>
      {isSelected && (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
          <Check className="h-4 w-4" />
        </div>
      )}
    </div>
  );
});

CoinListItem.displayName = "CoinListItem";

export function CryptoMarketWatch() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [prices, setPrices] = useState<
    Record<string, { price: number; change: number; vol: number; high: number; low: number }>
  >({});
  const [history, setHistory] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currency, setCurrency] = useState<"USD" | "TRY">("USD");
  const [usdToTry, setUsdToTry] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [topCoins, setTopCoins] = useState<WatchlistItem[]>([]);
  const [searchResults, setSearchResults] = useState<WatchlistItem[]>([]);
  const [searching, setSearching] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch User Preferences (Watchlist) & USD/TRY Rate
  useEffect(() => {
    const init = async () => {
      try {
        const [prefRes, rateRes] = await Promise.all([
          fetch("/api/user/preferences"),
          fetch("https://open.er-api.com/v6/latest/USD")
        ]);

        const prefData = await prefRes.json();
        if (prefData.watchlist) setWatchlist(prefData.watchlist);

        const rateData = await rateRes.json();
        if (rateData.rates?.TRY) setUsdToTry(rateData.rates.TRY);
      } catch (error) {
        console.error("Initialization error", error);
      }
    };
    init();
  }, []);

  // Fetch Top Coins for Dialog
  const fetchTopCoins = async () => {
    if (topCoins.length > 0) return;
    try {
      const res = await fetch("/api/crypto/top");
      const data = await res.json();
      setTopCoins(data);
    } catch (error) {
      console.error("Top coins load error", error);
    }
  };

  // Search Logic (Debounced)
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/crypto/search?q=${searchQuery}`);
        const data = await res.json();
        setSearchResults(data);
      } catch (error) {
        console.error("Search error", error);
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Fetch 24h History
  useEffect(() => {
    if (watchlist.length === 0) return;
    const fetchHistory = async () => {
      const historyData: Record<string, number[]> = {};
      try {
        await Promise.all(
          watchlist.map(async (coin) => {
            const res = await fetch(
              `https://www.okx.com/api/v5/market/candles?instId=${coin.symbol}-USDT&bar=1H&limit=24`,
            );
            const json = await res.json();
            if (json.data) {
              const closingPrices = json.data.map((d: any) => parseFloat(d[4])).reverse();
              historyData[coin.symbol] = closingPrices;
            }
          }),
        );
        setHistory((prev) => ({ ...prev, ...historyData }));
        setLoading(false);
      } catch (error) {
        console.error("History fetch error", error);
      }
    };
    fetchHistory();
  }, [watchlist]);

  // Live WebSocket
  useEffect(() => {
    if (watchlist.length === 0) return;
    const symbols = watchlist.map((s) => `${s.symbol}-USDT`);
    const ws = new WebSocket("wss://ws.okx.com:8443/ws/v5/public");
    wsRef.current = ws;

    ws.onopen = () => {
      const args = symbols.map((s) => ({ channel: "tickers", instId: s }));
      ws.send(JSON.stringify({ op: "subscribe", args }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.data?.[0]) {
        const ticker = data.data[0];
        const symbol = ticker.instId.split("-")[0];
        const price = parseFloat(ticker.last);
        const openPrice = parseFloat(ticker.sodUtc0 || ticker.open24h);

        setPrices((prev) => ({
          ...prev,
          [symbol]: {
            price,
            change: ((price - openPrice) / openPrice) * 100,
            vol: parseFloat(ticker.volCcy24h),
            high: parseFloat(ticker.high24h),
            low: parseFloat(ticker.low24h)
          },
        }));
      }
    };
    return () => ws.close();
  }, [watchlist]);

  const saveWatchlist = useCallback(async (newList: WatchlistItem[]) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watchlist: newList }),
      });
      if (res.ok) {
        setWatchlist(newList);
        toast.success("Takip listesi güncellendi");
      }
    } catch (error) {
      toast.error("Kaydedilemedi");
    } finally {
      setIsSaving(false);
    }
  }, []);

  const toggleCoin = useCallback((coin: WatchlistItem) => {
    setWatchlist((currentWatchlist) => {
      const isSelected = currentWatchlist.some(s => s.id === coin.id);
      let newList;
      if (isSelected) {
        if (currentWatchlist.length <= 1) {
          toast.error("En az bir coin takip etmelisin");
          return currentWatchlist;
        }
        newList = currentWatchlist.filter((s) => s.id !== coin.id);
      } else {
        newList = [...currentWatchlist, coin];
      }
      // Trigger save
      saveWatchlist(newList);
      return newList;
    });
  }, [saveWatchlist]);

  const formatPrice = (usdPrice: number) => {
    const val = currency === "TRY" ? usdPrice * usdToTry : usdPrice;
    const symbol = currency === "TRY" ? "₺" : "$";

    // Dynamic decimals based on value
    let decimals = 2;
    if (val < 0.0001) decimals = 8;
    else if (val < 0.01) decimals = 6;
    else if (val < 1) decimals = 4;

    return `${symbol}${val.toLocaleString(currency === "TRY" ? "tr-TR" : "en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  };

  const formatCompact = (val: number) => {
    const value = currency === "TRY" ? val * usdToTry : val;
    const symbol = currency === "TRY" ? "₺" : "$";
    if (value >= 1e9) return `${symbol}${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${symbol}${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${symbol}${(value / 1e3).toFixed(1)}K`;
    return `${symbol}${value.toFixed(0)}`;
  };

  // Limit popular coins for better performance
  const displayCoins = useMemo(() => {
    if (searchQuery.length >= 2) return searchResults;
    return topCoins.slice(0, 50); // Show only top 50, rest available via search
  }, [searchQuery, searchResults, topCoins]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[300px] border border-zinc-900 bg-zinc-950/20 rounded-xl">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500 mb-4" />
        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Veriler Yükleniyor</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">

        <div className="flex items-center gap-3">
          <Dialog onOpenChange={(open) => open && fetchTopCoins()}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="w-4 h-4" />
                Düzenle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Takip Listesini Düzenle</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="relative">
                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <Search className="h-4 w-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                      placeholder="Binlerce coin arasından ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searching && (
                      <InputGroupAddon align="inline-end">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </InputGroupAddon>
                    )}
                  </InputGroup>
                </div>

                <ScrollArea className="h-[325px]">
                  <div className="grid gap-1 pr-3">
                    {(searchQuery.length < 2 && topCoins.length === 0) ? (
                      <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-xs uppercase font-bold tracking-widest">Popülerler Yükleniyor</span>
                      </div>
                    ) : displayCoins.length > 0 ? (
                      displayCoins.map((coin) => (
                        <CoinListItem
                          key={coin.id}
                          coin={coin}
                          isSelected={watchlist.some(s => s.id === coin.id)}
                          onToggle={toggleCoin}
                          disabled={isSaving}
                        />
                      ))
                    ) : (
                      <div className="flex h-32 items-center justify-center text-muted-foreground italic text-sm">
                        Hiçbir sonuç bulunamadı.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-0.5 shadow-lg">
            <Button variant={currency === "USD" ? "default" : "ghost"} size="sm" onClick={() => setCurrency("USD")}> $ USD </Button>
            <Button variant={currency === "TRY" ? "default" : "ghost"} size="sm" onClick={() => setCurrency("TRY")}> ₺ TL </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 overflow-hidden backdrop-blur-sm shadow-2xl">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-900 hover:bg-transparent">
              <TableHead>Varlık</TableHead>
              <TableHead className="text-right">Fiyat</TableHead>
              <TableHead className="text-right">24s Değişim</TableHead>
              <TableHead className="text-right">24s Hacim</TableHead>
              <TableHead className="text-right w-[180px]">Günlük Aralık</TableHead>
              <TableHead className="text-right w-[140px]">Trend (24s)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {watchlist.map((coin) => {
              const stats = prices[coin.symbol];
              const coinHistory = history[coin.symbol] || [];
              const isUp = (stats?.change || 0) >= 0;
              const rangePercent = stats ? Math.min(100, Math.max(0, ((stats.price - stats.low) / (stats.high - stats.low)) * 100)) : 0;

              return (
                <TableRow key={coin.id || coin.symbol} className="group border-zinc-900/50 hover:bg-zinc-900/10 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-zinc-900 bg-zinc-950 overflow-hidden group-hover:scale-105 transition-transform duration-300">
                        <Image src={coin.image} alt={coin.name} width={24} height={24} className="object-contain" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm tracking-tight italic">{coin.symbol}</span>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">{coin.name}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-bold tabular-nums text-sm text-zinc-100">{stats ? formatPrice(stats.price) : "---"}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {stats ? (
                      <div className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full", isUp ? "text-emerald-400 bg-emerald-400/10 shadow-[0_0_15px_-3px_rgba(52,211,153,0.1)]" : "text-red-400 bg-red-400/10 shadow-[0_0_15px_-3px_rgba(248,113,113,0.1)]")}>
                        {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                        {isUp ? "+" : ""}{stats.change.toFixed(2)}%
                      </div>
                    ) : "---"}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm font-bold text-zinc-400 tabular-nums">{stats ? formatCompact(stats.vol) : "---"}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {stats ? (
                      <div className="flex flex-col items-end gap-1.5 min-w-[120px]">
                        <div className="flex justify-between w-full text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">
                          <span>{formatPrice(stats.low)}</span>
                          <span>{formatPrice(stats.high)}</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-900 rounded-full relative overflow-hidden border border-zinc-800/50 shadow-inner">
                          <div className={cn("absolute h-full transition-all duration-700 ease-out", isUp ? "bg-emerald-500/50" : "bg-red-500/50")} style={{ width: `${rangePercent}%` }} />
                          <div className="absolute h-3 w-1 bg-white top-1/2 -translate-y-1/2 shadow-[0_0_8px_white] transition-all" style={{ left: `${rangePercent}%` }} />
                        </div>
                      </div>
                    ) : <div className="h-1.5 w-full bg-zinc-900/50 animate-pulse rounded-full" />}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="h-10 w-full flex justify-end">
                      {coinHistory.length > 0 ? (
                        <Sparkline data={coinHistory} color={isUp ? "#10b981" : "#f43f5e"} className="h-full w-24" />
                      ) : <div className="w-24 h-full bg-zinc-900/10 animate-pulse rounded-lg border border-zinc-900/30" />}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
