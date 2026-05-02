"use client";

import dynamic from "next/dynamic";

const MapInner = dynamic(() => import("./MapInner"), { 
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-slate-100 flex items-center justify-center rounded-2xl">กำลังโหลดระบบแผนที่...</div> 
});

type GeoJsonData = Record<string, unknown>;

interface WebMapProps {
  center?: [number, number];
  zoom?: number;
  geojsonData?: GeoJsonData;
  title?: string;
  description?: string;
}

export default function WebMap(props: WebMapProps) {
  return <MapInner {...props} />;
}
