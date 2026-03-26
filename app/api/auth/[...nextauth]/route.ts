// ไฟล์: app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import LineProvider from "next-auth/providers/line";
import { createClient } from "@supabase/supabase-js";

// ใช้ Service Role เพื่อข้าม RLS ในการตรวจสอบ line_user_id
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!,
);

export const authOptions: NextAuthOptions = {
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
    // ฟังก์ชันนี้จะทำงานทันทีที่ล็อกอิน LINE สำเร็จ
    async signIn({ user, account }) {
      if (account?.provider === "line") {
        // ค้นหาว่ามี LINE ID นี้ใน Supabase หรือยัง (ใช้ Admin bypass RLS)
        const { data, error } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("line_user_id", user.id)
          .maybeSingle();

        // ถ้าค้นหาไม่เจอ (แสดงว่าเป็นผู้ใช้ใหม่) ให้เด้งไปหน้ากรอกข้อมูล
        if (!data || error) {
          return "/register-info";
        }

        // ถ้ามีข้อมูลแล้ว ให้วิ่งไปหน้าเลือกปีประเมิน
        return "/citizen/select-year";
      }
      return true;
    },
    // เก็บ LINE ID ไว้ใน Session เผื่อเรียกใช้ในหน้าเว็บ
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
