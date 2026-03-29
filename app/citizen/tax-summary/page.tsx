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
  const [signSummary, setSignSummary] = useState<any>(null);
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
        const response = await fetch(
          `/api/get-tax-data?${searchParams.toString()}`,
        );
        const result = await response.json();

        if (response.ok && result.success) {
          setUserData(result.userData);
          setTaxAmount(result.taxAmount);
          setTaxSummary(result.taxSummary);
          setSignSummary(result.signSummary);
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
          <p className="text-slate-500 font-medium italic tracking-wide">
            กำลังสรุปข้อมูลรายได้...
          </p>
        </div>
      </div>
    );
  }

  // คำนวณยอดรวมจากทั้งสองตาราง (Land/Building + Sign)
  const assessedLand =
    taxSummary?.tax_assessed !== undefined
      ? Number(taxSummary.tax_assessed)
      : 0;
  const paidLand =
    taxSummary?.tax_paid !== undefined ? Number(taxSummary.tax_paid) : 0;
  const dueLand =
    taxSummary?.tax_due !== undefined
      ? Number(taxSummary.tax_due)
      : assessedLand > 0
        ? assessedLand - paidLand
        : taxAmount;

  const assessedSign =
    signSummary?.tax_assessed !== undefined
      ? Number(signSummary.tax_assessed)
      : 0;
  const paidSign =
    signSummary?.tax_paid !== undefined ? Number(signSummary.tax_paid) : 0;
  const dueSign =
    signSummary?.tax_due !== undefined
      ? Number(signSummary.tax_due)
      : assessedSign - paidSign;

  const totalAssessed = assessedLand + assessedSign;
  const totalPaid = paidLand + paidSign;
  const totalDue = dueLand + dueSign;

  const summaryName =
    taxSummary?.owner_name ||
    signSummary?.owner_name ||
    `${userData?.prefix}${userData?.firstName} ${userData?.lastName}`;

  // สถานะการชำระรวม
  const hasPaidAtLeastSome = totalPaid > 0;
  const showPaidStatus =
    hasPaidAtLeastSome ||
    (totalDue <= 0 && (taxSummary || signSummary || totalAssessed === 0));

  return (
    <div className="min-h-screen bg-slate-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M15 19l-7-7 7-7"
              ></path>
            </svg>
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
              <p className="text-indigo-400 text-xs font-black tracking-[0.2em] uppercase mb-3 text-center md:text-left">
                สรุปยอดภาษีค้างชำระรวมทุกประเภท
              </p>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-2 truncate text-center md:text-left">
                {summaryName}
              </h2>
              <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
                <span className="px-3 py-1 rounded-md bg-white/10 text-white/70 text-xs font-bold border border-white/5">
                  ปี พ.ศ. {displayYear}
                </span>
                <span className="text-white/40 text-[10px] font-medium italic">
                  ตรวจสอบล่าสุดเมื่อ {new Date().toLocaleDateString("th-TH")}
                </span>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12 space-y-12">
            {/* Total Balance Card */}
            <div className="text-center">
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-4">
                ยอดรวมภาษีที่ดินและสิ่งปลูกสร้าง/ป้าย (Total Balance)
              </p>
              <div className="inline-flex flex-col md:flex-row items-center justify-center gap-2 md:gap-5 bg-slate-50 px-12 py-10 rounded-[4rem] border border-slate-100 shadow-inner">
                <div className="flex items-start gap-2">
                  <span className="text-2xl text-slate-300 font-black mt-3">
                    ฿
                  </span>
                  <h1
                    className={`text-7xl md:text-9xl font-black tracking-tighter ${totalDue > 0 ? "text-rose-600" : "text-emerald-600"}`}
                  >
                    {new Intl.NumberFormat("th-TH").format(totalDue)}
                  </h1>
                </div>
              </div>
            </div>

            {/* Details Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(assessedLand > 0 || taxSummary) && (
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
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
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        ></path>
                      </svg>
                    </div>
                    <div>
                      <span>
                        <h4 className="font-black text-slate-800">
                          ภาษีที่ดิน/สิ่งปลูกสร้าง
                        </h4>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">ยอดประเมินภาษี</span>
                      <span className="font-bold text-slate-800">
                        ฿{new Intl.NumberFormat("th-TH").format(assessedLand)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-500 font-medium">
                        ชำระแล้ว
                      </span>
                      <span className="font-bold text-emerald-600">
                        ฿{new Intl.NumberFormat("th-TH").format(paidLand)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-50 font-bold">
                      <span className="text-slate-400">
                        ยอดที่ยังไม่ชำระภาษี
                      </span>
                      <span
                        className={
                          dueLand > 0 ? "text-rose-600" : "text-emerald-600"
                        }
                      >
                        ฿{new Intl.NumberFormat("th-TH").format(dueLand)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {(assessedSign > 0 || signSummary) && (
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                    <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
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
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        ></path>
                      </svg>
                    </div>
                    <h4 className="font-black text-slate-800">ภาษีป้าย</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">ยอดประเมินภาษี</span>
                      <span className="font-bold text-slate-800">
                        ฿{new Intl.NumberFormat("th-TH").format(assessedSign)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-500 font-medium">
                        ชำระแล้ว
                      </span>
                      <span className="font-bold text-emerald-600">
                        ฿{new Intl.NumberFormat("th-TH").format(paidSign)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-50 font-bold">
                      <span className="text-slate-400">
                        ยอดที่ยังไม่ชำระภาษี
                      </span>
                      <span
                        className={
                          dueSign > 0 ? "text-rose-600" : "text-emerald-600"
                        }
                      >
                        ฿{new Intl.NumberFormat("th-TH").format(dueSign)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Total Combined Status */}
            <div className="pt-6">
              {showPaidStatus ? (
                <div className="w-full py-6 rounded-3xl bg-emerald-600 text-white flex flex-col items-center justify-center gap-1 shadow-2xl shadow-emerald-100">
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-8 h-8 border-2 border-white rounded-full p-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="4"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    <span className="text-xl font-black uppercase tracking-widest">
                      {totalDue <= 0
                        ? "ชำระครบถ้วนแล้วทุกรายการ"
                        : "มีการชำระเงินเข้ามาแล้ว"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full py-6 rounded-3xl bg-rose-50 border-2 border-dashed border-rose-200 text-rose-600 flex flex-col items-center justify-center gap-1">
                  <span className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
                    สามารถติดต่อชำระภาษีที่กองคลัง เทศบาลตำบลเวียงยอง
                  </span>
                  <p className="text-rose-400 text-xs font-bold uppercase tracking-widest">
                    Total Outstanding balance must be settled
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={`/citizen/tax-status?${searchParams.toString()}`}
            className="w-full flex items-center justify-center py-4 bg-slate-800 text-white rounded-2xl font-black hover:bg-slate-700 transition-all"
          >
            ตรวจสอบรายการทรัพย์สินโดยละเอียด
          </Link>
          <button
            onClick={() => window.print()}
            className="w-full flex items-center justify-center gap-4 py-4 bg-white text-slate-400 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all"
          >
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
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2-2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4h10z"
              ></path>
            </svg>
            พิมพ์ใบสรุปยอด
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TaxSummaryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center font-sans tracking-tight">
          กำลังโหลดข้อมูล...
        </div>
      }
    >
      <TaxSummaryContent />
    </Suspense>
  );
}
