"use client";

import { useSession, signOut } from "next-auth/react";
import {
    Wallet,
    User as UserIcon,
    ChevronDown,
    History,
    LogOut,
    Coins,
    LayoutDashboard,
    Menu,
    TrendingUp,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function Header() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        setMounted(true);

        const handleUpdate = (e: any) => {
            if (e.detail?.date) {
                setLastUpdated(e.detail.date);
                setIsRefreshing(false);
            }
        };

        window.addEventListener("portfolio-updated", handleUpdate);
        return () => window.removeEventListener("portfolio-updated", handleUpdate);
    }, []);

    const handleRefreshRequest = () => {
        setIsRefreshing(true);
        window.dispatchEvent(new CustomEvent("portfolio-refresh-request"));
    };

    // Only show header on dashboard pages
    if (!pathname.startsWith("/dashboard")) return null;
    if (!mounted) return null;

    const navLinks = [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/dashboard/sales", label: "Satışlarım", icon: History },
        { href: "/dashboard/crypto", label: "Kripto", icon: Coins },
    ];

    return (
        <header className="border-b border-zinc-900/50 sticky top-0 z-50 bg-black/60 backdrop-blur-md">
            <div className="container mx-auto px-6 h-16 flex items-center">
                {/* Left Area (Logo + Mobile Trigger) */}
                <div className="flex-1 flex items-center gap-4">
                    {/* Mobile Menu Trigger */}
                    <div className="md:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-zinc-500 hover:text-zinc-100 hover:bg-zinc-900/50 rounded-full"
                                >
                                    <Menu className="w-5 h-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent
                                side="left"
                                className="w-80 border-r border-zinc-900 bg-black/95 backdrop-blur-xl p-0"
                            >
                                <SheetHeader className="sr-only">
                                    <SheetTitle>Navigasyon Menüsü</SheetTitle>
                                </SheetHeader>
                                <div className="flex flex-col h-full">
                                    <div className="p-6 border-b border-zinc-900/50">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-linear-to-br from-zinc-800 to-black p-2 rounded-xl border border-zinc-800/50">
                                                <Wallet className="w-5 h-5 text-zinc-100" />
                                            </div>
                                            <div className="flex flex-col">
                                                <h1 className="text-sm font-bold tracking-tight text-zinc-100">
                                                    Varlık Takip
                                                </h1>
                                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">
                                                    Pro Panel
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <nav className="flex-1 p-4 space-y-2 mt-4">
                                        {navLinks.map((link) => {
                                            const isActive = pathname === link.href;
                                            const Icon = link.icon;
                                            return (
                                                <Link
                                                    key={link.href}
                                                    href={link.href}
                                                    className={cn(
                                                        "flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all duration-300 rounded-xl group",
                                                        isActive
                                                            ? "text-white bg-zinc-900"
                                                            : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/30",
                                                    )}
                                                >
                                                    <Icon
                                                        className={cn(
                                                            "w-4 h-4",
                                                            isActive ? "text-zinc-100" : "text-zinc-500",
                                                        )}
                                                    />
                                                    <span>{link.label}</span>
                                                </Link>
                                            );
                                        })}
                                        <div className="pt-2">
                                            <Link
                                                href="/dashboard/profile"
                                                className={cn(
                                                    "flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all duration-300 rounded-xl group",
                                                    pathname === "/dashboard/profile"
                                                        ? "text-white bg-zinc-900"
                                                        : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/30",
                                                )}
                                            >
                                                <UserIcon
                                                    className={cn(
                                                        "w-4 h-4",
                                                        pathname === "/dashboard/profile"
                                                            ? "text-zinc-100"
                                                            : "text-zinc-500",
                                                    )}
                                                />
                                                <span>Profilim</span>
                                            </Link>
                                        </div>
                                    </nav>
                                    <div className="p-6 border-t border-zinc-900/50 mt-auto">
                                        <div className="flex items-center gap-3 px-2">
                                            <div className="h-9 w-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                                                <UserIcon className="h-4 w-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <p className="text-sm font-bold leading-none text-white">
                                                    {session?.user?.name || "Kullanıcı"}
                                                </p>
                                                <p className="text-[10px] text-zinc-500 font-medium truncate max-w-37.5">
                                                    {session?.user?.email}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* Logo Area */}
                    <Link href="/dashboard" className="flex items-center gap-3.5 group">
                        <div className="bg-linear-to-br from-zinc-800 to-black p-2 rounded-xl border border-zinc-800/50 shadow-2xl group-hover:border-zinc-700 transition-all duration-300">
                            <Wallet className="w-5 h-5 text-zinc-100" />
                        </div>
                        <div className="flex flex-col gap-0">
                            <h1 className="text-sm font-bold tracking-tight text-zinc-100 uppercase">
                                Varlık Takip
                            </h1>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">
                                Pro Panel
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Center: Navigation Menu (Desktop) */}
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
                                        ? "text-white bg-white/15"
                                        : "text-zinc-500 hover:text-zinc-200",
                                )}
                            >
                                <Icon
                                    className={cn(
                                        "w-4 h-4 transition-transform group-hover:scale-110",
                                        isActive ? "text-zinc-100" : "text-zinc-500",
                                    )}
                                />
                                <span>{link.label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="active-nav"
                                        className="absolute -bottom-4 left-4 right-4 h-0.5 bg-white origin-left"
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Right: User Action Area */}
                <div className="flex-1 flex items-center justify-end gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 bg-zinc-900/40 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-zinc-800/50 backdrop-blur-sm transition-all hover:border-zinc-700/50">
                        {lastUpdated && (
                            <div className="hidden sm:flex flex-col items-end pr-1 scale-90 origin-right">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider leading-none">Senkronize</span>
                                <span className="text-[12px] text-zinc-300 font-mono tracking-tighter leading-tight mt-0.5">{lastUpdated}</span>
                            </div>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleRefreshRequest}
                            disabled={isRefreshing}
                            className="h-7 w-7 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                        >
                            {isRefreshing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <TrendingUp className="w-3.5 h-3.5" />
                            )}
                        </Button>
                    </div>

                    <div className="h-6 w-px bg-zinc-900 hidden sm:block mx-1" />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="pl-1 pr-2 py-1.5 hover:bg-zinc-900/50 border border-transparent hover:border-zinc-800/50 rounded-full transition-all duration-300 group"
                            >
                                <div className="h-8 w-8 rounded-full bg-linear-to-br from-zinc-800 to-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-100 shadow-inner group-hover:scale-105 transition-transform duration-300">
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
                        <DropdownMenuContent
                            className="w-64 bg-[#09090b] border-zinc-900/80 shadow-2xl rounded-2xl p-2 mt-2"
                            align="end"
                        >
                            <DropdownMenuLabel>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                                        <UserIcon className="h-5 w-5 font-bold" />
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
                            <DropdownMenuSeparator className="bg-zinc-900" />
                            <Link href="/dashboard/profile">
                                <DropdownMenuItem className="cursor-pointer py-3 px-3 text-zinc-400 hover:text-white">
                                    <UserIcon className="h-4 w-4 mr-3" />
                                    <span className="font-semibold text-sm">Profilim</span>
                                </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator className="bg-zinc-900" />
                            <DropdownMenuItem
                                className="cursor-pointer py-3 px-3 text-zinc-400 hover:text-white"
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
    );
}
