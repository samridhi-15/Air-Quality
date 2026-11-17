export interface Pollutant {
  name: string;
  value: number;
  unit: string;
  color: string;
}

export interface AirQualityData {
  aqi: number;
  category: string;
  color: string;
  dominantPollutant: string;
  pollutants: Pollutant[];
  location: string;
  lat: number;
  lng: number;
  timestamp: string;
}

const AQI_LEVELS: { max: number; category: string; color: string }[] = [
  { max: 50, category: "Good", color: "#009966" },
  { max: 100, category: "Moderate", color: "#FFDE33" },
  { max: 150, category: "Unhealthy for Sensitive Groups", color: "#FF9933" },
  { max: 200, category: "Unhealthy", color: "#CC0033" },
  { max: 300, category: "Very Unhealthy", color: "#660099" },
  { max: Infinity, category: "Hazardous", color: "#7E0023" },
];

const POLLUTANT_COLORS: Record<string, string> = {
  "PM2.5": "#CC0033",
  "PM10": "#FF9933",
  "O3": "#9933FF",
  "NO2": "#3399FF",
  "SO2": "#FFCC00",
  "CO": "#996600",
};

// City database for mock data (real cities with their typical AQI patterns)
const CITY_DATABASE: Record<string, {lat: number; lng: number; basePM25: number; name: string}> = {
  "Delhi": { lat: 28.6139, lng: 77.209, basePM25: 85, name: "Delhi, India" },
  "Mumbai": { lat: 19.076, lng: 72.8777, basePM25: 75, name: "Mumbai, India" },
  "Kolkata": { lat: 22.5726, lng: 88.3639, basePM25: 65, name: "Kolkata, West Bengal" },
  "Howrah": { lat: 22.5958, lng: 88.2636, basePM25: 70, name: "Howrah, West Bengal" },
  "Durgapur": { lat: 23.4824, lng: 87.3119, basePM25: 55, name: "Durgapur, West Bengal" },
  "Asansol": { lat: 23.6739, lng: 86.9524, basePM25: 60, name: "Asansol, West Bengal" },
  "Siliguri": { lat: 26.7271, lng: 88.3953, basePM25: 40, name: "Siliguri, West Bengal" },
  "Malda": { lat: 25.0119, lng: 88.1464, basePM25: 45, name: "Malda, West Bengal" },
  "Baharampur": { lat: 24.0982, lng: 88.2557, basePM25: 42, name: "Baharampur, West Bengal" },
  "Kharagpur": { lat: 22.3460, lng: 87.2320, basePM25: 50, name: "Kharagpur, West Bengal" },
  "Haldia": { lat: 22.0258, lng: 88.0625, basePM25: 58, name: "Haldia, West Bengal" },
  "Raiganj": { lat: 25.6218, lng: 88.1243, basePM25: 35, name: "Raiganj, West Bengal" },
  "Kalyani": { lat: 22.9750, lng: 88.4375, basePM25: 48, name: "Kalyani, West Bengal" },
};

// US EPA Air Quality Index for PM2.5 (24-hour average, µg/m³)
// Piecewise linear formula with official breakpoints
function getAQI(pm25: number): number {
  const c = Math.max(0, Math.min(500, pm25));
  const breakpoints: [number, number, number, number][] = [
    [0, 0, 50, 12.0],
    [51, 100, 12.1, 35.4],
    [101, 150, 35.5, 55.4],
    [151, 200, 55.5, 150.4],
    [201, 300, 150.5, 250.4],
    [301, 500, 250.5, 500.4],
  ];
  for (const [aqiLow, aqiHigh, cLow, cHigh] of breakpoints) {
    if (c <= cHigh) {
      return Math.round(((aqiHigh - aqiLow) / (cHigh - cLow)) * (c - cLow) + aqiLow);
    }
  }
  return 500;
}

function getAQICategory(aqi: number) {
  for (const level of AQI_LEVELS) {
    if (aqi <= level.max) return level;
  }
  return AQI_LEVELS[AQI_LEVELS.length - 1];
}

function getDominantPollutant(pollutants: Pollutant[]): string {
  const sorted = [...pollutants].sort((a, b) => b.value - a.value);
  return sorted[0]?.name || "PM2.5";
}

// Generate realistic pollution values based on base PM2.5
// Uses consistent ratios (no random variation) so data is stable
function generatePollutants(basePM25: number): Pollutant[] {
  const pm25 = Math.round(basePM25);
  const pm10 = Math.round(pm25 * 1.6);
  const o3 = Math.round(Math.max(5, pm25 * 0.4));
  const no2 = Math.round(Math.max(2, pm25 * 0.5));
  const so2 = Math.round(Math.max(1, pm25 * 0.2));
  const co = Math.round((pm25 * 0.015) * 100) / 100;

  return [
    { name: "PM2.5", value: pm25, unit: "µg/m³", color: POLLUTANT_COLORS["PM2.5"] },
    { name: "PM10", value: pm10, unit: "µg/m³", color: POLLUTANT_COLORS["PM10"] },
    { name: "O3", value: o3, unit: "µg/m³", color: POLLUTANT_COLORS["O3"] },
    { name: "NO2", value: no2, unit: "µg/m³", color: POLLUTANT_COLORS["NO2"] },
    { name: "SO2", value: so2, unit: "µg/m³", color: POLLUTANT_COLORS["SO2"] },
    { name: "CO", value: co, unit: "mg/m³", color: POLLUTANT_COLORS["CO"] },
  ];
}

export async function fetchAirQuality(
  lat: number,
  lng: number,
  locationName: string
): Promise<AirQualityData> {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  const endpoint = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lng}&appid=${apiKey}`;

  let pm25 = 25;
  let realDataFetched = false;
  let rawPollutants: { name: string; value: number; unit: string }[] = [];

  // Try to fetch real data if API key is available
  if (apiKey) {
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        const list = json.list?.[0];
        if (list) {
          pm25 = list.components.pm2_5 || pm25;
          rawPollutants = [
            { name: "PM2.5", value: list.components.pm2_5 || 0, unit: "µg/m³" },
            { name: "PM10", value: list.components.pm10 || 0, unit: "µg/m³" },
            { name: "O3", value: list.components.o3 || 0, unit: "µg/m³" },
            { name: "NO2", value: list.components.no2 || 0, unit: "µg/m³" },
            { name: "SO2", value: list.components.so2 || 0, unit: "µg/m³" },
            { name: "CO", value: list.components.co || 0, unit: "µg/m³" },
          ];
          realDataFetched = true;
        }
      }
    } catch {
      // fall back to mock data
    }
  }

  // Use city database if real data wasn't fetched
  if (!realDataFetched) {
    pm25 = getPM25ForLocation(locationName, lat, lng);
  }

  // Extract city name for display
  const displayName = locationName || "Selected Location";

  // Build pollutants list (use real API data or generate from PM2.5)
  const pollutants: Pollutant[] = realDataFetched
    ? rawPollutants.map((p) => ({
        name: p.name,
        value: Math.round(p.value * 100) / 100,
        unit: p.unit,
        color: POLLUTANT_COLORS[p.name] || "#777",
      }))
    : generatePollutants(pm25);

  const aqi = getAQI(pm25);
  const level = getAQICategory(aqi);

  return {
    aqi,
    category: level.category,
    color: level.color,
    dominantPollutant: getDominantPollutant(pollutants),
    pollutants,
    location: displayName,
    lat,
    lng,
    timestamp: new Date().toISOString(),
  };
}

// Get PM2.5 value based on location name or coordinates
function getPM25ForLocation(locationName: string, lat: number, lng: number): number {
  // First try exact city match
  for (const [key, city] of Object.entries(CITY_DATABASE)) {
    if (locationName.toLowerCase().includes(key.toLowerCase())) {
      return city.basePM25;
    }
  }

  // Try coordinate-based lookup
  for (const city of Object.values(CITY_DATABASE)) {
    const dist = Math.abs(city.lat - lat) + Math.abs(city.lng - lng);
    if (dist < 2) {
      return city.basePM25;
    }
  }

  // Fallback: generate based on coordinates (stable per location)
  const hash = Math.abs(Math.sin(lat * 12.9898 + lng * 78.233) * 43758.5453);
  return Math.round(10 + (hash % 60));
}

// For search functionality - returns coordinates for a location name
export async function geocodeLocation(query: string): Promise<{lat: number; lng: number; name: string} | null> {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  if (!apiKey) {
    // Return mock coordinates based on city database
    const city = CITY_DATABASE[query as keyof typeof CITY_DATABASE];
    return city ? { lat: city.lat, lng: city.lng, name: city.name } : null;
  }

  try {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${apiKey}`;
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data.length > 0) {
        return {
          lat: data[0].lat,
          lng: data[0].lon,
          name: data[0].name || query,
        };
      }
    }
  } catch {
    // fall back to mock data
  }

  return null;
}

export function getAQIFromPM25(pm25: number): number {
  return getAQI(pm25);
}

export function getAQICategoryFromAQI(aqi: number) {
  return getAQICategory(aqi);
}

export function getPollutantColor(pollutantName: string): string {
  return POLLUTANT_COLORS[pollutantName] || "#777";
}