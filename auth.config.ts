import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
            const isOnLogin = nextUrl.pathname.startsWith("/login");
            const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");

            if (isApiAuthRoute) return true;

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect to login
            } else if (isOnLogin) {
                if (isLoggedIn) {
                    return Response.redirect(new URL("/dashboard", nextUrl));
                }
                return true;
            }

            if (nextUrl.pathname === "/") {
                return true;
            }

            return true;
        },
    },
    providers: [], // Providers are added in auth.ts
} satisfies NextAuthConfig;
