// ไฟล์: app/register-info/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RegisterInfoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State สำหรับฟอร์มลงทะเบียน
  const [prefix, setPrefix] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [idCard, setIdCard] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // State สำหรับ Dropdown คำนำหน้า
  const [prefixOptions, setPrefixOptions] = useState<string[]>([]);
  const [isLoadingPrefixes, setIsLoadingPrefixes] = useState(true);

  // --- State ใหม่สำหรับ Popup Error ข้อมูลซ้ำ ---
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- State ใหม่สำหรับ Popup เลือกปีประเมิน ---
  const [showYearPopup, setShowYearPopup] = useState(false);
  const [annualOptions, setAnnualOptions] = useState<string[]>([]);
  const [selectedAnnual, setSelectedAnnual] = useState("");
  const [isLoadingAnnuals, setIsLoadingAnnuals] = useState(false);

  // ดึงข้อมูลคำนำหน้า (ตอนโหลดหน้าเว็บ)
  useEffect(() => {
    async function fetchPrefixes() {
      try {
        const { data, error } = await supabase.from("owner").select("prefix");
        if (!error && data) {
          const uniquePrefixes = Array.from(
            new Set(
              data
                .filter((item) => item && item.prefix)
                .map((item) => String(item.prefix).trim())
                .filter((item) => item !== ""),
            ),
          );
          setPrefixOptions(uniquePrefixes);
          if (uniquePrefixes.length > 0) setPrefix(uniquePrefixes[0]);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setIsLoadingPrefixes(false);
      }
    }
    fetchPrefixes();
  }, []);

  // ฟังก์ชันดึงข้อมูลปีประเมินจากตาราง pa
  const fetchAnnuals = async () => {
    setIsLoadingAnnuals(true);
    try {
      const { data, error } = await supabase.from("pa").select("annual");
      if (!error && data) {
        // กรองค่าซ้ำ, ตัดช่องว่าง, และเรียงลำดับจากปีล่าสุดไปเก่าสุด
        const uniqueAnnuals = Array.from(
          new Set(
            data
              .filter((item) => item && item.annual)
              .map((item) => String(item.annual).trim())
              .filter((item) => item !== ""),
          ),
        ).sort((a, b) => Number(b) - Number(a)); // เรียงมากไปน้อย

        setAnnualOptions(uniqueAnnuals);
        if (uniqueAnnuals.length > 0) setSelectedAnnual(uniqueAnnuals[0]);
      }
    } catch (err) {
      console.error("Error fetching annuals:", err);
    } finally {
      setIsLoadingAnnuals(false);
    }
  };

  // จัดการเมื่อกดปุ่ม "บันทึกข้อมูล"
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ตรวจสอบเลขบัตรประชาชน
    if (!idCard || idCard.length !== 13) {
      setErrorMessage("กรุณากรอกเลขประจำตัวประชาชนให้ครบ 13 หลัก");
      return;
    }

    setIsLoading(true);

    const res = await fetch("/api/register-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lineUserId: session?.user?.id,
        prefix: prefix,
        firstName: firstName,
        lastName: lastName,
        idCard: idCard,
      }),
    });

    const result = await res.json();

    if (result.success) {
      // เมื่อบันทึกสำเร็จ ให้ดึงข้อมูลปีประเมิน และเปิด Popup แทนการเปลี่ยนหน้าทันที
      await fetchAnnuals();
      setShowYearPopup(true);
      setIsLoading(false);
    } else {
      setErrorMessage(result.error);
      setIsLoading(false);
    }
  };

  // จัดการเมื่อกดปุ่ม "ตกลง" ใน Popup
  const handleConfirmYear = () => {
    // ส่งปีที่เลือกแนบไปกับ URL ด้วย (Query Parameter) เพื่อให้หน้าต่อไปดึงข้อมูลถูกปี
    router.push(`/citizen/tax-status?year=${selectedAnnual}`);
  };

  if (status === "loading")
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">กำลังโหลดระบบ...</p>
        </div>
      </div>
    );
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-blue-50/20 flex items-center justify-center p-4 font-sans">
      {/* Blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-4xl">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden grid grid-cols-1 md:grid-cols-2">
          {/* ---- Left Panel (Branding) ---- */}
          <div className="hidden md:flex flex-col items-start justify-between bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 p-10 relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full"></div>
            <div className="absolute bottom-10 -left-10 w-64 h-64 bg-white/5 rounded-full"></div>

            <div className="relative z-10">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-6">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  ></path>
                </svg>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight mb-3">
                Smart Klang
              </h1>
              <p className="text-blue-100 text-sm leading-relaxed">
                ระบบตรวจสอบภาษีออนไลน์
                <br />
                เชื่อมต่อข้อมูลของคุณกับบัญชี LINE
                <br />
                เพื่อเข้าถึงข้อมูลภาษีได้ทุกที่ทุกเวลา
              </p>
            </div>

            <div className="relative z-10 space-y-3 w-full">
              {[
                { icon: "M5 13l4 4L19 7", text: "ปลอดภัยด้วยระบบ LINE Login" },
                {
                  icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                  text: "ทำเพียงครั้งแรกครั้งเดียว",
                },
                {
                  icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
                  text: "ข้อมูลเป็นความลับ",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 text-blue-100 text-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <svg
                      className="w-3.5 h-3.5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d={item.icon}
                      ></path>
                    </svg>
                  </div>
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          {/* ---- Right Panel (Form) ---- */}
          <div className="p-8 md:p-10 flex flex-col justify-center">
            {/* Top accent bar (mobile only) */}
            <div className="md:hidden h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mb-8 w-12"></div>

            <div className="mb-8">
              <p className="text-xs text-indigo-500 font-semibold uppercase tracking-widest mb-1">
                ขั้นตอนแรก
              </p>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-1">
                ยืนยันตัวตนผู้ใช้งาน
              </h2>
              <p className="text-sm text-slate-500">
                กรอกข้อมูลเพื่อเชื่อมโยงกับบัญชี LINE ของท่าน
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* คำนำหน้า + ชื่อ */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    คำนำหน้า
                  </label>
                  <select
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    disabled={isLoadingPrefixes || prefixOptions.length === 0}
                    className="text-black w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none disabled:bg-slate-100 transition-all"
                  >
                    {isLoadingPrefixes ? (
                      <option value="">...</option>
                    ) : (
                      prefixOptions.map((opt, i) => (
                        <option key={i} value={opt}>
                          {opt}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    ชื่อ
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="text-black w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
                  />
                </div>
              </div>

              {/* นามสกุล */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  นามสกุล{" "}
                  <span className="text-slate-400 font-normal lowercase">
                    (ไม่บังคับกรอก)
                  </span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="text-black w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
                  placeholder="ถ้ามี"
                />
              </div>

              {/* เลขบัตรประชาชน */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  เลขประจำตัวประชาชน 13 หลัก{" "}
                  <span className="text-rose-500 font-semibold lowercase">
                    (จำเป็น)
                  </span>
                </label>
                <input
                  type="text"
                  maxLength={13}
                  value={idCard}
                  onChange={(e) => setIdCard(e.target.value.replace(/\D/g, ""))}
                  className="text-black w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-widest focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
                  placeholder="0000000000000"
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  ตัวเลข {idCard.length}/13 หลัก
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-indigo-200 transition-all disabled:opacity-60 disabled:shadow-none active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                    กำลังตรวจสอบข้อมูล...
                  </>
                ) : (
                  "ยืนยันและบันทึกข้อมูล"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* --- Popup เลือกปีประเมิน --- */}
      {showYearPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm border border-slate-100">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-200">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-center text-slate-800 mb-1">
              ลงทะเบียนสำเร็จ!
            </h3>
            <p className="text-center text-slate-500 mb-6 text-sm">
              เลือกปีประเมินภาษีที่ต้องการตรวจสอบ
            </p>

            {isLoadingAnnuals ? (
              <div className="w-full px-4 py-3 bg-slate-100 rounded-2xl text-center text-slate-500 animate-pulse mb-6">
                กำลังโหลดปี...
              </div>
            ) : (
              <div className="grid gap-2 mb-6">
                {annualOptions.map((year, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedAnnual(year)}
                    className={`w-full flex items-center justify-between px-5 py-3 rounded-2xl border-2 font-semibold text-sm transition-all ${
                      selectedAnnual === year
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200"
                    }`}
                  >
                    พ.ศ. {year}
                    {selectedAnnual === year && (
                      <svg
                        className="w-4 h-4 text-indigo-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={handleConfirmYear}
              disabled={isLoadingAnnuals || !selectedAnnual}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-indigo-200 transition-all disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
            >
              ดูข้อมูลภาษีของฉัน
            </button>
          </div>
        </div>
      )}

      {/* --- Popup แจ้งเตือน Error --- */}
      {errorMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm border border-slate-100">
            <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg
                className="w-8 h-8 text-rose-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                ></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-center text-slate-800 mb-2">
              พบข้อผิดพลาด
            </h3>
            <p className="text-center text-slate-500 mb-6 text-sm">
              {errorMessage}
            </p>
            <button
              onClick={() => setErrorMessage(null)}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-base bg-slate-800 hover:bg-slate-900 transition-all active:scale-[0.98]"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
