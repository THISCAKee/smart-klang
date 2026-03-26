// ไฟล์: app/layout.tsx
import type { Metadata } from "next";
import { Anuphan } from "next/font/google";
import "./globals.css";

// 1. นำเข้า Providers ที่เราเพิ่งสร้าง
import { Providers } from "./providers";

const anuphan = Anuphan({ 
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Smart Klang",
  description: "ระบบบริการตรวจสอบยอดภาษีออนไลน์",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={anuphan.className}>
        {/* 2. หุ้ม children ด้วย Providers */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
