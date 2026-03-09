"use client"; // บังคับให้หน้านี้ทำงานฝั่ง Client เพราะมีการจัดการ State (useState)

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1); // Step 1: กรอกข้อมูล, Step 2: กรอก OTP
  const [idCard, setIdCard] = useState("");
  const [contactInfo, setContactInfo] = useState(""); // ใช้ได้ทั้งเบอร์โทรหรืออีเมล
  const [otp, setOtp] = useState("");

  // ฟังก์ชันจำลองการขอ OTP
  const handleRequestOTP = (e: React.FormEvent) => {
    e.preventDefault();
    // ในอนาคตเราจะเขียนโค้ดเรียก API ส่งอีเมล OTP ที่นี่
    console.log("กำลังส่ง OTP ไปที่:", contactInfo);
    setStep(2); // เปลี่ยนไปหน้ากรอก OTP
  };

  // ฟังก์ชันจำลองการยืนยัน OTP
  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    // ในอนาคตเราจะเขียนโค้ดตรวจสอบ OTP ที่นี่
    console.log("ตรวจสอบ OTP:", otp, "สำหรับบัตร:", idCard);
    alert("ยืนยันตัวตนสำเร็จ! กำลังพาท่านเข้าสู่ระบบ...");
    // TODO: Redirect ไปยังหน้า ตรวจสอบภาษี
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-blue-800 mb-6">
          ลงทะเบียนผู้ใช้งานใหม่
        </h2>

        {step === 1 ? (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เลขประจำตัวประชาชน 13 หลัก
              </label>
              <input
                type="text"
                required
                maxLength={13}
                value={idCard}
                onChange={(e) => setIdCard(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="1123456789012"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                อีเมล หรือ เบอร์โทรศัพท์ (เพื่อรับ OTP)
              </label>
              <input
                type="text"
                required
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="example@email.com"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              ขอรับรหัส OTP
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <p className="text-center text-sm text-gray-600">
              รหัส OTP ถูกส่งไปที่ <strong>{contactInfo}</strong> แล้ว
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-center">
                กรอกรหัส OTP 6 หลัก
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-medium"
            >
              ยืนยันรหัส OTP
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition font-medium mt-2"
            >
              ย้อนกลับ
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          <Link href="/login" className="text-blue-600 hover:underline">
            มีบัญชีอยู่แล้ว? เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}
