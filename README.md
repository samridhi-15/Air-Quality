# Real-Time Urban Air Quality Monitoring

A full-screen interactive map application for monitoring real-time air quality and pollution sources across major Indian cities (Delhi, Mumbai, and 11 West Bengal cities).

## Features

- **Full-screen Google Maps** with clean UI (no zoom controls, no attribution)
- **Real-time air quality data** from OpenWeatherMap API
- **AI-powered pollution analysis** via Groq (qwen/qwen3.8-27b)
- **Single red pin** marks searched/clicked locations
- **Search bar** with 13 preset cities (Delhi, Mumbai, 11 West Bengal cities)
- **AQI card** showing EPA-calculated AQI, pollutant breakdown, health advice, and pollution sources

## Cities Supported

| City | State/Region |
|------|-------------|
| Delhi | Delhi |
| Mumbai | Maharashtra |
| Kolkata | West Bengal |
| Howrah | West Bengal |
| Durgapur | West Bengal |
| Asansol | West Bengal |
| Siliguri | West Bengal |
| Malda | West Bengal |
| Baharampur | West Bengal |
| Kharagpur | West Bengal |
| Haldia | West Bengal |
| Raiganj | West Bengal |
| Kalyani | West Bengal |

## Tech Stack

- **Framework**: Next.js 16 (Pages Router)
- **Map**: React Leaflet + Google Maps tiles
- **Styling**: Tailwind CSS (Sky blue / white theme)
- **Animations**: Framer Motion
- **API**: OpenWeatherMap Air Pollution API
- **AI**: Groq (qwen/qwen3.8-27b)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd air-quality-app
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and add your API keys:

```bash
cp .env.example .env.local
```

Required keys:
- `OPENWEATHER_API_KEY` - Get from [OpenWeatherMap](https://openweathermap.org/api)
- `NEXT_PUBLIC_OPENWEATHER_API_KEY` - Same as above (for client-side geocoding)
- `GROQ_API_KEY` - Get from [Groq Console](https://console.groq.com/)

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard:
   - `OPENWEATHER_API_KEY`
   - `NEXT_PUBLIC_OPENWEATHER_API_KEY`
   - `GROQ_API_KEY`
4. Deploy

### Docker

```bash
docker build -t air-quality-app .
docker run -p 3000:3000 air-quality-app
```

## Project Structure

```
air-quality-app/
├── src/
│   ├── components/
│   │   ├── MapComponent.tsx      # Full-screen map with red pins
│   │   ├── SearchBar.tsx         # City search with suggestions
│   │   └── AirQualityCard.tsx    # AQI details + AI analysis
│   ├── lib/
│   │   └── aqi.ts                # AQI calculation + data fetching
│   ├── pages/
│   │   ├── index.tsx             # Main page
│   │   ├── _app.tsx              # App wrapper
│   │   ├── _document.tsx         # HTML document (Leaflet CSS)
│   │   └── api/
│   │       └── analyze.ts        # Groq AI analysis endpoint
│   └── styles/
│       └── globals.css           # Tailwind + theme
├── .env.example
├── .gitignore
├── next.config.ts
├── package.json
├── README.md
└── tsconfig.json
```

## API Endpoints

### POST /api/analyze
Analyzes air quality data using Groq AI.

**Request:**
```json
{
  "location": "Kolkata",
  "aqi": 156,
  "category": "Unhealthy",
  "dominantPollutant": "PM2.5",
  "pollutants": [
    { "name": "PM2.5", "value": 132, "unit": "µg/m³" },
    { "name": "PM10", "value": 152, "unit": "µg/m³" }
  ]
}
```

**Response:**
```json
{
  "summary": "Air quality in Kolkata is currently Unhealthy...",
  "healthAdvice": "Sensitive groups should avoid prolonged outdoor exertion...",
  "pollutionSources": ["Vehicle emissions", "Industrial activities", "Construction dust"],
  "riskLevel": "moderate"
}
```

## License

MIT