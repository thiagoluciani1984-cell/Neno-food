"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface LatLng {
  lat: number;
  lng: number;
}

const driverIcon = L.divIcon({
  className: "",
  html: `<div style="
    display:flex;align-items:center;justify-content:center;
    width:38px;height:38px;border-radius:9999px;
    background:#F97316;box-shadow:0 4px 12px rgba(0,0,0,.35);
    border:3px solid white;font-size:18px;
  ">🛵</div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

const destinationIcon = L.divIcon({
  className: "",
  html: `<div style="
    display:flex;align-items:center;justify-content:center;
    width:32px;height:32px;border-radius:9999px;
    background:#1C1917;box-shadow:0 4px 12px rgba(0,0,0,.35);
    border:3px solid white;font-size:16px;
  ">🏠</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

/** Interpolates the marker's position smoothly instead of snapping on each GPS ping. */
function useAnimatedLatLng(targetLat: number, targetLng: number): LatLng {
  const [pos, setPos] = useState({ lat: targetLat, lng: targetLng });
  const frameRef = useRef<number | null>(null);
  const fromRef = useRef({ lat: targetLat, lng: targetLng });

  useEffect(() => {
    const from = fromRef.current;
    const to = { lat: targetLat, lng: targetLng };
    if (from.lat === to.lat && from.lng === to.lng) return;

    const duration = 1200;
    const start = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setPos({
        lat: from.lat + (to.lat - from.lat) * eased,
        lng: from.lng + (to.lng - from.lng) * eased,
      });
      if (t < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [targetLat, targetLng]);

  return pos;
}

function FitBoundsOnce({ points }: { points: LatLng[] }) {
  const map = useMap();
  const fittedRef = useRef(false);

  useEffect(() => {
    if (fittedRef.current || points.length < 1) return;
    fittedRef.current = true;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 15);
    } else {
      map.fitBounds(
        points.map((p) => [p.lat, p.lng]),
        { padding: [48, 48], maxZoom: 16 }
      );
    }
  }, [map, points]);

  return null;
}

export function LiveDeliveryMap({
  driverPosition,
  destination,
}: {
  driverPosition: LatLng;
  destination: LatLng | null;
}) {
  const animatedDriverPos = useAnimatedLatLng(driverPosition.lat, driverPosition.lng);
  const points = destination ? [driverPosition, destination] : [driverPosition];

  return (
    <MapContainer
      center={[driverPosition.lat, driverPosition.lng]}
      zoom={15}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
      attributionControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBoundsOnce points={points} />
      <Marker position={[animatedDriverPos.lat, animatedDriverPos.lng]} icon={driverIcon} />
      {destination && (
        <Marker position={[destination.lat, destination.lng]} icon={destinationIcon} />
      )}
    </MapContainer>
  );
}
