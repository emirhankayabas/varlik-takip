"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

export function VerificationBanner() {
    const { data: session } = useSession();

    if (!session?.user || (session.user as any).emailVerified) {
        return null;
    }

    return (
        <div className="bg-[#2a1314] border-b border-[#ff6166]/20 px-4 py-2 animate-in slide-in-from-top duration-300 sticky top-[65px] z-50">
            <div className="container mx-auto px-6 py-1 flex md:items-center flex-col md:flex-row gap-y-1 justify-center gap-x-4">
                <div className="flex items-center gap-2 text-[#ff6166]">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <p className="text-xs font-medium mt-0.5">
                        Hesabınız henüz doğrulanmadı.
                    </p>
                </div>
                <Link
                    href={`/verify-email?email=${encodeURIComponent(session.user.email || "")}&resend=true`}
                    className="flex items-center gap-1 text-xs font-bold text-white/80 hover:text-white transition-colors whitespace-nowrap"
                >
                    Şimdi Doğrula
                    <ArrowRight className="h-3 w-3" />
                </Link>
            </div>
        </div>
    );
}
