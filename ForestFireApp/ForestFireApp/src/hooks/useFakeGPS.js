import { useState, useEffect } from "react";

// Fallback if browser denies location — Kuala Lumpur city centre
const FALLBACK = { lat: 3.1390, lng: 101.6869 };

// Offset for device_02 (~400m north-east of device_01)
const OFFSET = { lat: 0.0036, lng: 0.0042 };

export function useFakeGPS() {
  const [base, setBase] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setBase(FALLBACK);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => setBase({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()  => setBase(FALLBACK),
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  if (!base) return null; // still loading

  return {
    device_01: { lat: base.lat,              lng: base.lng },
    device_02: { lat: base.lat + OFFSET.lat, lng: base.lng + OFFSET.lng },
  };
}
