"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export type Pin = {
  id: number;
  lat: number;
  lng: number;
  name: string;
};

type MapComponentProps = {
  pins: Pin[];
  onMapClick: (lat: number, lng: number) => void;
  onRemovePin: (id: number) => void;
  center?: [number, number];
  zoom?: number;
};

function ClickHandler({
  onMapClick,
}: {
  onMapClick?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Hide Leaflet attribution control after map loads
function HideAttribution() {
  const map = useMap();
  useEffect(() => {
    const removeAttribution = () => {
      const attribution = map.getContainer().querySelector(".leaflet-control-attribution");
      if (attribution) {
        (attribution as HTMLElement).style.display = "none";
      }
    };
    // Run immediately and after a short delay to catch dynamic creation
    removeAttribution();
    const timer = setTimeout(removeAttribution, 500);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

// Fly the map to new center/zoom when props change
function FlyTo({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (center && zoom) {
      map.flyTo(center, zoom, { duration: 0.8 });
    }
  }, [map, center, zoom]);
  return null;
}

export default function MapComponent({
  pins,
  onMapClick,
  onRemovePin,
  center = [40.7128, -74.006],
  zoom = 6,
}: MapComponentProps) {
  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          maxZoom={19}
          attribution='&copy; <a href="https://www.google.com/maps">Google</a>'
        />
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}"
          maxZoom={19}
          opacity={0.3}
          attribution='&copy; <a href="https://www.google.com/maps">Google</a>'
        />
        <ClickHandler onMapClick={onMapClick} />
        <FlyTo center={center} zoom={zoom} />
        <HideAttribution />
        {(pins || []).map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={redIcon}
            eventHandlers={{ click: () => onRemovePin(p.id) }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold text-sky-800">{p.name}</div>
                <div className="text-xs text-sky-600">
                  Lat: {p.lat.toFixed(4)} | Lng: {p.lng.toFixed(4)}
                </div>
                <div className="mt-1 text-[10px] text-sky-500">
                  Click marker to remove
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}