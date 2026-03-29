"use client";

import { Suspense, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function SearchSelectionContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [displayYear, setDisplayYear] = useState<string>("");

  useEffect(() => {
    async function fetchBriefData() {
      if (status === "loading") return;
      if (status === "unauthenticated") {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(`/api/get-tax-data?${searchParams.toString()}`);
        const result = await response.json();
        if (result.success) {
          setUserData(result.userData);
          setDisplayYear(result.year);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBriefData();
  }, [status, router, searchParams]);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium tracking-wide">กำลังเตรียมข้อมูล...</p>
        </div>
      </div>
    );
  }

  const queryStr = searchParams.toString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-blue-50/20 flex items-center justify-center p-4 font-sans">
      <div className="max-w-4xl w-full">
        {/* Header Info */}
        <div className="text-center mb-12">
           <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-indigo-100 shadow-sm text-indigo-600 text-sm font-bold">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              ปีประเมินภาษี พ.ศ. {displayYear}
           </div>
           <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">
             คุณ {userData?.firstName} {userData?.lastName}
           </h1>
           <p className="text-slate-400 font-medium">กรุณาเลือกบริการที่คุณต้องการตรวจสอบ</p>
        </div>

        {/* Choice Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
           {/* Option 1:资产ทะเบียน */}
           <Link
             href={`/citizen/tax-status?${queryStr}`}
             className="group relative h-full bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white hover:border-indigo-400 transition-all duration-300 overflow-hidden transform hover:-translate-y-2"
           >
              <div className="absolute top-0 left-0 w-full h-2.5 bg-indigo-600"></div>
              <div className="p-10 flex flex-col items-center text-center gap-6 h-full">
                 <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                 </div>
                 <div>
                    <h2 className="text-2xl font-black text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors">ตรวจสอบรายการ<br/>ทะเบียนทรัพย์สิน</h2>
                    <p className="text-slate-500 text-sm leading-relaxed px-4">
                      ดูรายละเอียดที่ดิน สิ่งปลูกสร้าง และป้ายของคุณทั้งหมดที่มีในทะเบียนของกองคลัง
                    </p>
                 </div>
                 <div className="mt-auto w-full pt-4 border-t border-slate-50">
                    <span className="text-indigo-600 font-bold text-sm flex items-center justify-center gap-2 tracking-wide group-hover:gap-3 transition-all">
                       ดูรายละเอียดทรัพย์สิน
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                       </svg>
                    </span>
                 </div>
              </div>
           </Link>

           {/* Option 2:ตรวจสอบยอดภาษี */}
           <Link
             href={`/citizen/tax-summary?${queryStr}`}
             className="group relative h-full bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white hover:border-emerald-400 transition-all duration-300 overflow-hidden transform hover:-translate-y-2"
           >
              <div className="absolute top-0 left-0 w-full h-2.5 bg-emerald-500"></div>
              <div className="p-10 flex flex-col items-center text-center gap-6 h-full">
                 <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                 </div>
                 <div>
                    <h2 className="text-2xl font-black text-slate-800 mb-3 group-hover:text-emerald-500 transition-colors">ตรวจสอบ<br/>ยอดภาษี</h2>
                    <p className="text-slate-500 text-sm leading-relaxed px-4">
                      เช็คจำนวนเงินภาษีสุทธิที่ต้องชำระในปีประเมินนี้ และสถานะการชำระเงิน
                    </p>
                 </div>
                 <div className="mt-auto w-full pt-4 border-t border-slate-50">
                    <span className="text-emerald-600 font-bold text-sm flex items-center justify-center gap-2 tracking-wide group-hover:gap-3 transition-all">
                       ดูยอดภาษีค้างชำระ
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                       </svg>
                    </span>
                 </div>
              </div>
           </Link>
        </div>

        {/* Back link */}
        <div className="mt-12 text-center">
           <button
             onClick={() => router.push("/citizen/search")}
             className="text-slate-400 hover:text-indigo-600 font-bold text-sm transition-all"
           >
              ← ค้นหาบุคคลอื่น
           </button>
        </div>
      </div>
    </div>
  );
}

export default function SearchSelectionPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center font-sans tracking-wide">กำลังเข้าสู่ระบบ...</div>}>
      <SearchSelectionContent />
    </Suspense>
  );
}
