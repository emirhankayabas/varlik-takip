"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  CalendarIcon,
  Loader2,
  Save,
  ChevronDown,
  TrendingDown,
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
import { cn } from "@/lib/utils";

const sellFormSchema = z.object({
  amount: z.coerce.number().positive("Adet 0'dan büyük olmalıdır."),
  sellPrice: z.coerce.number().positive("Satış fiyatı 0'dan büyük olmalıdır."),
  sellDate: z.date({
    message: "Satış tarihi zorunludur.",
  }),
});

type SellFormValues = z.infer<typeof sellFormSchema>;

interface SellDialogProps {
  assetId: string;
  symbol: string;
  currentAmount: number;
  avgBuyPrice: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SellDialog({
  assetId,
  symbol,
  currentAmount,
  avgBuyPrice,
  open,
  onOpenChange,
  onSuccess,
}: SellDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SellFormValues>({
    resolver: zodResolver(sellFormSchema) as Resolver<SellFormValues>,
    defaultValues: {
      amount: currentAmount,
      sellPrice: 0,
      sellDate: new Date(),
    },
  });

  const onSubmit = async (values: SellFormValues) => {
    if (values.amount > currentAmount) {
      toast.error(
        `Mevcut lot sayısından (${currentAmount}) fazla satış yapamazsınız.`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/assets/${assetId}/sell`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Satış işlemi kaydedilemedi.");
      }

      toast.success(`${symbol} satışı başarıyla kaydedildi.`);
      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Satış kaydedilirken bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mb-2">
            <TrendingDown className="w-6 h-6 text-red-500" />
          </div>
          <DialogTitle>Hisse Satışı: {symbol.replace(".IS", "")}</DialogTitle>
          <DialogDescription>
            Mevcut lot:{" "}
            <span className="text-zinc-300 font-bold">{currentAmount}</span> |
            Maliyet:{" "}
            <span className="text-zinc-300 font-bold">
              ₺{avgBuyPrice.toFixed(2)}
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 mt-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel>Satılacak Lot</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px] text-red-400 font-medium" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sellPrice"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel>Satış Fiyatı (₺)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px] text-red-400 font-medium" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="sellDate"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel>Satış Tarihi</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          data-empty={!field.value}
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
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
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
                variant="destructive"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                Satışı Kaydet
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
