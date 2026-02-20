"use client";

import { useState } from "react";
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
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Trash2, Edit, CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface Ipo {
    _id: string;
    symbol: string;
    requestedAmount: number;
    allocatedAmount?: number;
    price: number;
    requestDate: Date;
    listingDate?: Date;
    status: "PENDING" | "ALLOCATED" | "PORTFOLIO";
    updatedAt: string | Date;
    bankId: {
        _id: string;
        name: string;
    };
}

interface IpoListProps {
    offerings: Ipo[];
    onRefresh: () => void;
}

export function IpoList({ offerings, onRefresh }: IpoListProps) {
    const [selectedIpo, setSelectedIpo] = useState<Ipo | null>(null);
    const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
    const [allocatedAmount, setAllocatedAmount] = useState<number>(0);
    const [listingDate, setListingDate] = useState<Date | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleDelete = async (id: string) => {
        if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;

        try {
            const res = await fetch(`/api/public-offerings/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            toast.success("Kayıt silindi.");
            onRefresh();
        } catch (e) {
            toast.error("Silme işlemi başarısız.");
        }
    };

    const handleOpenResultDialog = (ipo: Ipo) => {
        setSelectedIpo(ipo);
        setAllocatedAmount(ipo.allocatedAmount || ipo.requestedAmount);
        setListingDate(ipo.listingDate ? new Date(ipo.listingDate) : undefined);
        setIsResultDialogOpen(true);
    };

    const saveResults = async () => {
        if (!selectedIpo) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/public-offerings/${selectedIpo._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    allocatedAmount,
                    listingDate,
                    status: "ALLOCATED"
                }),
            });
            if (!res.ok) throw new Error();
            toast.success("Sonuçlar kaydedildi.");
            setIsResultDialogOpen(false);
            onRefresh();
        } catch (e) {
            toast.error("Hata oluştu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (offerings.length === 0) {
        return (
            <div className="text-center py-20 bg-zinc-950/20 rounded-3xl border border-zinc-900 border-dashed">
                <p className="text-zinc-500 text-sm">Henüz halka arz talebi girmediniz.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 overflow-hidden backdrop-blur-sm shadow-2xl animate-in fade-in slide-in-from-top-4 duration-1000">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Hisse</TableHead>
                            <TableHead>Kurum</TableHead>
                            <TableHead className="text-right">Talep / Dağıtım</TableHead>
                            <TableHead className="text-right">Fiyat</TableHead>
                            <TableHead className="text-right">Toplam Tutar</TableHead>
                            <TableHead className="text-right">İade Edilecek</TableHead>
                            <TableHead className="text-center">Durum</TableHead>
                            <TableHead className="text-right"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {offerings.map((ipo) => {
                            const totalInvestment = ipo.requestedAmount * ipo.price;
                            const refund = ipo.status !== "PENDING"
                                ? (ipo.requestedAmount - (ipo.allocatedAmount || 0)) * ipo.price
                                : 0;

                            const diffDays = ipo.status === "ALLOCATED" && !ipo.listingDate
                                ? Math.floor((new Date().getTime() - new Date(ipo.updatedAt).getTime()) / (1000 * 3600 * 24))
                                : 0;

                            return (
                                <TableRow key={ipo._id} className="group">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm tracking-tight">{ipo.symbol.replace(".IS", "")}</span>
                                            <span className="text-[10px] text-zinc-500 font-medium">Halka Arz Talebi</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {ipo.bankId?.name || "Bilinmiyor"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col items-end leading-tight">
                                            <span className="text-sm font-medium">{ipo.requestedAmount} Lot</span>
                                            {ipo.status !== "PENDING" && (
                                                <span className="text-[10px] text-zinc-500 font-bold">Gelen: {ipo.allocatedAmount} Lot</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="text-sm">₺{ipo.price.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="text-sm font-medium">₺{totalInvestment.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {refund > 0 ? (
                                            <span className="text-sm font-bold text-emerald-400">₺{refund.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        ) : (
                                            <span className="text-sm text-zinc-700">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <Badge variant={
                                                ipo.status === "PENDING" ? "outline" :
                                                    ipo.status === "ALLOCATED" ? "secondary" : "default"
                                            } className="text-[9px] px-1.5 py-0">
                                                {ipo.status === "PENDING" ? "TALEP EDİLDİ" :
                                                    ipo.status === "ALLOCATED" ? "SONUÇLANDI" : "PORTFÖYDE"}
                                            </Badge>
                                            {diffDays >= 3 && (
                                                <span className="text-[9px] text-amber-400 flex items-center gap-1 animate-pulse">
                                                    <AlertCircle className="w-2.5 h-2.5" /> İşlem başladı mı?
                                                </span>
                                            )}
                                            {ipo.listingDate && ipo.status === "ALLOCATED" && (
                                                <span className="text-[9px] text-zinc-500">
                                                    Açılış: {format(new Date(ipo.listingDate), "d MMM", { locale: tr })}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {ipo.status !== "PORTFOLIO" && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-full text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
                                                    onClick={() => handleOpenResultDialog(ipo)}
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-full text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                                                onClick={() => handleDelete(ipo._id)}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Halka Arz Sonucu</DialogTitle>
                        <DialogDescription>
                            {selectedIpo?.symbol} için dağıtım sonuçlarını girin.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="allocated">Gelen Lot Sayısı</Label>
                            <Input
                                id="allocated"
                                type="number"
                                value={allocatedAmount}
                                onChange={(e) => setAllocatedAmount(Number(e.target.value))}
                            />
                            <p className="text-[10px] text-zinc-500">
                                Talep ettiğiniz: {selectedIpo?.requestedAmount} Lot.
                                İade edilecek tutar: ₺{(((selectedIpo?.requestedAmount || 0) - allocatedAmount) * (selectedIpo?.price || 0)).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <Label>İşlem Görme Tarihi (Opsiyonel)</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !listingDate && "text-muted-foreground"
                                        )}
                                    >
                                        <Calendar className="mr-2 h-4 w-4" />
                                        {listingDate ? format(listingDate, "PPP", { locale: tr }) : <span>Tarih seçin</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-zinc-950 border-zinc-800" align="start">
                                    <CalendarComponent
                                        mode="single"
                                        selected={listingDate}
                                        onSelect={setListingDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <p className="text-[10px] text-zinc-500">
                                Bu tarih geldiğinde hisseleriniz otomatik olarak portföye aktarılacaktır.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button disabled={isSubmitting} onClick={saveResults} className="w-full">
                            {isSubmitting ? "Kaydediliyor..." : "Sonuçları Kaydet"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
