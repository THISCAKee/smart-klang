"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const MapInner = dynamic(() => import("./MapInner"), { 
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-slate-100 flex items-center justify-center rounded-2xl">กำลังโหลดระบบแผนที่...</div> 
});

interface WebMapProps {
  center?: [number, number];
  zoom?: number;
  geojsonData?: any;
  title?: string;
  description?: string;
}

export default function WebMap(props: WebMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return <div className="absolute inset-0 bg-slate-100 flex items-center justify-center rounded-2xl">กำลังเตรียมระบบแผนที่...</div>;

  return <MapInner {...props} />;
}
