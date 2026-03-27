import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Inject pulse keyframe once
const STYLE_ID = "fire-map-style";
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = `
    @keyframes mapPing {
      0%   { transform: scale(1);   opacity: 0.85; }
      70%  { transform: scale(2.8); opacity: 0;    }
      100% { transform: scale(2.8); opacity: 0;    }
    }
    .map-ping { animation: mapPing 1.1s cubic-bezier(0,0,0.2,1) infinite; }
  `;
  document.head.appendChild(el);
}

function makeIcon(fire) {
  injectStyles();
  const color = fire ? "#ef4444" : "#3b82f6";
  const glow  = fire ? "rgba(239,68,68,0.55)" : "rgba(59,130,246,0.45)";
  const emoji = fire ? "🔥" : "📡";
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:44px;height:44px;">
        <div class="map-ping" style="
          position:absolute;inset:0;border-radius:50%;background:${glow};
        "></div>
        <div style="
          position:absolute;top:10px;left:10px;width:24px;height:24px;
          border-radius:50%;background:${color};border:2.5px solid #fff;
          box-shadow:0 0 12px ${glow};
          display:flex;align-items:center;justify-content:center;font-size:13px;
        ">${emoji}</div>
      </div>`,
    iconSize:   [44, 44],
    iconAnchor: [22, 22],
  });
}

export default function FireMap({ lat, lng, deviceId, fire, dark }) {
  const divRef    = useRef(null);
  const mapRef    = useRef(null);
  const markerRef = useRef(null);
  const tileRef   = useRef(null);

  // Initialise map once
  useEffect(() => {
    if (!divRef.current || mapRef.current) return;
    mapRef.current = L.map(divRef.current, {
      zoomControl:       false,
      scrollWheelZoom:   false,
      attributionControl: false,
      dragging:          false,
    }).setView([lat, lng], 15);

    const tileUrl = dark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    tileRef.current = L.tileLayer(tileUrl).addTo(mapRef.current);

    markerRef.current = L.marker([lat, lng], { icon: makeIcon(fire) })
      .addTo(mapRef.current);

    return () => {
      mapRef.current.remove();
      mapRef.current    = null;
      markerRef.current = null;
    };
  }, []); // eslint-disable-line

  // Update marker when fire / position changes
  useEffect(() => {
    if (!mapRef.current) return;
    if (markerRef.current) markerRef.current.remove();
    markerRef.current = L.marker([lat, lng], { icon: makeIcon(fire) })
      .addTo(mapRef.current);
    mapRef.current.setView([lat, lng], 15);
  }, [lat, lng, fire]);

  // Swap tile layer on dark mode toggle
  useEffect(() => {
    if (!mapRef.current || !tileRef.current) return;
    tileRef.current.remove();
    const tileUrl = dark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    tileRef.current = L.tileLayer(tileUrl).addTo(mapRef.current);
  }, [dark]);

  const labelBg = fire ? "rgba(239,68,68,0.92)" : "rgba(59,130,246,0.88)";
  const label   = fire
    ? `🔥 ${deviceId.replace("_", " ").toUpperCase()} — FIRE LOCATION`
    : `📡 ${deviceId.replace("_", " ").toUpperCase()} — DEVICE LOCATION`;

  return (
    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", height: 220 }}>
      <div ref={divRef} style={{ height: "100%", width: "100%" }} />
      <div style={{
        position: "absolute", bottom: 10, left: 10, zIndex: 1000,
        background: labelBg, color: "#fff",
        borderRadius: 8, padding: "4px 10px",
        fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        pointerEvents: "none",
      }}>
        {label}
      </div>
    </div>
  );
}
