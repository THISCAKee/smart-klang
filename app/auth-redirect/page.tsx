// ไฟล์: app/auth-redirect/page.tsx
// หน้านี้ทำหน้าที่เป็นตัวกลาง: เช็คว่า user ลงทะเบียนแล้วหรือยัง แล้ว redirect ไปหน้าที่ถูกต้อง
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthRedirectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    // ตรวจสอบว่าลงทะเบียนแล้วหรือยัง
    const isRegistered = (session?.user as any)?.isRegistered;
    console.log("[AuthRedirect] isRegistered:", isRegistered, "session:", session);

    if (isRegistered) {
      router.replace("/citizen/select-year");
    } else {
      router.replace("/register-info");
    }
  }, [status, session, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">กำลังตรวจสอบข้อมูล...</p>
      </div>
    </div>
  );
}
