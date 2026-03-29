"use client";

import { useEffect, useRef } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSONFormat from "ol/format/GeoJSON";
import { Style, Fill, Stroke } from "ol/style";
import { fromLonLat } from "ol/proj";

interface MapInnerProps {
  center?: [number, number]; // [lat, lng]
  zoom?: number;
  geojsonData?: any;
  title?: string;
  description?: string;
}

export default function MapInner({
  center = [12.786, 101.652],
  zoom = 16,
  geojsonData,
  title = "ตำแหน่งแปลงที่ดิน",
  description,
}: MapInnerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) return;

    // Convert center from [lat, lng] to [lng, lat] for OpenLayers then project
    const olCenter = fromLonLat([center[1], center[0]]);

    // Google Maps Satellite/Hybrid Base Map
    const satelliteLayer = new TileLayer({
      source: new XYZ({
        url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
        maxZoom: 20,
        attributions: '&copy; Google Maps',
      }),
    });

    const vectorSource = new VectorSource();
    vectorSourceRef.current = vectorSource;

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        stroke: new Stroke({
          color: "#4f46e5",
          width: 3,
        }),
        fill: new Fill({
          color: "rgba(79, 70, 229, 0.2)",
        }),
      }),
    });

    const map = new Map({
      target: mapRef.current,
      layers: [satelliteLayer, vectorLayer],
      view: new View({
        center: olCenter,
        zoom: zoom,
      }),
    });

    mapInstanceRef.current = map;

    return () => {
      map.setTarget(undefined);
      mapInstanceRef.current = null;
    };
  }, [center, zoom]);

  useEffect(() => {
    if (geojsonData && vectorSourceRef.current && mapInstanceRef.current) {
      const source = vectorSourceRef.current;
      source.clear();

      try {
        const format = new GeoJSONFormat();
        // Since the data was already projected to WGS84 (EPSG:4326) in page.tsx
        const features = format.readFeatures(geojsonData, {
          dataProjection: "EPSG:4326",
          featureProjection: "EPSG:3857",
        });

        if (features.length > 0) {
          source.addFeatures(features);
          // Auto-zoom to features
          const extent = source.getExtent();
          if (extent) {
            mapInstanceRef.current.getView().fit(extent, {
              padding: [50, 50, 50, 50],
              duration: 800,
              maxZoom: 20
            });
          }
        }
      } catch (e) {
        console.error("OpenLayers GeoJSON parsing error:", e);
      }
    }
  }, [geojsonData]);

  return (
    <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-slate-50">
      <div ref={mapRef} style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, outline: "none" }} />

      {/* Label Overlay */}
      <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl border border-slate-100 max-w-[240px] pointer-events-none">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          {title}
        </h3>
        {description && (
          <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
