import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                await dbConnect();
                const user = await User.findOne({ email: credentials.email });

                if (!user) return null;

                const isPasswordCorrect = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (!isPasswordCorrect) return null;

                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    emailVerified: user.emailVerified,
                };
            },
        }),
    ],
    callbacks: {
        ...authConfig.callbacks,
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.emailVerified = (user as any).emailVerified;
            }
            if (trigger === "update" && session?.emailVerified !== undefined) {
                token.emailVerified = session.emailVerified;
            }
            return token;
        },
        async session({ session, token }) {
            if (token.id && session.user) {
                session.user.id = token.id as string;
                (session.user as any).emailVerified = token.emailVerified;
            }
            return session;
        },
    },
});
