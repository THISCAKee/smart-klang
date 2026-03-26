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
  providers: [
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID as string,
      clientSecret: process.env.LINE_CLIENT_SECRET as string,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 วัน
  },
  callbacks: {
    // ⚠️ signIn ต้อง return true เสมอ เพื่อให้ session ถูกสร้างขึ้น
    // ถ้า return string URL = "ปฏิเสธการ sign in" ทำให้ไม่มี session!
    async signIn({ user, account }) {
      if (account?.provider === "line") {
        try {
          if (!supabaseAdmin) {
            console.error("[NextAuth] Supabase Admin missing");
            return true;
          }
          // ตรวจสอบว่ามี user ในระบบหรือยัง แล้วเก็บผลลัพธ์ไว้ที่ user object
          const { data, error } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("line_user_id", user.id)
            .maybeSingle();

          console.log("[NextAuth] signIn check:", { lineId: user.id, data, error });

          // เก็บสถานะว่าลงทะเบียนแล้วหรือยังไว้ที่ user object
          // เพื่อส่งต่อไป jwt callback
          (user as any).isRegistered = !!(data && !error);
        } catch (err) {
          console.error("[NextAuth] SignIn Error:", err);
          (user as any).isRegistered = false;
        }
      }
      // ✅ return true เสมอ เพื่อให้ session ถูกสร้าง
      return true;
    },

    async jwt({ token, user, account }) {
      if (account) {
        token.provider = account.provider;
        // รับค่า isRegistered จาก signIn callback
        token.isRegistered = (user as any)?.isRegistered ?? false;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub as string;
        (session.user as any).isRegistered = token.isRegistered ?? false;
      }
      return session;
    },

    // ใช้ redirect callback เพื่อควบคุมว่า login เสร็จแล้วจะไปหน้าไหน
    async redirect({ url, baseUrl }) {
      // ถ้าเป็น relative URL ให้ต่อกับ baseUrl
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // ถ้าเป็น URL ของเราเอง ให้ผ่าน
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
