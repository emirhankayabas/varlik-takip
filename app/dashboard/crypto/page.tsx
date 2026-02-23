"use client";

import { CryptoMarketWatch } from "@/components/crypto-market-watch";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CryptoPage() {
    return (
        <main className="container mx-auto px-6 py-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-900">
                            <ArrowLeft className="w-5 h-5 text-zinc-400" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Kripto Varlıklar</h1>
                        <p className="text-zinc-500 text-sm mt-1">
                            Küresel kripto para piyasasını ve trendleri canlı takip edin.
                        </p>
                    </div>
                </div>
            </div>

            <div className="animate-in fade-in slide-in-from-top-4 duration-1000">
                <CryptoMarketWatch />
            </div>
        </main>
    );
}
