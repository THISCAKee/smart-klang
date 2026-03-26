// ไฟล์: app/providers.tsx
"use client"; // บังคับให้ไฟล์นี้ทำงานฝั่ง Client เพื่อให้ใช้ Context ได้

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
