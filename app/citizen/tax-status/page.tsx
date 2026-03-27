// ไฟล์: app/citizen/tax-status/page.tsx (เฉพาะส่วนเนื้อหา)
"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function TaxStatusContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const yearFromUrl = searchParams.get("year");
  const [selectedYear, setSelectedYear] = useState<string>(yearFromUrl || "");
  const [displayYear, setDisplayYear] = useState<string>(yearFromUrl || "กำลังโหลด...");
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ปิด Dropdown เมื่อคลิกนอกพื้นที่
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowYearDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [userData, setUserData] = useState<{
    prefix: string;
    firstName: string;
    lastName: string;
  } | null>(null);
  const [taxAmount, setTaxAmount] = useState<number>(0);

  // เพิ่ม State สำหรับเก็บรายการแปลงที่ดิน และสิ่งปลูกสร้าง
  const [landPlots, setLandPlots] = useState<
    { line_no: string; ln: string; dn: string; sn: string; r: string; y: string; w: string }[]
  >([]);
  const [buildings, setBuildings] = useState<
    { address: string; moo: string; b_type: string; b_material: string; no_floor: number; all_area: number; notes: string; ref_lid: any }[]
  >([]);
  const [signboards, setSignboards] = useState<
    { s_name: string; s_desc: string; sign_type_id: string; sw: number; sl: number; no_side: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (status === "loading") return;
      if (status === "unauthenticated") {
        router.push("/login");
        return;
      }

      setIsLoading(true);
      try {
        const url = selectedYear ? `/api/get-tax-data?year=${selectedYear}` : `/api/get-tax-data`;
        const response = await fetch(url);
        const result = await response.json();

        if (response.ok && result.success) {
          setUserData(result.userData);
          setTaxAmount(result.taxAmount);
          setLandPlots(result.landPlots || []);
          setBuildings(result.buildings || []);
          setSignboards(result.signboards || []);
          if (result.year) {
            setDisplayYear(result.year);
            // ถ้ายังไม่ได้เลือกปีไว้ ให้ตั้งปีจาก API
            if (!selectedYear) setSelectedYear(result.year);
          }
          if (result.availableYears && result.availableYears.length > 0) {
            setAvailableYears(result.availableYears);
          }
        } else {
          console.error("Failed to fetch data:", result.error);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [status, selectedYear, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">
            กำลังค้นหาข้อมูลภาษีของคุณ...
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* ปุ่มกลับหน้าหลัก */}
      <div className="flex items-center">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-all font-medium text-sm bg-white hover:bg-slate-50 px-4 py-2 rounded-full border border-slate-200 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          กลับหน้าหลัก
        </Link>
      </div>

      {/* Year Selector Dropdown */}
      {availableYears.length > 0 && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowYearDropdown((prev) => !prev)}
            className="inline-flex items-center gap-3 bg-white border border-slate-200 shadow-sm px-5 py-2.5 rounded-2xl text-slate-700 font-semibold text-sm hover:border-indigo-300 hover:text-indigo-600 transition-all"
          >
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            ปีประเมิน: พ.ศ. {displayYear}
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${ showYearDropdown ? "rotate-180" : "" }`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>

          {showYearDropdown && (
            <div className="absolute left-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden min-w-[180px]">
              {availableYears.map((year) => (
                <button
                  key={year}
                  onClick={() => {
                    setSelectedYear(year);
                    setShowYearDropdown(false);
                  }}
                  className={`w-full text-left px-5 py-3 text-sm font-medium transition-colors flex items-center justify-between gap-4 ${
                    displayYear === year
                      ? "bg-indigo-50 text-indigo-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  พ.ศ. {year}
                  {displayYear === year && (
                    <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ส่วนหัว: แสดงข้อมูลผู้ใช้งาน */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full translate-x-1/2 -translate-y-1/2 opacity-70 blur-3xl"></div>
        <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md auto-shrink-0">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              ></path>
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold mb-1 tracking-wider uppercase">
              ผู้เสียภาษี
            </p>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              {userData
                ? `${userData.prefix}${userData.firstName} ${userData.lastName}`
                : "ไม่พบข้อมูล"}
            </h2>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 md:gap-8 w-full md:w-auto relative z-10">
          <div className="bg-slate-50/80 backdrop-blur px-6 py-4 rounded-2xl border border-slate-100 text-center flex-1 md:flex-initial">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">จำนวนแปลงที่ดิน</p>
            <p className="text-2xl font-black text-slate-800 tracking-tight">
              {landPlots.length} <span className="text-sm font-bold text-slate-400">แปลง</span>
            </p>
          </div>
          <div className="bg-slate-50/80 backdrop-blur px-8 py-4 rounded-2xl border border-slate-100 text-center flex-1 md:flex-initial">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">ปีประเมิน</p>
            <p className="text-2xl font-black text-indigo-600 tracking-tight">พ.ศ. {displayYear}</p>
          </div>
        </div>
      </div>

      {/* Grid แบ่ง 2 ฝั่ง ซ้ายยอดภาษี ขวารายการแปลงที่ดิน */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* การ์ดยอดเงิน (ฝั่งซ้าย) */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          <div className="p-8 flex-1 flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-6">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
            </div>
            <p className="text-slate-500 font-medium mb-2 text-lg">
              ยอดภาษีที่ต้องชำระ
            </p>
            <h1 className="text-5xl lg:text-6xl font-black text-slate-800 tracking-tighter mb-8 flex items-start justify-center gap-1">
              <span className="text-2xl text-slate-400 font-bold mt-2">฿</span>
              {new Intl.NumberFormat("th-TH").format(taxAmount)}
            </h1>
            
            {taxAmount > 0 ? (
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-50 border border-rose-100 text-rose-600 font-semibold shadow-sm transition-all hover:bg-rose-100">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse relative"></span>
                รอดำเนินการชำระเงิน
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 font-semibold shadow-sm">
                <svg
                  className="w-5 h-5"
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
                ไม่มียอดค้างชำระ
              </div>
            )}
          </div>
        </div>

        {/* การ์ดรายการแปลงที่ดิน (ฝั่งขวา) */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              รายการแปลงที่ดิน
            </h3>
            <span className="bg-slate-200 text-slate-600 text-xs font-bold px-3.5 py-1.5 rounded-full">
              {landPlots.length} รายการ
            </span>
          </div>

          <div className="p-6 flex-1 overflow-y-auto max-h-[400px]">
            {landPlots.length > 0 ? (
              <ul className="space-y-4">
                {landPlots.map((plot, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-4 p-5 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-indigo-100 transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm shrink-0">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="flex-1 w-full relative">
                      <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                        <div>
                          <p className="text-[10px] md:text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                            หมายเลขแปลง (ln)
                          </p>
                          <p className="font-bold text-slate-800 text-sm md:text-base">
                            {plot.ln}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] md:text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                            เลขเอกสารสิทธิ (dn)
                          </p>
                          <p className="font-medium text-slate-700 text-sm md:text-base">
                            {plot.dn}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] md:text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                            หน้าสำรวจ (sn)
                          </p>
                          <p className="font-medium text-slate-700 text-sm md:text-base">
                            {plot.sn}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] md:text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                            พื้นที่ตารางวา
                          </p>
                          <p className="font-medium text-slate-700 text-sm md:text-base truncate">
                            {plot.r} ไร่ {plot.y} งาน {plot.w} วา
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 opacity-40 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M20 12H4M8 16l-4-4 4-4"
                    ></path>
                  </svg>
                </div>
                <p className="text-slate-500 font-medium">ไม่พบรายการแปลงที่ดินในปีนี้</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ส่วนที่ 3: รายการสิ่งปลูกสร้าง */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
            </div>
            รายการสิ่งปลูกสร้าง
          </h3>
          <span className="bg-slate-200 text-slate-600 text-xs font-bold px-3.5 py-1.5 rounded-full">
            {buildings.length} รายการ
          </span>
        </div>

        <div className="overflow-x-auto">
          {buildings.length > 0 ? (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">บ้านเลขที่</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">หมู่</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">ประเภท (กรมธนารักษ์)</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">ลักษณะ</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-center">ชั้น</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-right">เนื้อที่ (ตร.ม.)</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {buildings.map((b, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{b.address || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{b.moo || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">{b.b_type || "-"}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{b.b_material || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-center">{b.no_floor || "1"}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-indigo-600 text-right">
                      {new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2 }).format(b.all_area || 0)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 italic">{b.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
              <p className="text-sm font-medium">ไม่พบข้อมูลสิ่งปลูกสร้างในปีที่เลือก</p>
            </div>
          )}
        </div>
      </div>

      {/* ส่วนที่ 4: รายการป้าย (ภาษีป้าย) */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
              </svg>
            </div>
            รายการป้าย (ภาษีป้าย)
          </h3>
          <span className="bg-slate-200 text-slate-600 text-xs font-bold px-3.5 py-1.5 rounded-full">
            {signboards.length} รายการ
          </span>
        </div>

        <div className="overflow-x-auto">
          {signboards.length > 0 ? (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">ชื่อกิจการ</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">ข้อความในป้าย</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-center">ประเภทป้าย</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-center">ขนาด (กว้าง x ยาว)</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-center">จำนวนด้าน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {signboards.map((s, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{s.s_name || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 leading-relaxed max-w-xs">{s.s_desc || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-center">
                      <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg text-xs font-semibold border border-amber-100">
                        ประเภท {s.sign_type_id || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 text-center font-mono italic">
                      {s.sw || 0} x {s.sl || 0} ซม.
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-center">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 font-bold text-xs">
                        {s.no_side || 1}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
              </svg>
              <p className="text-sm font-medium">ไม่พบข้อมูลป้ายในปีที่เลือก</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TaxStatusPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <Suspense
        fallback={
          <div className="text-center p-10">กำลังโหลดโครงสร้างหน้าเว็บ...</div>
        }
      >
        <TaxStatusContent />
      </Suspense>
    </div>
  );
}
