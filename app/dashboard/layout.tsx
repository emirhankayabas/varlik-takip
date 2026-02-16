"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Wallet, User as UserIcon, ChevronDown, History, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session } = useSession();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white/20 font-sans">
            {/* Header */}
            <header className="border-b border-zinc-900 sticky top-0 z-50 bg-black/50 backdrop-blur-xl">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between max-w-6xl">
                    <Link href="/dashboard" className="flex items-center gap-3 group transition-transform hover:scale-[1.02]">
                        <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800 shadow-xl group-hover:border-zinc-700">
                            <Wallet className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-lg font-semibold tracking-tight">
                            Varlık Takip
                        </h1>
                    </Link>

                    <div className="flex items-center gap-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="px-2 hover:bg-zinc-900 transition-colors">
                                    <div className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                                        <UserIcon className="h-4 w-4" />
                                    </div>
                                    <div className="hidden md:flex flex-col items-start leading-none gap-1 ml-2">
                                        <span className="text-xs font-semibold tracking-tight">
                                            {session?.user?.name || "Kullanıcı"}
                                        </span>
                                    </div>
                                    <ChevronDown className="h-3 w-3 text-zinc-500 ml-1" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-zinc-950 border-zinc-900 shadow-2xl rounded-2xl p-2" align="end">
                                <DropdownMenuLabel className="px-3 py-3">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-bold leading-none tracking-tight">
                                            {session?.user?.name || "Kullanıcı"}
                                        </p>
                                        <p className="text-[10px] leading-none text-zinc-500 font-medium overflow-hidden text-ellipsis">
                                            {session?.user?.email || "E-posta bulunamadı"}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-zinc-900" />
                                <Link href="/dashboard/sales">
                                    <DropdownMenuItem className="cursor-pointer py-2 px-3 rounded-xl focus:bg-zinc-900 focus:text-white group">
                                        <History className="h-4 w-4 mr-2 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                                        <span>Gerçekleşen Karlar</span>
                                    </DropdownMenuItem>
                                </Link>
                                <DropdownMenuSeparator className="bg-zinc-900" />
                                <DropdownMenuItem
                                    className="cursor-pointer py-2 px-3 rounded-xl focus:bg-red-400/10 focus:text-red-400 text-zinc-400"
                                    onClick={() => signOut({ callbackUrl: "/login" })}
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    <span>Güvenli Çıkış</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            {children}
        </div>
    );
}
