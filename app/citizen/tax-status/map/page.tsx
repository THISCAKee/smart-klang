"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
// โหลดข้อมูลแผนที่

const WebMap = dynamic(() => import("@/app/components/WebMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 flex items-center justify-center rounded-2xl">
      กำลังโหลดระบบแผนที่...
    </div>
  ),
});

function MapContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dn = searchParams.get("dn");
  const ln = searchParams.get("ln");
  const [geojsonData, setGeojsonData] = useState<any>(null);
  const [loadingGeoJSON, setLoadingGeoJSON] = useState(false);

  // ดึง GeoJSON จากลิงก์ที่คุณระบุ
  useEffect(() => {
    async function fetchGeoJSON() {
      if (!dn) return;
      setLoadingGeoJSON(true);
      try {
        const url = "https://wfzistvpjamukhdtyquq.supabase.co/storage/v1/object/public/filemap/parcel2.geojson";
        const res = await fetch(url);
        
        if (res.ok) {
          const fullData = await res.json();
          console.log("Full GeoJSON fetched:", fullData);

          // กรองข้อมูลเฉพาะแปลงที่ตรงกับ dn ปัจจุบัน
          if (fullData.features) {
            const filteredFeatures = fullData.features.filter((f: any) => 
               String(f.properties?._dn) === String(dn) || String(f.properties?.dn) === String(dn)
            );

            if (filteredFeatures.length > 0) {
              setGeojsonData({
                ...fullData,
                features: filteredFeatures
              });
              console.log("Matched feature found for dn:", dn);
            } else {
              console.log("No matching feature found for dn:", dn);
            }
          }
        }
      } catch (e) {
        console.error("Error fetching geojson:", e);
      } finally {
        setLoadingGeoJSON(false);
      }
    }
    fetchGeoJSON();
  }, [dn]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col gap-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/citizen/tax-status"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-all font-medium text-sm bg-white hover:bg-slate-50 px-4 py-2 rounded-full border border-slate-200 shadow-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              ></path>
            </svg>
            กลับสู่หน้ารายการ
          </Link>

          <div className="flex flex-col items-end">
            <h1 className="text-xl font-bold font-sans text-slate-800 tracking-tight">
              แผนที่ดิจิทัล
            </h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide">
              Digital Map (GeoJSON / SHP Viewer)
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50 rounded-full translate-x-1/2 -translate-y-1/2 opacity-60 blur-3xl shrink-0 pointer-events-none"></div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                ></path>
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">
                รายละเอียดแปลงที่ดิน
              </p>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                โฉนดเลขที่ {dn || "ไม่ระบุ"}
              </h2>
              <p className="text-xs text-slate-500">หมายเลขแปลง {ln || "-"}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1 items-end relative z-10 shrink-0">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-slate-600 text-[10px] font-bold shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              ระบบพร้อมใช้งาน (OpenLayers + Google Maps)
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 min-h-[500px] relative">
          <WebMap
            title={`โฉนดเลขที่ ${dn}`}
            description={ln ? `หมายเลขแปลง: ${ln}` : "ข้อมูลแผนที่ภูมิศาสตร์"}
            geojsonData={geojsonData}
          />
        </div>

        {/* Footer info */}
        <p className="text-center text-[10px] text-slate-400 font-medium">
          * แสดงตำแหน่งโดยประมาณตามพิกัดจุดกึ่งกลางแปลงที่ดิน และเส้นขอบรูปแปลง
          (ถ้ามีข้อมูล GeoJSON)
        </p>
      </div>
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
          กำลังโหลดระบบ...
        </div>
      }
    >
      <MapContent />
    </Suspense>
  );
}
