// ไฟล์: app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import LineProvider from "next-auth/providers/line";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

const supabaseAdmin =
  supabaseUrl && supabaseServiceRole
    ? createClient(supabaseUrl, supabaseServiceRole)
    : null;

export const authOptions: NextAuthOptions = {
  debug: true,
  secret: process.env.NEXTAUTH_SECRET,
  // ⚠️ บรรทัดนี้สำคัญที่สุดสำหรับ Vercel: ให้ข้ามการเช็คโดเมนที่เข้มงวดเกินไป

  providers: [
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID as string,
      clientSecret: process.env.LINE_CLIENT_SECRET as string,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  // ⚠️ ลบการตั้งค่า cookies: {...} ออกทั้งหมด ให้ NextAuth จัดการเองตามมาตรฐาน Vercel
  // แต่เราจะใช้ตัวเลือกนี้แทน:
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 วัน
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "line") {
        try {
          if (!supabaseAdmin) {
            console.error("[NextAuth] Supabase Admin missing");
            return true; // ยอมให้ผ่านไปก่อนแม้ไม่มี DB เพื่อกันหน้าขาว
          }
          const { data, error } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("line_user_id", user.id)
            .maybeSingle();

          if (!data || error) return "/register-info";
          return "/citizen/select-year";
        } catch (err) {
          console.error("SignIn Error:", err);
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
      if (account) token.provider = account.provider;
      return token;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
