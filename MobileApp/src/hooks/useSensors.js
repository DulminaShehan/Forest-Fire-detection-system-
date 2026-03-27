import { useEffect, useRef, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";

export function useSensors(deviceId = "device_01") {
  const [data,     setData]     = useState(null);
  const [online,   setOnline]   = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const lastSeenRef = useRef(null);

  useEffect(() => {
    const unsub = onValue(ref(db, `devices/${deviceId}`), snap => {
      const d = snap.val();
      if (d) {
        const now = new Date();
        setData(d);
        setOnline(true);
        setLastSeen(now);
        lastSeenRef.current = now;
      }
    });

    const timer = setInterval(() => {
      if (lastSeenRef.current && (new Date() - lastSeenRef.current) > 15000) {
        setOnline(false);
      }
    }, 3000);

    return () => { unsub(); clearInterval(timer); };
  }, [deviceId]);

  return { data, online, lastSeen };
}
