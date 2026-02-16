"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
    CalendarIcon,
    Loader2,
    Settings2,
    Save,
    ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { BankManager } from "./bank-manager";

const formSchema = z.object({
    symbol: z.string().min(1, "Hisse sembolü zorunludur."),
    requestedAmount: z.coerce.number().positive("Talep edilen adet 0'dan büyük olmalıdır."),
    price: z.coerce.number().positive("Fiyat 0'dan büyük olmalıdır."),
    bankId: z.string().min(1, "Banka seçimi zorunludur."),
    requestDate: z.date({
        message: "Talep tarihi zorunludur.",
    }),
});

interface IpoFormValues {
    symbol: string;
    requestedAmount: number;
    price: number;
    bankId: string;
    requestDate: Date;
}

interface IpoFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

interface Bank {
    _id: string;
    name: string;
}

export function IpoForm({ open, onOpenChange, onSuccess }: IpoFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [banks, setBanks] = useState<Bank[]>([]);
    const [isBankManagerOpen, setIsBankManagerOpen] = useState(false);

    useEffect(() => {
        if (open) fetchBanks();
    }, [open]);

    const fetchBanks = async () => {
        try {
            const response = await fetch("/api/banks");
            const data = await response.json();
            setBanks(data);
        } catch (error) {
            console.error("Bankalar yüklenemedi");
        }
    };

    const form = useForm<IpoFormValues>({
        resolver: zodResolver(formSchema) as Resolver<IpoFormValues>,
        defaultValues: {
            symbol: "",
            requestedAmount: 0,
            price: 0,
            bankId: "",
            requestDate: new Date(),
        },
    });

    const onSubmit = async (values: IpoFormValues) => {
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/public-offerings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            if (!response.ok) throw new Error("Halka arz kaydedilemedi.");

            toast.success("Halka arz talebi başarıyla eklendi.");
            form.reset();
            onOpenChange(false);
            onSuccess();
        } catch (error) {
            toast.error("Halka arz eklenirken bir hata oluştu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Halka Arz Talebi</DialogTitle>
                        <DialogDescription>
                            Talep ettiğiniz halka arz detaylarını girin.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-6 mt-4"
                        >
                            <FormField
                                control={form.control}
                                name="symbol"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel>Sembol</FormLabel>
                                        <FormControl>
                                            <Input placeholder="EBEBK" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-[10px] text-red-400 font-medium" />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="requestedAmount"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel>Talep Edilen Lot</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="any" {...field} />
                                            </FormControl>
                                            <FormMessage className="text-[10px] text-red-400 font-medium" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel>Arz Fiyatı (₺)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="any" {...field} />
                                            </FormControl>
                                            <FormMessage className="text-[10px] text-red-400 font-medium" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="bankId"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <div className="flex items-center justify-between mb-0.5 ml-1">
                                            <FormLabel>Aracı Kurum</FormLabel>
                                            <Button
                                                type="button"
                                                variant="link"
                                                onClick={() => setIsBankManagerOpen(true)}
                                            >
                                                <Settings2 className="w-3 h-3" />
                                                Yönet
                                            </Button>
                                        </div>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Kurum seçin" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {banks.length === 0 ? (
                                                    <p className="text-[10px] text-center p-4 text-zinc-500 ">
                                                        Banka tanımlamadınız.
                                                    </p>
                                                ) : (
                                                    banks.map((bank) => (
                                                        <SelectItem
                                                            className="py-2 px-2"
                                                            key={bank._id}
                                                            value={bank._id}
                                                        >
                                                            {bank.name}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage className="text-[10px] text-red-400 font-medium" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="requestDate"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel>Talep Tarihi</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full justify-start",
                                                            !field.value && "text-zinc-500",
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP", { locale: tr })
                                                        ) : (
                                                            <span>Tarih seçin</span>
                                                        )}
                                                        <ChevronDown className="h-4 w-4 text-zinc-600" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto p-0 bg-zinc-950 border-zinc-800 shadow-2xl rounded-2xl"
                                                align="start"
                                            >
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage className="text-[10px] text-red-400 font-medium" />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin text-black" />
                                            Kaydediliyor...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Talebi Kaydet
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <BankManager
                open={isBankManagerOpen}
                onOpenChange={(val) => {
                    setIsBankManagerOpen(val);
                    if (!val) fetchBanks();
                }}
            />
        </>
    );
}
