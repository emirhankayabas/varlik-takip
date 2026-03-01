"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Target,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  EyeOff,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GoalForm } from "./goal-form";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface GoalProgressProps {
  totals: {
    BIST: number;
    US: number;
    FUND: number;
  };
  usdRate?: number;
  onHide?: () => void;
}

export function GoalProgress({
  totals,
  usdRate = 1,
  onHide,
}: GoalProgressProps) {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any | null>(null);

  const fetchGoals = async () => {
    try {
      const res = await fetch("/api/goals");
      const data = await res.json();
      setGoals(data);
    } catch (error) {
      console.error("Hedefler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Bu hedefi silmek istediğinize emin misiniz?")) return;

    try {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Hedef silindi.");
        fetchGoals();
      }
    } catch (error) {
      toast.error("Hedef silinirken bir hata oluştu.");
    }
  };

  const handleEdit = (goal: any) => {
    setEditingGoal(goal);
    setIsFormOpen(true);
  };

  if (loading) return null;

  if (goals.length === 0) {
    return (
      <>
        <Card className="mb-8">
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-800/50 flex items-center justify-center">
                <Target className="w-4 h-4 text-zinc-500" />
              </div>
              <p className="text-zinc-400 text-sm">
                Henüz bir birikim hedefi belirlemediniz.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFormOpen(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Hedef Oluştur
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
                onClick={onHide}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        <GoalForm
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setEditingGoal(null);
          }}
          onSuccess={fetchGoals}
        />
      </>
    );
  }

  // Sadece ilk hedefi gösterelim
  const mainGoal = goals[0];
  if (!mainGoal) return null;

  const targetAmount = Number(mainGoal.targetAmount) || 1; // 0'a bölmeyi önleyelim
  const includedTypes = mainGoal.includedAssetTypes || ["BIST", "US", "FUND"];

  // Seçili varlıkların toplam değerini hesapla
  let currentTotalValue = 0;
  if (includedTypes.includes("BIST")) currentTotalValue += totals.BIST || 0;
  if (includedTypes.includes("US"))
    currentTotalValue += (totals.US || 0) * (usdRate || 1);
  if (includedTypes.includes("FUND")) currentTotalValue += totals.FUND || 0;

  const progress = Math.min((currentTotalValue / targetAmount) * 100, 100);
  const remaining = Math.max(targetAmount - currentTotalValue, 0);
  const isAchieved = currentTotalValue >= targetAmount;

  return (
    <div className="mb-10">
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Custom Styled Container (No Shadcn Card to avoid class violations) */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-900/40 backdrop-blur-md px-5 py-4">
            {/* Subtle Premium Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-[60px] -z-10 pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "p-2.5 rounded-xl shrink-0",
                    isAchieved
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-zinc-800/50 text-zinc-400",
                  )}
                >
                  {isAchieved ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Target className="w-4 h-4" />
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-white tracking-tight truncate">
                    {mainGoal.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">
                      %{progress.toFixed(1)}
                    </span>
                    <span className="text-xs text-zinc-600 font-medium uppercase tracking-widest leading-none">
                      •
                    </span>
                    <span className="text-xs text-zinc-400 font-medium">
                      {isAchieved ? (
                        <span className="text-emerald-400 font-bold tracking-tight">
                          Hedefe Ulaşıldı! ✨
                        </span>
                      ) : (
                        <span>
                          Kalan:{" "}
                          <span className="text-white font-semibold">
                            ₺
                            {remaining.toLocaleString("tr-TR", {
                              minimumFractionDigits: 0,
                            })}
                          </span>
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center flex-1 sm:max-w-md gap-4">
                <div className="flex-1">
                  <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest mb-1 block">
                    İlerleme
                  </span>
                  <div className="relative h-1.5 w-full bg-zinc-800/30 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                      className={cn(
                        "absolute top-0 left-0 h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.05)]",
                        isAchieved
                          ? "bg-emerald-500 shadow-emerald-500/20"
                          : "bg-white",
                      )}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <div className="text-right mr-3 hidden lg:block">
                    <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">
                      Hedef Tutar
                    </p>
                    <p className="text-sm font-bold text-white whitespace-nowrap mt-1">
                      ₺{mainGoal.targetAmount.toLocaleString("tr-TR")}
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-zinc-800/50"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-64">
                      <DropdownMenuItem onClick={() => handleEdit(mainGoal)}>
                        <Edit2 className="w-4 h-4 mr-2" /> Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(mainGoal._id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Sil
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsFormOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Yeni Hedef
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onHide}>
                        <EyeOff className="w-4 h-4 mr-2" /> Hedefleri Gizle
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <GoalForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingGoal(null);
          }
        }}
        initialData={editingGoal}
        onSuccess={fetchGoals}
      />
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
