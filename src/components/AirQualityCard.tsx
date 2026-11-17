"use client";

import { AirQualityData } from "@/lib/aqi";
import { useEffect, useState } from "react";

interface AnalysisResult {
  summary: string;
  healthAdvice: string;
  pollutionSources: string[];
  riskLevel: "low" | "moderate" | "high" | "severe";
}

interface AirQualityCardProps {
  data: AirQualityData | null;
}

export default function AirQualityCard({ data }: AirQualityCardProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!data) {
      setAnalysis(null);
      return;
    }

    const currentData = data;
    async function fetchAnalysis() {
      setLoading(true);
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: currentData.location,
            aqi: currentData.aqi,
            category: currentData.category,
            dominantPollutant: currentData.dominantPollutant,
            pollutants: currentData.pollutants,
          }),
        });
        if (res.ok) setAnalysis(await res.json());
      } catch {
        // ignore errors
      } finally {
        setLoading(false);
      }
    }

    fetchAnalysis();
  }, [data]);

  if (!data) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-lg border border-sky-200">
        <h3 className="text-lg font-semibold text-sky-800">Air Quality Details</h3>
        <p className="mt-2 text-sky-600">Select a location to view air quality data.</p>
      </div>
    );
  }

  const aqiColors = {
    Good: "bg-green-100 text-green-800",
    Moderate: "bg-yellow-100 text-yellow-800",
    "Unhealthy for Sensitive Groups": "bg-orange-100 text-orange-800",
    Unhealthy: "bg-red-100 text-red-800",
    "Very Unhealthy": "bg-purple-100 text-purple-800",
    Hazardous: "bg-red-900 text-red-100",
  };

  const riskColors = {
    low: "bg-green-500",
    moderate: "bg-yellow-500",
    high: "bg-orange-500",
    severe: "bg-red-500",
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-lg border border-sky-200">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-sky-800">Air Quality Details</h3>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            aqiColors[data.category as keyof typeof aqiColors] || aqiColors.Moderate
          }`}
        >
          AQI: {data.aqi}
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm text-sky-600">Location</p>
            <p className="font-medium text-sky-800">{data.location}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-sky-600">Category</p>
            <p className="font-medium text-sky-800">{data.category}</p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm text-sky-700">
          <span className="font-medium">Dominant Pollutant:</span>{" "}
          <span className="text-sky-600">{data.dominantPollutant}</span>
        </p>
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-medium text-sky-800">Pollutants</h4>
        <div className="mt-2 space-y-2">
          {data.pollutants.map((p) => (
            <div key={p.name} className="flex items-center justify-between">
              <span className="text-sm text-sky-700">{p.name}</span>
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-12 rounded-full ${p.color}`}
                  style={{ opacity: 0.7 }}
                ></div>
                <span className="text-sm font-medium text-sky-800">
                  {p.value} {p.unit}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {loading && (
        <div className="mt-4">
          <p className="text-sm text-sky-600">Analyzing pollution sources...</p>
        </div>
      )}

      {analysis && (
        <div className="mt-4 rounded-lg bg-sky-50 p-4 border border-sky-200">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${riskColors[analysis.riskLevel]}`}
            />
            <p className="text-sm font-medium text-sky-800">AI Analysis</p>
          </div>

          <p className="mt-2 text-sm text-sky-700">{analysis.summary}</p>

          <div className="mt-3">
            <p className="text-xs font-medium text-sky-600">Health Advice</p>
            <p className="text-xs text-sky-700">{analysis.healthAdvice}</p>
          </div>

          <div className="mt-3">
            <p className="text-xs font-medium text-sky-600">Likely Sources</p>
            <ul className="text-xs text-sky-700 space-y-1">
              {analysis.pollutionSources.map((src, i) => (
                <li key={i} className="flex items-center">
                  <span className="text-sky-500 mr-1">•</span>
                  <span>{src}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}