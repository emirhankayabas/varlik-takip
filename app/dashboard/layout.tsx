import React from "react";
import { VerificationBanner } from "@/components/VerificationBanner";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="bg-black text-white selection:bg-white/20 font-sans">
            <VerificationBanner />
            <main>
                {children}
            </main>
        </div>
    );
}

