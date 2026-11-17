"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import AirQualityCard from "@/components/AirQualityCard";
import SearchBar from "@/components/SearchBar";
import { fetchAirQuality, AirQualityData } from "@/lib/aqi";
import { AnimatePresence, motion } from "framer-motion";
import { Pin } from "@/components/MapComponent";

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-sky-100 text-sky-500">
      Loading map...
    </div>
  ),
});

export default function Home() {
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.006]);
  const [mapZoom, setMapZoom] = useState<number>(6);

  async function fetchAQI(lat: number, lng: number, name: string) {
    try {
      const data = await fetchAirQuality(lat, lng, name);
      setAirQuality(data);
    } catch (err) {
      console.error("Failed to fetch air quality:", err);
    }
  }

  async function handleLocationSelect(lat: number, lng: number, name: string) {
    if (lat === 0 && lng === 0) return;

    const pin: Pin = {
      id: Date.now(),
      lat,
      lng,
      name: name || "Selected Location",
    };
    setPins([pin]);
    setMapCenter([lat, lng]);
    setMapZoom(10);

    await fetchAQI(lat, lng, name || "Selected Location");
  }

  async function handleMapClick(lat: number, lng: number) {
    let locationName = "Selected Location";
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`
      );
      const data = await res.json();
      if (data.address) {
        const city = data.address.city || data.address.town || data.address.village || "Selected Location";
        const country = data.address.country || "";
        locationName = country ? `${city}, ${country}` : city;
      }
    } catch {
      // Use default name
    }

    await handleLocationSelect(lat, lng, locationName);
  }

  async function handleRemovePin(id: number) {
    setPins([]);
    setAirQuality(null);
  }

  useEffect(() => {
    if (pins.length === 0) {
      handleLocationSelect(22.5726, 88.3639, "Kolkata, West Bengal");
    }
  }, []);

  return (
    <div className="fixed inset-0">
      {/* Top bar: header + search */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 left-0 right-0 z-[1000] pointer-events-none"
      >
        <div className="px-4 pt-4">
          <div className="pointer-events-auto inline-flex flex-col items-center gap-3">
            <div className="inline-flex items-center gap-3 rounded-full px-6 py-3 shadow-lg border border-sky-200 bg-gradient-to-r from-sky-50 to-white/95 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 p-2 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-lg font-bold text-sky-800 whitespace-nowrap bg-gradient-to-r from-sky-600 via-sky-800 to-sky-600 bg-clip-text text-transparent">
                  Real-Time Urban Air Quality Monitoring
                </h1>
              </div>
            </div>
            <div className="w-full max-w-md">
              <SearchBar onSearch={handleLocationSelect} />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Full-screen map centered on search */}
      <MapComponent
        pins={pins}
        onMapClick={handleMapClick}
        onRemovePin={handleRemovePin}
        center={mapCenter}
        zoom={mapZoom}
      />

      {/* Bottom-right: AQI card */}
      <AnimatePresence>
        {airQuality && (
          <motion.div
            key="aqi-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 right-4 z-[1000] w-[350px] max-w-[90vw]"
          >
            <AirQualityCard data={airQuality} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}