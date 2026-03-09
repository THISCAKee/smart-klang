// ไฟล์: app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import LineProvider from "next-auth/providers/line";

const handler = NextAuth({
  providers: [
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID as string,
      clientSecret: process.env.LINE_CLIENT_SECRET as string,
    }),
  ],
  pages: {
    signIn: "/login", // กำหนดให้วิ่งไปที่หน้า Login ที่เราสร้างเอง
  },
  callbacks: {
    async session({ session, token }) {
      // แนบ LINE User ID (sub) ไปกับ session เพื่อเอาไปใช้งานต่อ
      if (session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
