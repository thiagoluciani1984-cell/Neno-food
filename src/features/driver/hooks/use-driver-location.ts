"use client";

import { useEffect } from "react";
import { reportDriverLocationAction } from "../actions";

export function useDriverLocation(orderId: string | null, enabled: boolean) {
  useEffect(() => {
    if (!orderId || !enabled || !navigator.geolocation) return;

    const report = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          void reportDriverLocationAction(
            orderId,
            pos.coords.latitude,
            pos.coords.longitude
          );
        },
        () => {
          // ignore geolocation errors silently
        },
        { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 }
      );
    };

    report();
    const interval = window.setInterval(report, 20000);
    return () => window.clearInterval(interval);
  }, [orderId, enabled]);
}
