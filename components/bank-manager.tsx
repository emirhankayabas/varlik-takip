"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Landmark, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Bank {
  _id: string;
  name: string;
}

export function BankManager({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBankName, setNewBankName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (open) fetchBanks();
  }, [open]);

  const fetchBanks = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/banks");
      const data = await response.json();
      setBanks(data);
    } catch (error) {
      toast.error("Bankalar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newBankName.trim()) return;
    setIsAdding(true);
    try {
      const response = await fetch("/api/banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBankName }),
      });
      if (!response.ok) throw new Error();
      setNewBankName("");
      fetchBanks();
      toast.success("Banka başarıyla eklendi.");
    } catch (error) {
      toast.error("Banka eklenemedi.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/banks/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      fetchBanks();
      toast.success("Banka silindi.");
    } catch (error) {
      toast.error("Banka silinemedi.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kurum Yönetimi</DialogTitle>
          <DialogDescription>
            İşlemleriniz için modelinize uygun aracı kurumlar/bankalar
            tanımlayın.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="relative group flex items-center gap-3">
            <Input
              placeholder="Yeni kurum adı (Örn: Ziraat Yatırım)"
              value={newBankName}
              onChange={(e) => setNewBankName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button onClick={handleAdd} disabled={isAdding} size="icon">
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="max-h-75 overflow-y-auto space-y-2.5">
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-700" />
              </div>
            ) : banks.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/10">
                <Landmark className="w-6 h-6 text-zinc-800 mx-auto mb-3" />
                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">
                  Kayıtlı Kurum Bulunamadı
                </p>
              </div>
            ) : (
              banks.map((bank) => (
                <div
                  key={bank._id}
                  className="flex items-center justify-between p-1.5 rounded-xl bg-zinc-900/50 border border-zinc-900 hover:border-zinc-800 transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-zinc-800 text-zinc-400 group-hover:text-white transition-colors">
                      <Landmark className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold tracking-tight">
                      {bank.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(bank._id)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
