import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useSensors } from "../hooks/useSensors";
import { useFakeBattery } from "../hooks/useFakeBattery";
import { useFakeGPS } from "../hooks/useFakeGPS";
import SensorCard from "../components/SensorCard";
import FireMap from "../components/FireMap";

function flameLabel(v) {
  if (v == null) return "No Data";
  if (v > 3000)  return "No Fire";
  if (v > 2000)  return "Far";
  if (v > 1500)  return "Medium";
  if (v > 500)   return "Close";
  return "VERY CLOSE";
}

function flameLevel(v) {
  if (v == null) return "warn";
  if (v < 1500)  return "alert";
  if (v < 2000)  return "warn";
  return "safe";
}

function isFire(deviceData) {
  return (
    deviceData?.alerts?.fire === true ||
    deviceData?.sensors?.fire_confirmed === true
  );
}

// ── Hiker device card ──────────────────────────────────────────────
function HikerDeviceCard({ deviceId, deviceData, online, lastSeen, dark, fakeGps }) {
  const s    = deviceData?.sensors || {};
  const fire = isFire(deviceData);
  const rawG = deviceData?.gps || {};
  const mapLat = rawG.fixed ? Number(rawG.latitude)  : fakeGps?.lat;
  const mapLng = rawG.fixed ? Number(rawG.longitude) : fakeGps?.lng;
  const hasLocation = !!(mapLat && mapLng);

  const text   = dark ? "text-white"    : "text-gray-900";
  const textSm = dark ? "text-gray-400" : "text-gray-500";
  const card   = dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200";

  return (
    <div className={`rounded-2xl border p-4 space-y-4 ${card}`}>
      {/* Device header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📡</span>
          <span className={`font-bold text-sm ${text}`}>{deviceId.replace("_", " ").toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full ${online ? "bg-green-400" : "bg-red-400"}`}
            style={{ boxShadow: online ? "0 0 6px #4ade80" : "0 0 6px #f87171" }}
          />
          <span className={`text-xs ${textSm}`}>{online ? "Live" : "Offline"}</span>
          {lastSeen && <span className={`text-xs ${textSm}`}>· {lastSeen.toLocaleTimeString()}</span>}
        </div>
      </div>

      {/* Fire status */}
      <div className={`rounded-xl p-3 flex items-center gap-3 ${
        fire
          ? dark ? "bg-red-500/10 border border-red-500/50" : "bg-red-50 border border-red-300"
          : dark ? "bg-green-500/5 border border-green-500/30" : "bg-green-50 border border-green-200"
      }`}>
        <span className="text-2xl">{fire ? "🔥" : "✅"}</span>
        <div>
          <div className={`font-bold text-sm ${fire ? "text-red-500" : dark ? "text-green-400" : "text-green-600"}`}>
            {fire ? "FIRE DETECTED!" : "Area Safe"}
          </div>
          <div className={`text-xs ${textSm}`}>
            {fire ? "Leave the area immediately" : "No fire detected"}
          </div>
        </div>
      </div>

      {/* Weather grid */}
      <div className="grid grid-cols-3 gap-2">
        <SensorCard dark={dark} icon="🌡️" label="Temp"
          value={s.temperature != null ? s.temperature.toFixed(1) + "°" : "--"}
          sub="Celsius"
          level={s.temperature > 38 ? "warn" : "safe"}
        />
        <SensorCard dark={dark} icon="💧" label="Humidity"
          value={s.humidity != null ? s.humidity.toFixed(1) + "%" : "--"}
          sub="Relative"
          level={s.humidity > 85 ? "warn" : "safe"}
        />
        <SensorCard dark={dark} icon={s.is_raining ? "🌧️" : "☀️"} label="Rain"
          value={s.rain_percent != null ? s.rain_percent + "%" : "--"}
          sub={s.rain_status || "—"}
          level={s.is_raining ? "warn" : "safe"}
        />
      </div>

      {/* Device map */}
      {hasLocation && (
        <FireMap
          lat={mapLat}
          lng={mapLng}
          deviceId={deviceId}
          fire={fire}
          dark={dark}
        />
      )}
    </div>
  );
}

// ── Officer device section ─────────────────────────────────────────
function OfficerDeviceSection({ deviceId, deviceData, online, lastSeen, dark, fakeGps }) {
  const s = deviceData?.sensors || {};
  const b = useFakeBattery();
  const rawG = deviceData?.gps || {};
  // Use real GPS if fixed, otherwise fall back to fakeGps
  const g = rawG.fixed ? rawG : {};
  const mapLat = rawG.fixed ? Number(rawG.latitude)  : fakeGps?.lat;
  const mapLng = rawG.fixed ? Number(rawG.longitude) : fakeGps?.lng;
  const hasLocation = !!(mapLat && mapLng);
  const f        = s.flame           || {};
  const fire = isFire(deviceData);

  const text   = dark ? "text-white"    : "text-gray-900";
  const textSm = dark ? "text-gray-400" : "text-gray-500";
  const card   = dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200";

  return (
    <div className={`rounded-2xl border p-4 space-y-4 ${card}`}>
      {/* Device header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📡</span>
          <span className={`font-bold text-sm ${text}`}>{deviceId.replace("_", " ").toUpperCase()}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            fire
              ? "bg-red-500/20 text-red-400"
              : dark ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-700"
          }`}>{fire ? "🔥 FIRE" : "✅ Clear"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${online ? "bg-green-400" : "bg-red-400"}`}
            style={{ boxShadow: online ? "0 0 6px #4ade80" : "0 0 6px #f87171" }} />
          <span className={`text-xs ${textSm}`}>{online ? "Live" : "Offline"}</span>
          {lastSeen && <span className={`text-xs ${textSm}`}>· {lastSeen.toLocaleTimeString()}</span>}
        </div>
      </div>

      {/* Environment */}
      <div>
        <div className={`text-xs font-semibold uppercase tracking-widest mb-2 ${textSm}`}>Environment</div>
        <div className="grid grid-cols-3 gap-2">
          <SensorCard dark={dark} icon="🌡️" label="Temp"
            value={s.temperature != null ? s.temperature.toFixed(1) + "°" : "--"}
            sub="Celsius"
            level={s.temperature > 38 ? "warn" : "safe"}
          />
          <SensorCard dark={dark} icon="💧" label="Humidity"
            value={s.humidity != null ? s.humidity.toFixed(1) + "%" : "--"}
            sub="%"
            level={s.humidity > 85 ? "warn" : "safe"}
          />
          <SensorCard dark={dark} icon={s.is_raining ? "🌧️" : "☀️"} label="Rain"
            value={s.rain_percent != null ? s.rain_percent + "%" : "--"}
            sub={s.rain_status || "—"}
            level={s.is_raining ? "warn" : "safe"}
          />
        </div>
      </div>

      {/* Gas Sensors */}
      <div>
        <div className={`text-xs font-semibold uppercase tracking-widest mb-2 ${textSm}`}>Gas Sensors</div>
        <div className="grid grid-cols-3 gap-2">
          <SensorCard dark={dark} icon="💨" label="MQ-2 Smoke"
            value={s.mq2_raw ?? "--"}
            sub={s.mq2_status || "—"}
            level={s.mq2_raw > 2000 ? "alert" : s.mq2_raw > 1000 ? "warn" : "safe"}
          />
          <SensorCard dark={dark} icon="☁️" label="MQ-9 CO"
            value={s.mq9_raw ?? "--"}
            sub={s.mq9_status || "—"}
            level={s.mq9_raw > 2000 ? "alert" : s.mq9_raw > 1000 ? "warn" : "safe"}
          />
          <SensorCard dark={dark} icon={fire ? "🔥" : "✅"} label="Fire"
            value={fire ? "FIRE!" : "Clear"}
            sub="Flame sensors"
            level={fire ? "alert" : "safe"}
          />
        </div>
      </div>

      {/* Battery + GPS */}
      <div>
        <div className={`text-xs font-semibold uppercase tracking-widest mb-2 ${textSm}`}>System</div>
        <div className="grid grid-cols-2 gap-2">
          <SensorCard dark={dark} icon="🔋" label="Battery"
            value={online ? (b.percent != null ? b.percent + "%" : "--") : "0%"}
            sub={online ? (b.voltage != null ? b.voltage.toFixed(2) + "V · " + (b.status || "") : "—") : "Recharge"}
            level={!online ? "alert" : b.percent < 20 ? "alert" : b.percent < 40 ? "warn" : "safe"}
          />
          <SensorCard dark={dark} icon="📍" label="GPS"
            value={g.fixed ? "Fixed" : "Waiting"}
            sub={g.fixed
              ? `${g.satellites} sats · ${Number(g.latitude).toFixed(4)}, ${Number(g.longitude).toFixed(4)}`
              : `${g.satellites || 0} satellites`}
            level={g.fixed ? "safe" : "warn"}
          />
        </div>
      </div>

      {/* GPS Map Link */}
      {g.fixed && g.maps_link && (
        <a href={g.maps_link} target="_blank" rel="noopener noreferrer"
          className={`block rounded-xl border p-3 transition-all ${
            dark ? "border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10"
                 : "border-blue-200 bg-blue-50 hover:bg-blue-100"
          }`}>
          <div className="flex items-center gap-2">
            <span>🗺️</span>
            <span className={`text-xs font-semibold ${dark ? "text-blue-400" : "text-blue-700"}`}>
              {Number(g.latitude).toFixed(5)}, {Number(g.longitude).toFixed(5)}
            </span>
            <span className={`ml-auto text-sm ${dark ? "text-blue-400" : "text-blue-600"}`}>→</span>
          </div>
        </a>
      )}

      {/* Device Map — always visible when location available */}
      {hasLocation && (
        <FireMap
          lat={mapLat}
          lng={mapLng}
          deviceId={deviceId}
          fire={fire}
          dark={dark}
        />
      )}

      {/* Flame Sensors */}
      <div>
        <div className={`text-xs font-semibold uppercase tracking-widest mb-2 ${textSm}`}>
          Flame Sensors — 10 Zones
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {Array.from({ length: 10 }, (_, i) => {
            const key = "s" + (i + 1);
            const val = f[key];
            const lvl = flameLevel(val);
            return (
              <div key={key} className={`rounded-xl border p-2 text-center transition-all ${
                lvl === "alert" ? dark ? "border-red-500/50 bg-red-500/10"    : "border-red-300 bg-red-50"
              : lvl === "warn"  ? dark ? "border-amber-500/40 bg-amber-500/8" : "border-amber-200 bg-amber-50"
              :                   dark ? "border-gray-700 bg-gray-800/50"      : "border-gray-200 bg-white"
              }`}>
                <div className={`text-xs font-mono font-bold ${textSm}`}>S{i + 1}</div>
                <div className={`text-xs font-bold font-mono mt-0.5 ${
                  lvl === "alert" ? "text-red-500"
                : lvl === "warn"  ? "text-amber-500"
                : dark ? "text-gray-200" : "text-gray-700"
                }`}>{val ?? "??"}</div>
                <div className={`text-xs mt-0.5 leading-tight ${textSm}`}>{flameLabel(val)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sensor Fault Warning */}
      {(() => {
        const dead = Array.from({ length: 10 }, (_, i) => "s" + (i + 1)).filter(k => f[k] == null);
        return dead.length > 0 ? (
          <div className={`rounded-xl border p-3 flex items-start gap-2 ${
            dark ? "border-amber-500/40 bg-amber-500/8" : "border-amber-300 bg-amber-50"
          }`}>
            <span>⚠️</span>
            <div className={`text-xs ${dark ? "text-amber-400" : "text-amber-700"}`}>
              Zones {dead.map(k => k.toUpperCase()).join(", ")} not responding
            </div>
          </div>
        ) : null;
      })()}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────
export default function Dashboard() {
  const { user, profile, logout } = useAuth();
  const { dark, toggle }          = useTheme();
  const fakeGPS = useFakeGPS();
  const dev1 = useSensors("device_01");
  const dev2 = useSensors("device_02");
  const alarmRef   = useRef(null);
  const ctxRef     = useRef(null);
  const [alarmMuted, setAlarmMuted] = useState(false);

  const role = profile?.role || "hiker";

  // Fire state
  const fire1   = isFire(dev1.data);
  const fire2   = isFire(dev2.data);
  const anyFire = fire1 || fire2;

  // ── Offline popup alerts ──────────────────────────────────────────
  const [offlineAlerts, setOfflineAlerts] = useState([]);
  const prevOnline1 = useRef(null);
  const prevOnline2 = useRef(null);

  function addOfflineAlert(deviceLabel) {
    const id = Date.now();
    setOfflineAlerts(a => [...a, { id, deviceLabel }]);
    setTimeout(() => setOfflineAlerts(a => a.filter(x => x.id !== id)), 8000);
  }

  useEffect(() => {
    if (prevOnline1.current === true && dev1.online === false)
      addOfflineAlert("Device 01");
    prevOnline1.current = dev1.online;
  }, [dev1.online]);

  useEffect(() => {
    if (prevOnline2.current === true && dev2.online === false)
      addOfflineAlert("Device 02");
    prevOnline2.current = dev2.online;
  }, [dev2.online]);

  // Fire alarm — loud alternating two-tone siren
  useEffect(() => {
    if (!anyFire || alarmMuted) { alarmRef.current = false; return; }
    if (alarmRef.current) return;
    alarmRef.current = true;

    if (!ctxRef.current) {
      const AudioCtx = window.AudioContext || window["webkitAudioContext"];
      ctxRef.current = new AudioCtx();
    }

    // Resume context if suspended (browser policy)
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();

    let cycle = 0;
    const siren = () => {
      if (!alarmRef.current) return;
      const ctx  = ctxRef.current;
      const now  = ctx.currentTime;

      // Two oscillators detuned slightly for a thick siren sound
      [0, 5].forEach(detune => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sawtooth";

        // Alternates between high (960 Hz) and low (720 Hz) every half-cycle
        const hi = 960 + detune;
        const lo = 720 + detune;
        osc.frequency.setValueAtTime(cycle % 2 === 0 ? hi : lo, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.55, now + 0.05);
        gain.gain.setValueAtTime(0.55, now + 0.35);
        gain.gain.linearRampToValueAtTime(0, now + 0.45);

        osc.start(now);
        osc.stop(now + 0.45);
      });

      cycle++;
      setTimeout(siren, 500);
    };
    siren();
  }, [anyFire, alarmMuted]);

  // Reset mute when fire clears
  useEffect(() => {
    if (!anyFire) setAlarmMuted(false);
  }, [anyFire]);

  const bg     = dark ? "bg-gray-950"   : "bg-gray-50";
  const card   = dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200";
  const text   = dark ? "text-white"    : "text-gray-900";
  const textSm = dark ? "text-gray-400" : "text-gray-500";

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300`}>

      {/* ── Offline popup toasts ── */}
      {offlineAlerts.length > 0 && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          zIndex: 9999, display: "flex", flexDirection: "column", gap: 8,
          alignItems: "center", pointerEvents: "none",
        }}>
          {offlineAlerts.map(({ id, deviceLabel }) => (
            <div key={id} style={{
              pointerEvents: "all",
              background: dark ? "#1f2937" : "#fff",
              border: "1.5px solid #f97316",
              borderRadius: 14, padding: "12px 18px",
              display: "flex", alignItems: "center", gap: 12,
              boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
              animation: "slideDown 0.3s ease",
              minWidth: 260,
            }}>
              <span style={{ fontSize: 24 }}>📡</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#f97316", fontWeight: 700, fontSize: 14 }}>
                  Device Offline
                </div>
                <div style={{ color: dark ? "#d1d5db" : "#6b7280", fontSize: 12, marginTop: 2 }}>
                  {deviceLabel} has gone offline
                </div>
              </div>
              <button
                onClick={() => setOfflineAlerts(a => a.filter(x => x.id !== id))}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: dark ? "#9ca3af" : "#9ca3af", fontSize: 18, lineHeight: 1,
                  padding: "0 4px",
                }}
              >✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Top Bar */}
      <div className={`sticky top-0 z-50 border-b px-4 py-3 flex items-center justify-between ${
        dark ? "bg-gray-900/95 border-gray-800" : "bg-white/95 border-gray-200"
      } backdrop-blur`}>
        <div className="flex items-center gap-3">
          <span className="text-xl">🌲🔥</span>
          <div>
            <div className={`text-sm font-bold ${text}`}>Forest Fire Monitor</div>
            <div className={`text-xs ${textSm}`}>
              {role === "hiker" ? "Hiker Safety Dashboard" : "Government Officer Panel"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`text-xs px-2 py-1 rounded-full font-medium ${
            role === "officer"
              ? dark ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-700"
              : dark ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-700"
          }`}>
            {role === "officer" ? "🏛 Officer" : "🥾 Hiker"}
          </div>
          <button onClick={toggle} className={`p-2 rounded-full text-base ${
            dark ? "bg-gray-800 text-yellow-400" : "bg-gray-100 text-gray-600"
          }`}>{dark ? "☀️" : "🌙"}</button>
          <button onClick={logout} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            dark ? "border-gray-700 text-gray-400 hover:border-red-500 hover:text-red-400"
                 : "border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-500"
          }`}>Logout</button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Fire Alert Banner */}
        {anyFire && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500 p-4 flex items-center gap-3 animate-pulse">
            <span className="text-3xl">🔥</span>
            <div className="flex-1">
              <div className="font-bold text-red-500 text-lg">FIRE DETECTED!</div>
              <div className={`text-sm ${dark ? "text-red-300" : "text-red-600"}`}>
                {fire1 && fire2 ? "Both devices detecting fire!"
                  : fire1 ? "Device 01 detecting fire"
                  : "Device 02 detecting fire"}
              </div>
            </div>
          </div>
        )}

        {/* Welcome */}
        <div className={`rounded-2xl border p-4 ${card}`}>
          <div className={`text-sm ${textSm}`}>Welcome back</div>
          <div className={`font-bold text-lg ${text}`}>{profile?.name || user?.email}</div>
        </div>

        {/* ══════════════════════════════════════════
            HIKER VIEW
        ══════════════════════════════════════════ */}
        {role === "hiker" && (
          <>
            {/* Overall status hero */}
            <div className={`rounded-2xl border p-6 text-center ${
              anyFire
                ? dark ? "border-red-500 bg-red-500/10" : "border-red-300 bg-red-50"
                : dark ? "border-green-500/30 bg-green-500/5" : "border-green-200 bg-green-50"
            }`}>
              <div className="text-5xl mb-3">{anyFire ? "🔥" : "🌿"}</div>
              <div className={`text-3xl font-bold font-mono ${
                anyFire ? "text-red-500" : dark ? "text-green-400" : "text-green-600"
              }`}>
                {anyFire ? "DANGER!" : "ALL CLEAR"}
              </div>
              <div className={`text-sm mt-2 ${textSm}`}>
                {anyFire
                  ? "Fire detected — evacuate immediately and call for help"
                  : "Conditions are safe for hiking. Stay alert."}
              </div>
            </div>

            {/* Stop Alarm Button */}
            {anyFire && (
              <button
                onClick={() => { alarmRef.current = false; setAlarmMuted(true); }}
                className={`w-full py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                  alarmMuted
                    ? dark ? "bg-gray-800 border border-gray-700 text-gray-400" : "bg-gray-100 border border-gray-300 text-gray-500"
                    : "bg-red-500 text-white hover:bg-red-600 active:scale-95"
                }`}
              >
                <span className="text-lg">{alarmMuted ? "🔕" : "🔔"}</span>
                {alarmMuted ? "Alarm Silenced" : "Stop Alarm Sound"}
              </button>
            )}

            {/* Emergency tip */}
            <div className={`rounded-2xl border p-4 ${
              dark ? "border-orange-500/30 bg-orange-500/5" : "border-orange-200 bg-orange-50"
            }`}>
              <div className={`text-xs font-semibold mb-2 ${dark ? "text-orange-400" : "text-orange-700"}`}>
                🆘 Emergency Tips
              </div>
              <ul className={`text-xs space-y-1 ${dark ? "text-orange-300/80" : "text-orange-700"}`}>
                <li>• Move upwind and uphill away from fire</li>
                <li>• Call emergency services: 999 / 112</li>
                <li>• Do not re-enter the area until cleared</li>
              </ul>
            </div>

            {/* Device 01 */}
            <div className={`text-xs font-semibold uppercase tracking-widest ${textSm}`}>
              Monitoring Stations
            </div>
            <HikerDeviceCard
              deviceId="device_01"
              deviceData={dev1.data}
              online={dev1.online}
              lastSeen={dev1.lastSeen}
              dark={dark}
              fakeGps={fakeGPS?.device_01}
            />
            <HikerDeviceCard
              deviceId="device_02"
              deviceData={dev2.data}
              online={dev2.online}
              lastSeen={dev2.lastSeen}
              dark={dark}
              fakeGps={fakeGPS?.device_02}
            />
          </>
        )}

        {/* ══════════════════════════════════════════
            OFFICER VIEW
        ══════════════════════════════════════════ */}
        {role === "officer" && (
          <>
            {/* Stop Alarm Button */}
            {anyFire && (
              <button
                onClick={() => { alarmRef.current = false; setAlarmMuted(true); }}
                className={`w-full py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                  alarmMuted
                    ? dark ? "bg-gray-800 border border-gray-700 text-gray-400" : "bg-gray-100 border border-gray-300 text-gray-500"
                    : "bg-red-500 text-white hover:bg-red-600 active:scale-95"
                }`}
              >
                <span className="text-lg">{alarmMuted ? "🔕" : "🔔"}</span>
                {alarmMuted ? "Alarm Silenced" : "Stop Alarm Sound"}
              </button>
            )}

            <div className={`text-xs font-semibold uppercase tracking-widest ${textSm}`}>
              Monitoring Stations
            </div>
            <OfficerDeviceSection
              deviceId="device_01"
              deviceData={dev1.data}
              online={dev1.online}
              lastSeen={dev1.lastSeen}
              dark={dark}
              fakeGps={fakeGPS?.device_01}
            />
            <OfficerDeviceSection
              deviceId="device_02"
              deviceData={dev2.data}
              online={dev2.online}
              lastSeen={dev2.lastSeen}
              dark={dark}
              fakeGps={fakeGPS?.device_02}
            />
          </>
        )}

        {/* Last update */}
        <div className={`text-center text-xs pb-4 ${textSm}`}>
          {dev1.lastSeen
            ? `Last updated: ${dev1.lastSeen.toLocaleTimeString()}`
            : "Waiting for data..."}
        </div>
      </div>
    </div>
  );
}
