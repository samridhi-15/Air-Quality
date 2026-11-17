"use client";

import { useState } from "react";
import { geocodeLocation } from "@/lib/aqi";

interface SearchBarProps {
  onSearch: (lat: number, lng: number, name: string) => void;
}

const SUGGESTED_CITIES = [
  "Delhi", "Mumbai",
  "Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri",
  "Malda", "Baharampur", "Kharagpur", "Haldia", "Raiganj",
  "Kalyani"
];

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!query.trim()) return;

    const geo = await geocodeLocation(query);
    if (geo) {
      onSearch(geo.lat, geo.lng, geo.name);
    }
    setShowResults(false);
  }

  async function selectCity(city: string) {
    setQuery(city);
    const geo = await geocodeLocation(city);
    if (geo) {
      onSearch(geo.lat, geo.lng, geo.name);
    }
    setShowResults(false);
  }

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          placeholder="Search for a city or location..."
          className="w-full rounded-full border border-sky-300 bg-white/95 px-5 py-2.5 text-sm text-sky-800 placeholder:text-sky-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          style={{ minWidth: "200px" }}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <svg
            className="w-5 h-5 text-sky-500 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white/95 backdrop-blur-sm shadow-lg border border-sky-200 rounded-xl">
          <div className="px-3 py-2 text-xs font-medium text-sky-500 uppercase tracking-wide">
            Suggested cities
          </div>
          {SUGGESTED_CITIES.map((city) => (
            <button
              key={city}
              className="w-full px-4 py-2 text-left text-sm hover:bg-sky-50 border-b border-sky-100 last:border-0"
              onMouseDown={() => selectCity(city)}
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}