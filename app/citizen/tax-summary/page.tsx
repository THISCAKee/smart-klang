"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function TaxSummaryContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [userData, setUserData] = useState<any>(null);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [taxSummary, setTaxSummary] = useState<any>(null);
  const [displayYear, setDisplayYear] = useState<string>("");
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
        const response = await fetch(`/api/get-tax-data?${searchParams.toString()}`);
        const result = await response.json();

        if (response.ok && result.success) {
          setUserData(result.userData);
          setTaxAmount(result.taxAmount);
          setTaxSummary(result.taxSummary);
          setDisplayYear(result.year);
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
  }, [status, router, searchParams]);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium italic tracking-wide">กำลังดึงข้อมูลใบสรุปยอดภาษี...</p>
        </div>
      </div>
    );
  }

  // ใช้ข้อมูลจาก tax_data หรือ fallback ไปที่ค่าจากระบบเดิม
  const summaryName = taxSummary?.owner_name || `${userData?.prefix}${userData?.firstName} ${userData?.lastName}`;
  const assessed = taxSummary?.tax_assessed !== undefined ? Number(taxSummary.tax_assessed) : 0;
  const paid = taxSummary?.tax_paid !== undefined ? Number(taxSummary.tax_paid) : 0;
  // ถ้ายอดคงเหลือไม่มีในตาราง ให้คำนวณเองเบื้องต้น
  const due = taxSummary?.tax_due !== undefined ? Number(taxSummary.tax_due) : (assessed > 0 ? (assessed - paid) : taxAmount);
  // ถ้ามียอดชำระแล้ว (tax_paid > 0) ให้ถือว่าชำระแล้ว
  const hasPaidAtLeastSome = paid > 0;
  const isPaidFull = due <= 0 && (taxSummary || taxAmount === 0);
  const showPaidStatus = hasPaidAtLeastSome || isPaidFull;

  return (
    <div className="min-h-screen bg-slate-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] p-4 md:p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-10">
           <button
             onClick={() => router.back()}
             className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors"
           >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
              ย้อนกลับ
           </button>
           <div className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase shadow-lg shadow-indigo-100">
             TAX SUMMARY {displayYear}
           </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
          {/* Top Banner */}
          <div className="bg-slate-900 p-8 md:p-12 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
             <div className="relative z-10">
                <p className="text-indigo-400 text-xs font-black tracking-[0.2em] uppercase mb-3">สรุปข้อมูลผู้รับการประเมิน</p>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2 truncate">{summaryName}</h2>
                <div className="flex items-center gap-3">
                   <span className="px-3 py-1 rounded-md bg-white/10 text-white/70 text-xs font-bold border border-white/5">ปี พ.ศ. {displayYear}</span>
                   <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                   <span className="text-white/50 text-xs font-medium italic">ข้อมูลจากกรมส่งเสริมการปกครองท้องถิ่น</span>
                </div>
             </div>
          </div>

          <div className="p-8 md:p-12 space-y-10">
             {/* Main Amount Card */}
             <div className="text-center group">
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-4">ยอดภาษีคงค้าง (Balance Due)</p>
                <div className="inline-flex items-start gap-2 bg-slate-50 px-10 py-8 rounded-[3rem] border border-slate-100 group-hover:scale-105 transition-transform duration-500">
                   <span className="text-2xl text-slate-300 font-black mt-3">฿</span>
                   <h1 className={`text-7xl md:text-8xl font-black tracking-tighter ${due > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {new Intl.NumberFormat("th-TH").format(due)}
                   </h1>
                </div>
             </div>

             {/* Details Table */}
             <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between p-6 rounded-2xl bg-slate-50 border border-slate-100">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                      </div>
                      <span className="font-bold text-slate-600">ภาษีที่ประเมิน (Assessed)</span>
                   </div>
                   <span className="text-xl font-black text-slate-800 tracking-tight">
                      ฿{new Intl.NumberFormat("th-TH").format(assessed)}
                   </span>
                </div>

                <div className="flex items-center justify-between p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100/50">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      </div>
                      <span className="font-bold text-emerald-700">ชำระแล้ว (Paid)</span>
                   </div>
                   <span className="text-xl font-black text-emerald-600 tracking-tight">
                      -฿{new Intl.NumberFormat("th-TH").format(paid)}
                   </span>
                </div>
             </div>

             {/* Status Badge */}
             <div className="pt-4">
                {showPaidStatus ? (
                   <div className="w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white flex items-center justify-center gap-3 shadow-xl shadow-emerald-200">
                      <svg className="w-6 h-6 border-2 border-white rounded-full p-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>
                      <span className="text-lg font-black uppercase tracking-widest">
                         {due <= 0 ? "ชำระครบถ้วนแล้ว" : "ชำระแล้ว"}
                      </span>
                   </div>
                ) : (
                   <div className="w-full py-5 rounded-2xl bg-rose-50 border-2 border-dashed border-rose-200 text-rose-600 flex flex-col items-center justify-center gap-1 group">
                      <span className="text-lg font-black uppercase tracking-widest flex items-center gap-2 group-hover:scale-110 transition-all">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                        รอดำเนินการชำระเงิน
                      </span>
                      <p className="text-rose-400 text-[10px] font-bold uppercase tracking-tighter">Please settle the remaining balance</p>
                   </div>
                )}
             </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
           <Link href={`/citizen/tax-status?${searchParams.toString()}`} className="w-full flex items-center justify-center py-4 bg-slate-800 text-white rounded-2xl font-black hover:bg-slate-700 transition-all">
             ตรวจสอบรายการทรัพย์สินโดยละเอียด
           </Link>
           <button onClick={() => window.print()} className="w-full flex items-center justify-center gap-4 py-4 bg-white text-slate-400 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2-2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4h10z"></path></svg>
             พิมพ์ใบสรุปยอด
           </button>
        </div>
      </div>
    </div>
  );
}

export default function TaxSummaryPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center font-sans tracking-tight">กำลังโหลดข้อมูล...</div>}>
      <TaxSummaryContent />
    </Suspense>
  );
}
