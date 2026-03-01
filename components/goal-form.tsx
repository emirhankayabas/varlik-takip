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
    Target,
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
import { cn } from "@/lib/utils";

const formSchema = z.object({
    title: z.string().min(1, "Hedef başlığı zorunludur."),
    targetAmount: z.coerce.number().positive("Hedef tutarı 0'dan büyük olmalıdır."),
    targetDate: z.date().optional(),
    includedAssetTypes: z.array(z.string()).min(1, "En az bir varlık tipi seçilmelidir."),
});

interface GoalFormValues {
    title: string;
    targetAmount: number;
    targetDate?: Date;
    includedAssetTypes: string[];
}

interface GoalFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: any;
}

export function GoalForm({ open, onOpenChange, onSuccess, initialData }: GoalFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<GoalFormValues>({
        resolver: zodResolver(formSchema) as Resolver<GoalFormValues>,
        defaultValues: {
            title: "",
            targetAmount: 0,
            targetDate: undefined,
            includedAssetTypes: ["BIST", "US", "FUND"],
        },
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    title: initialData.title,
                    targetAmount: initialData.targetAmount,
                    targetDate: initialData.targetDate ? new Date(initialData.targetDate) : undefined,
                    includedAssetTypes: initialData.includedAssetTypes || ["BIST", "US", "FUND"],
                });
            } else {
                form.reset({
                    title: "",
                    targetAmount: 0,
                    targetDate: undefined,
                    includedAssetTypes: ["BIST", "US", "FUND"],
                });
            }
        }
    }, [open, initialData, form]);

    const onSubmit = async (values: GoalFormValues) => {
        setIsSubmitting(true);
        try {
            const url = initialData ? `/api/goals/${initialData._id}` : "/api/goals";
            const method = initialData ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            if (!response.ok) throw new Error("İşlem kaydedilemedi.");

            toast.success(initialData ? "Hedef güncellendi." : "Hedef başarıyla oluşturuldu.");
            form.reset();
            onOpenChange(false);
            onSuccess();
        } catch (error) {
            toast.error("İşlem sırasında bir hata oluştu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{initialData ? "Hedefi Düzenle" : "Yeni Hedef Oluştur"}</DialogTitle>
                    <DialogDescription>
                        Kendinize yeni bir birikim hedefi belirleyin ve ilerlemenizi takip edin.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6 mt-4"
                    >
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel>Hedef Başlığı</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Örn: Yeni Araba Peşinatı" {...field} />
                                    </FormControl>
                                    <FormMessage className="text-[10px] text-red-400 font-medium" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="targetAmount"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel>Hedeflenen Tutar (₺)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            placeholder="0"
                                            value={field.value === 0 ? "" : field.value.toLocaleString("tr-TR")}
                                            onChange={(e) => {
                                                const rawValue = e.target.value.replace(/\D/g, "");
                                                const numValue = rawValue ? parseInt(rawValue, 10) : 0;
                                                field.onChange(numValue);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px] text-red-400 font-medium" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="targetDate"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel>Hedef Tarihi (Opsiyonel)</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {field.value ? (
                                                        format(field.value, "PPP", { locale: tr })
                                                    ) : (
                                                        <span>Tarih seçin</span>
                                                    )}
                                                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    date < new Date()
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage className="text-[10px] text-red-400 font-medium" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="includedAssetTypes"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>Hesaplanacak Varlıklar</FormLabel>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { id: "BIST", label: "BIST (TR)" },
                                            { id: "US", label: "NASDAQ/NYSE (US)" },
                                            { id: "FUND", label: "Yatırım Fonları" },
                                        ].map((type) => {
                                            const isSelected = field.value?.includes(type.id);
                                            return (
                                                <Button
                                                    key={type.id}
                                                    type="button"
                                                    variant={isSelected ? "default" : "outline"}
                                                    size="sm"
                                                    className="text-xs shrink-0"
                                                    onClick={() => {
                                                        const current = field.value || [];
                                                        const next = current.includes(type.id)
                                                            ? current.filter((t) => t !== type.id)
                                                            : [...current, type.id];
                                                        field.onChange(next);
                                                    }}
                                                >
                                                    {type.label}
                                                </Button>
                                            );
                                        })}
                                    </div>
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
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Kaydediliyor...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        {initialData ? "Güncelle" : "Hedefi Kaydet"}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
