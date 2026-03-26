// ไฟล์: app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import LineProvider from "next-auth/providers/line";
import { createClient } from "@supabase/supabase-js";

// ใช้ Service Role เพื่อข้าม RLS ในการตรวจสอบ line_user_id
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

const supabaseAdmin =
  supabaseUrl && supabaseServiceRole
    ? createClient(supabaseUrl, supabaseServiceRole)
    : null;

export const authOptions: NextAuthOptions = {
  debug: true,
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID as string,
      clientSecret: process.env.LINE_CLIENT_SECRET as string,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "line") {
        try {
          if (!supabaseAdmin) {
            console.error("[NextAuth] Supabase Admin client not initialized - check env vars");
            return "/register-info";
          }

          const { data, error } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("line_user_id", user.id)
            .maybeSingle();

          console.log("[NextAuth] signIn check:", { userId: user.id, data, error });

          if (!data || error) {
            return "/register-info";
          }

          return "/citizen/select-year";
        } catch (err) {
          console.error("[NextAuth] signIn callback error:", err);
          return "/register-info";
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub as string;
      }
      return session;
    },
    async jwt({ token, account }) {
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

