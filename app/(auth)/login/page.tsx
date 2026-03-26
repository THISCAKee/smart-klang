// ไฟล์: app/(auth)/login/page.tsx
"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";

export default function LoginPage() {
  const handleLineLogin = () => {
    // ฟังก์ชันนี้จะเรียกใช้งาน NextAuth เพื่อวิ่งไปที่หน้าจออนุญาตของ LINE
    signIn("line", { callbackUrl: "/auth-redirect" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-blue-800 mb-2">
          ระบบ Smart Klang
        </h2>
        <p className="text-gray-600 mb-8">
          เข้าสู่ระบบเพื่อตรวจสอบภาษีและจัดการข้อมูล
        </p>

        <button
          onClick={handleLineLogin}
          className="w-full flex items-center justify-center gap-3 bg-[#06C755] text-white py-3 px-4 rounded-lg hover:bg-[#05b34c] transition font-medium text-lg shadow-md"
        >
          {/* สามารถดาวน์โหลดไอคอน LINE มาไว้ในโฟลเดอร์ public/ ได้ หรือใช้ Text ไปก่อน */}
          <span className="font-bold">LINE</span>
          เข้าสู่ระบบด้วย LINE
        </button>

        <div className="mt-8 text-sm text-gray-500 text-left bg-blue-50 p-4 rounded-lg border border-blue-100">
          <p className="font-semibold text-blue-700 mb-1">
            ℹ️ สำหรับผู้ใช้งานครั้งแรก:
          </p>
          <p>
            หลังจากเข้าสู่ระบบด้วย LINE แล้ว
            ระบบจะให้ท่านกรอกเลขบัตรประจำตัวประชาชน 13 หลัก
            เพื่อเชื่อมโยงข้อมูลภาษีของท่านเข้ากับบัญชี LINE
          </p>
        </div>
      </div>
    </div>
  );
}
