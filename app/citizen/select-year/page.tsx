// ไฟล์: app/citizen/select-year/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SelectYearPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [annualOptions, setAnnualOptions] = useState<string[]>([]);
  const [selectedAnnual, setSelectedAnnual] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    async function fetchData() {
      try {
        // ดึงข้อมูลปีประเมินทั้งหมดจากตาราง pa
        const { data, error } = await supabase.from("pa").select("annual");
        if (!error && data) {
          const uniqueAnnuals = Array.from(
            new Set(
              data
                .filter((item) => item && item.annual)
                .map((item) => String(item.annual).trim())
                .filter((item) => item !== ""),
            ),
          ).sort((a, b) => Number(b) - Number(a));

          setAnnualOptions(uniqueAnnuals);
          if (uniqueAnnuals.length > 0) setSelectedAnnual(uniqueAnnuals[0]);
        }
      } catch (err) {
        console.error("Error fetching annuals:", err);
      } finally {
        setIsLoading(false);
      }
    }

    // ดึงชื่อผู้ใช้จาก session สำหรับแสดงใน greeting
    if (session?.user?.name) {
      setUserName(session.user.name);
    }

    fetchData();
  }, [status, session, router]);

  const handleConfirm = () => {
    if (selectedAnnual) {
      router.push(`/citizen/tax-status?year=${selectedAnnual}`);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-blue-50/20 p-4 font-sans">
      {/* Background decorative blob */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          {/* Header Gradient Bar */}
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

          <div className="p-8">
            {/* Icon */}
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
            </div>

            {/* Greeting */}
            <div className="text-center mb-8">
              <p className="text-xs text-indigo-500 font-semibold uppercase tracking-widest mb-1">
                ยินดีต้อนรับ
              </p>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">
                {userName || "คุณ"}
              </h1>
              <p className="text-slate-500 text-sm">
                กรุณาเลือกปีประเมินภาษีที่ต้องการตรวจสอบ
              </p>
            </div>

            {/* Year Selector */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                ปีประเมินภาษี
              </label>
              {annualOptions.length > 0 ? (
                <div className="grid gap-2">
                  {annualOptions.map((year) => (
                    <button
                      key={year}
                      onClick={() => setSelectedAnnual(year)}
                      className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl border-2 font-semibold transition-all text-sm ${
                        selectedAnnual === year
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100"
                          : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span>พ.ศ. {year}</span>
                      {selectedAnnual === year && (
                        <span className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-white"
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
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <p>ไม่พบข้อมูลปีประเมิน</p>
                </div>
              )}
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              disabled={!selectedAnnual}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-indigo-200 transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed active:scale-[0.98]"
            >
              ดูข้อมูลภาษีของฉัน
            </button>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 mt-4">
          ระบบตรวจสอบภาษี Smart Klang
        </p>
      </div>
    </div>
  );
}
