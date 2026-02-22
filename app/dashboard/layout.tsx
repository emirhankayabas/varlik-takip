"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Wallet, User as UserIcon, ChevronDown, History, LogOut, Coins, Bell, LayoutDashboard } from "lucide-react";
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
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session } = useSession();
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const navLinks = [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/dashboard/sales", label: "Satışlarım", icon: History },
        { href: "/dashboard/crypto", label: "Kripto", icon: Coins },
    ];

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white/20 font-sans">
            {/* Premium Header */}
            <header className="border-b border-zinc-900/50 sticky top-0 z-50 bg-black/60 backdrop-blur-md">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    {/* Logo Area */}
                    <Link href="/dashboard" className="flex items-center gap-3.5 group">
                        <div className="bg-gradient-to-br from-zinc-800 to-black p-2 rounded-xl border border-zinc-800/50 shadow-2xl group-hover:border-zinc-700 transition-all duration-300">
                            <Wallet className="w-5 h-5 text-zinc-100" />
                        </div>
                        <div className="flex flex-col gap-0">
                            <h1 className="text-sm font-bold tracking-tight text-zinc-100">
                                Varlık Takip
                            </h1>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">
                                Pro Panel
                            </span>
                        </div>
                    </Link>

                    {/* Navigation Menu */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "relative flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all duration-300 rounded-full group",
                                        isActive
                                            ? "text-white bg-zinc-900/50"
                                            : "text-zinc-500 hover:text-zinc-200"
                                    )}
                                >
                                    <Icon className={cn(
                                        "w-4 h-4 transition-transform group-hover:scale-110",
                                        isActive ? "text-zinc-100" : "text-zinc-500"
                                    )} />
                                    <span>{link.label}</span>
                                    {isActive && (
                                        <div className="absolute -bottom-4 left-4 right-4 h-0.5 bg-white/10 rounded-full blur-[1px]" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Action Area */}
                    <div className="flex items-center gap-3">
                        {/* Notifications (Visual only) */}
                        <Button variant="ghost" size="icon" className="hidden sm:flex text-zinc-500 hover:text-zinc-100 hover:bg-zinc-900/50 rounded-full">
                            <Bell className="w-4 h-4" />
                        </Button>

                        <div className="h-6 w-[1px] bg-zinc-900 hidden sm:block mx-1" />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="pl-1 pr-2 py-1.5 hover:bg-zinc-900/50 border border-transparent hover:border-zinc-800/50 rounded-full transition-all duration-300 group">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-100 shadow-inner group-hover:scale-105 transition-transform duration-300">
                                        <UserIcon className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="hidden lg:flex flex-col items-start leading-none gap-1 ml-2.5">
                                        <span className="text-[12px] font-bold text-zinc-200 tracking-tight">
                                            {session?.user?.name || "Kullanıcı"}
                                        </span>
                                        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-tighter">
                                            Hesap Ayarları
                                        </span>
                                    </div>
                                    <ChevronDown className="h-3 w-3 text-zinc-500 ml-2 group-hover:translate-y-0.5 transition-transform" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64 bg-[#09090b] border-zinc-900/80 shadow-2xl rounded-2xl p-2 mt-2" align="end">
                                <DropdownMenuLabel>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                                            <UserIcon className="h-5 h-5" />
                                        </div>
                                        <div className="flex flex-col space-y-0.5">
                                            <p className="text-sm font-bold leading-none tracking-tight text-white">
                                                {session?.user?.name || "Kullanıcı"}
                                            </p>
                                            <p className="text-[10px] leading-none text-zinc-500 font-medium overflow-hidden text-ellipsis">
                                                {session?.user?.email || "E-posta bulunamadı"}
                                            </p>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                <div className="md:hidden">
                                    {navLinks.map((link) => (
                                        <Link key={link.href} href={link.href}>
                                            <DropdownMenuItem>
                                                <link.icon className="h-4 w-4 mr-2 text-zinc-500 group-hover:text-zinc-100 transition-colors" />
                                                <span>{link.label}</span>
                                            </DropdownMenuItem>
                                        </Link>
                                    ))}
                                    <DropdownMenuSeparator className="bg-zinc-900/50 mx-2" />
                                </div>

                                <DropdownMenuItem
                                    className="cursor-pointer py-3 px-3"
                                    onClick={() => signOut({ callbackUrl: "/login" })}
                                >
                                    <LogOut className="h-4 w-4 mr-3" />
                                    <span className="font-semibold text-sm">Oturumu Kapat</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            <main>
                {children}
            </main>
        </div>
    );
}
