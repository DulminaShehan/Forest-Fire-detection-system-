import { useState, useEffect } from "react";
import * as Location from "expo-location";

// Fallback if permission denied — Kuala Lumpur city centre
const FALLBACK = { lat: 3.1390, lng: 101.6869 };

// Offset for device_02 (~400m north-east of device_01)
const OFFSET = { lat: 0.0036, lng: 0.0042 };

export function useFakeGPS() {
  const [base, setBase] = useState(null);

  useEffect(() => {
    async function fetch() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") { setBase(FALLBACK); return; }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setBase({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      } catch {
        setBase(FALLBACK);
      }
    }
    fetch();
  }, []);

  if (!base) return null; // still loading

  return {
    device_01: { lat: base.lat,              lng: base.lng },
    device_02: { lat: base.lat + OFFSET.lat, lng: base.lng + OFFSET.lng },
  };
}
