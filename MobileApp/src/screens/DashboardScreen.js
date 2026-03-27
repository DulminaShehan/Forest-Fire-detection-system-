import { useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, useColorScheme, StatusBar, Linking, Vibration,
} from "react-native";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { useAuth } from "../contexts/AuthContext";
import { useSensors } from "../hooks/useSensors";
import { useFakeBattery } from "../hooks/useFakeBattery";
import { useFakeGPS } from "../hooks/useFakeGPS";
import SensorCard from "../components/SensorCard";
import FireMapView from "../components/FireMapView";

// ── Flame helpers ─────────────────────────────────────────────────
function flameLabel(v) {
  if (v == null)   return "No Data";
  if (v > 3000)    return "No Fire";
  if (v > 2000)    return "Far";
  if (v > 1500)    return "Medium";
  if (v > 500)     return "Close";
  return "VERY CLOSE";
}
function flameLevel(v) {
  if (v == null)  return "warn";
  if (v < 1500)   return "alert";
  if (v < 2000)   return "warn";
  return "safe";
}
function isFire(d) {
  return d?.alerts?.fire === true || d?.sensors?.fire_confirmed === true;
}

// ── Hiker device card ─────────────────────────────────────────────
function HikerDeviceCard({ deviceId, deviceData, online, lastSeen, dark, fakeGps }) {
  const s    = deviceData?.sensors || {};
  const fire = isFire(deviceData);
  const rawG = deviceData?.gps || {};
  const mapLat = rawG.fixed ? Number(rawG.latitude)  : fakeGps?.lat;
  const mapLng = rawG.fixed ? Number(rawG.longitude) : fakeGps?.lng;
  const hasLocation = !!(mapLat && mapLng);
  const text = dark ? "#fff"     : "#111827";
  const sub  = dark ? "#9ca3af" : "#6b7280";
  const card = dark ? "#111827" : "#ffffff";
  const brd  = dark ? "#1f2937" : "#e5e7eb";

  return (
    <View style={[styles.card, { backgroundColor: card, borderColor: brd }]}>
      {/* Header */}
      <View style={styles.row}>
        <Text style={[styles.deviceTitle, { color: text }]}>
          📡 {deviceId.replace("_", " ").toUpperCase()}
        </Text>
        <View style={styles.row}>
          <View style={[styles.dot, { backgroundColor: online ? "#4ade80" : "#f87171" }]} />
          <Text style={[styles.xs, { color: sub }]}>{online ? "Live" : "Offline"}</Text>
          {lastSeen && <Text style={[styles.xs, { color: sub }]}>· {lastSeen.toLocaleTimeString()}</Text>}
        </View>
      </View>

      {/* Fire status */}
      <View style={[styles.fireBox, {
        backgroundColor: fire ? (dark ? "#2d0a0a" : "#fff1f2") : (dark ? "#052e16" : "#f0fdf4"),
        borderColor:     fire ? (dark ? "#991b1b" : "#fca5a5") : (dark ? "#166534" : "#86efac"),
      }]}>
        <Text style={{ fontSize: 28 }}>{fire ? "🔥" : "✅"}</Text>
        <View style={{ marginLeft: 12 }}>
          <Text style={[styles.fireTitle, { color: fire ? "#ef4444" : (dark ? "#4ade80" : "#16a34a") }]}>
            {fire ? "FIRE DETECTED!" : "Area Safe"}
          </Text>
          <Text style={[styles.xs, { color: sub }]}>
            {fire ? "Leave the area immediately" : "No fire detected"}
          </Text>
        </View>
      </View>

      {/* Weather */}
      <View style={styles.grid3}>
        <SensorCard dark={dark} icon="🌡️" label="Temp"
          value={s.temperature != null ? s.temperature.toFixed(1) + "°" : "--"}
          sub="Celsius" level={s.temperature > 38 ? "warn" : "safe"} />
        <View style={{ width: 8 }} />
        <SensorCard dark={dark} icon="💧" label="Humidity"
          value={s.humidity != null ? s.humidity.toFixed(1) + "%" : "--"}
          sub="Relative" level={s.humidity > 85 ? "warn" : "safe"} />
        <View style={{ width: 8 }} />
        <SensorCard dark={dark} icon={s.is_raining ? "🌧️" : "☀️"} label="Rain"
          value={s.rain_percent != null ? s.rain_percent + "%" : "--"}
          sub={s.rain_status || "—"} level={s.is_raining ? "warn" : "safe"} />
      </View>

      {/* Device map */}
      {hasLocation && (
        <FireMapView
          lat={mapLat}
          lng={mapLng}
          deviceId={deviceId}
          fire={fire}
          dark={dark}
        />
      )}
    </View>
  );
}

// ── Officer device card ───────────────────────────────────────────
function OfficerDeviceCard({ deviceId, deviceData, online, lastSeen, dark, fakeGps }) {
  const s    = deviceData?.sensors || {};
  const b    = useFakeBattery();
  const rawG = deviceData?.gps || {};
  const g    = rawG.fixed ? rawG : {};
  const mapLat = rawG.fixed ? Number(rawG.latitude)  : fakeGps?.lat;
  const mapLng = rawG.fixed ? Number(rawG.longitude) : fakeGps?.lng;
  const hasLocation = !!(mapLat && mapLng);
  const f        = s.flame           || {};
  const fire = isFire(deviceData);
  const text = dark ? "#fff"     : "#111827";
  const sub  = dark ? "#9ca3af" : "#6b7280";
  const card = dark ? "#111827" : "#ffffff";
  const brd  = dark ? "#1f2937" : "#e5e7eb";

  return (
    <View style={[styles.card, { backgroundColor: card, borderColor: brd }]}>
      {/* Header */}
      <View style={styles.row}>
        <View style={styles.row}>
          <Text style={[styles.deviceTitle, { color: text }]}>
            📡 {deviceId.replace("_", " ").toUpperCase()}
          </Text>
          <View style={[styles.badge, {
            backgroundColor: fire ? "#fef2f2" : (dark ? "#052e16" : "#f0fdf4"),
          }]}>
            <Text style={{ fontSize: 10, fontWeight: "700", color: fire ? "#ef4444" : (dark ? "#4ade80" : "#16a34a") }}>
              {fire ? "🔥 FIRE" : "✅ Clear"}
            </Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={[styles.dot, { backgroundColor: online ? "#4ade80" : "#f87171" }]} />
          <Text style={[styles.xs, { color: sub }]}>{online ? "Live" : "Offline"}</Text>
        </View>
      </View>

      {/* Environment */}
      <Text style={[styles.sectionLabel, { color: sub }]}>Environment</Text>
      <View style={styles.grid3}>
        <SensorCard dark={dark} icon="🌡️" label="Temp"
          value={s.temperature != null ? s.temperature.toFixed(1) + "°" : "--"}
          sub="Celsius" level={s.temperature > 38 ? "warn" : "safe"} />
        <View style={{ width: 8 }} />
        <SensorCard dark={dark} icon="💧" label="Humidity"
          value={s.humidity != null ? s.humidity.toFixed(1) + "%" : "--"}
          sub="%" level={s.humidity > 85 ? "warn" : "safe"} />
        <View style={{ width: 8 }} />
        <SensorCard dark={dark} icon={s.is_raining ? "🌧️" : "☀️"} label="Rain"
          value={s.rain_percent != null ? s.rain_percent + "%" : "--"}
          sub={s.rain_status || "—"} level={s.is_raining ? "warn" : "safe"} />
      </View>

      {/* Gas Sensors */}
      <Text style={[styles.sectionLabel, { color: sub }]}>Gas Sensors</Text>
      <View style={styles.grid3}>
        <SensorCard dark={dark} icon="💨" label="MQ-2 Smoke"
          value={s.mq2_raw ?? "--"} sub={s.mq2_status || "—"}
          level={s.mq2_raw > 2000 ? "alert" : s.mq2_raw > 1000 ? "warn" : "safe"} />
        <View style={{ width: 8 }} />
        <SensorCard dark={dark} icon="☁️" label="MQ-9 CO"
          value={s.mq9_raw ?? "--"} sub={s.mq9_status || "—"}
          level={s.mq9_raw > 2000 ? "alert" : s.mq9_raw > 1000 ? "warn" : "safe"} />
        <View style={{ width: 8 }} />
        <SensorCard dark={dark} icon={fire ? "🔥" : "✅"} label="Fire"
          value={fire ? "FIRE!" : "Clear"} sub="Flame sensors"
          level={fire ? "alert" : "safe"} />
      </View>

      {/* System */}
      <Text style={[styles.sectionLabel, { color: sub }]}>System</Text>
      <View style={styles.grid2}>
        <SensorCard dark={dark} icon="🔋" label="Battery"
          value={b.percent != null ? b.percent + "%" : "--"}
          sub={b.voltage != null ? b.voltage.toFixed(2) + "V · " + (b.status || "") : "—"}
          level={b.percent < 20 ? "alert" : b.percent < 40 ? "warn" : "safe"} />
        <View style={{ width: 8 }} />
        <SensorCard dark={dark} icon="📍" label="GPS"
          value={g.fixed ? "Fixed" : "Waiting"}
          sub={g.fixed
            ? `${g.satellites} sats · ${Number(g.latitude).toFixed(4)}, ${Number(g.longitude).toFixed(4)}`
            : `${g.satellites || 0} satellites`}
          level={g.fixed ? "safe" : "warn"} />
      </View>

      {/* GPS Map Link */}
      {g.fixed && g.maps_link && (
        <TouchableOpacity
          style={[styles.mapLink, { borderColor: dark ? "#1e3a5f" : "#bfdbfe", backgroundColor: dark ? "#0c1a2e" : "#eff6ff" }]}
          onPress={() => Linking.openURL(g.maps_link)}
        >
          <Text style={{ fontSize: 16 }}>🗺️</Text>
          <Text style={[styles.mapText, { color: dark ? "#60a5fa" : "#1d4ed8" }]}>
            {Number(g.latitude).toFixed(5)}, {Number(g.longitude).toFixed(5)}
          </Text>
          <Text style={{ color: dark ? "#60a5fa" : "#1d4ed8", marginLeft: "auto" }}>→</Text>
        </TouchableOpacity>
      )}

      {/* Device Map — always visible when location available */}
      {hasLocation && (
        <FireMapView
          lat={mapLat}
          lng={mapLng}
          deviceId={deviceId}
          fire={fire}
          dark={dark}
        />
      )}

      {/* Flame zones */}
      <Text style={[styles.sectionLabel, { color: sub }]}>Flame Sensors — 10 Zones</Text>
      <View style={styles.flameGrid}>
        {Array.from({ length: 10 }, (_, i) => {
          const key = "s" + (i + 1);
          const val = f[key];
          const lvl = flameLevel(val);
          const zoneBg  = lvl === "alert" ? (dark ? "#2d0a0a" : "#fff1f2")
                        : lvl === "warn"  ? (dark ? "#1c1400" : "#fffbeb")
                        :                   (dark ? "#1f2937" : "#ffffff");
          const zoneBrd = lvl === "alert" ? (dark ? "#991b1b" : "#fca5a5")
                        : lvl === "warn"  ? (dark ? "#92400e" : "#fcd34d")
                        :                   (dark ? "#374151" : "#e5e7eb");
          const valClr  = lvl === "alert" ? "#ef4444"
                        : lvl === "warn"  ? "#f59e0b"
                        :                   (dark ? "#e5e7eb" : "#374151");
          return (
            <View key={key} style={[styles.flameZone, { backgroundColor: zoneBg, borderColor: zoneBrd }]}>
              <Text style={[styles.xs, { color: sub, fontWeight: "600" }]}>S{i + 1}</Text>
              <Text style={[styles.flameVal, { color: valClr }]}>{val ?? "??"}</Text>
              <Text style={[{ fontSize: 8, color: sub, textAlign: "center" }]}>{flameLabel(val)}</Text>
            </View>
          );
        })}
      </View>

      {/* Fault warning */}
      {(() => {
        const dead = Array.from({ length: 10 }, (_, i) => "s" + (i + 1)).filter(k => f[k] == null);
        return dead.length > 0 ? (
          <View style={[styles.warnBox, { backgroundColor: dark ? "#1c1400" : "#fffbeb", borderColor: dark ? "#92400e" : "#fcd34d" }]}>
            <Text style={{ color: dark ? "#fbbf24" : "#b45309", fontSize: 12 }}>
              ⚠️ Zones {dead.map(k => k.toUpperCase()).join(", ")} not responding
            </Text>
          </View>
        ) : null;
      })()}
    </View>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────
export default function DashboardScreen() {
  const scheme = useColorScheme();
  const dark   = scheme === "dark";
  const { user, profile, logout } = useAuth();
  const fakeGPS = useFakeGPS();
  const dev1 = useSensors("device_01");
  const dev2 = useSensors("device_02");
  const [alarmMuted, setAlarmMuted] = useState(false);
  const soundRef = useRef(null);

  const role    = profile?.role || "hiker";
  const fire1   = isFire(dev1.data);
  const fire2   = isFire(dev2.data);
  const anyFire = fire1 || fire2;

  // ── Offline popup alerts ──────────────────────────────────────────
  const [offlineAlerts, setOfflineAlerts] = useState([]);
  const prevOnline1 = useRef(null);
  const prevOnline2 = useRef(null);
  const alertIdRef  = useRef(0);

  function addOfflineAlert(deviceLabel) {
    const id = ++alertIdRef.current;
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

  const bg   = dark ? "#030712" : "#f9fafb";
  const text = dark ? "#ffffff" : "#111827";
  const sub  = dark ? "#9ca3af" : "#6b7280";
  const nav  = dark ? "#111827" : "#ffffff";
  const brd  = dark ? "#1f2937" : "#e5e7eb";

  // Fire alarm — vibration siren + audio
  useEffect(() => {
    if (!anyFire || alarmMuted) {
      // Stop everything
      Vibration.cancel();
      if (soundRef.current) {
        soundRef.current.stopAsync().catch(() => {});
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
      return;
    }

    // ── Vibration siren ───────────────────────────────────────────
    // Android: pattern repeat works; iOS: only single pulse supported
    const PATTERN = [0, 400, 150, 400, 600];
    Vibration.vibrate(PATTERN, true);

    // ── iOS Haptics (expo-haptics gives richer feedback on iOS) ──
    let hapticTimer;
    function pulseHaptics() {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      hapticTimer = setTimeout(pulseHaptics, 950);
    }
    pulseHaptics();

    // ── Audio alarm via expo-av ───────────────────────────────
    let cancelled = false;
    async function startAlarm() {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,   // plays even on silent switch
          staysActiveInBackground: true,
          shouldDuckAndroid: false,
        });
        const { sound } = await Audio.Sound.createAsync(
          // Short, royalty-free fire alarm beep (hosted on GitHub raw)
          { uri: "https://raw.githubusercontent.com/rafaelreis-hotmart/Audio-Sample-files/master/sample.mp3" },
          { shouldPlay: true, isLooping: true, volume: 1.0 }
        );
        if (!cancelled) {
          soundRef.current = sound;
        } else {
          sound.unloadAsync();
        }
      } catch {
        // Audio failed — vibration alone is the fallback
      }
    }
    startAlarm();

    return () => {
      cancelled = true;
      Vibration.cancel();
      clearTimeout(hapticTimer);
      if (soundRef.current) {
        soundRef.current.stopAsync().catch(() => {});
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, [anyFire, alarmMuted]);

  useEffect(() => {
    if (!anyFire) setAlarmMuted(false);
  }, [anyFire]);

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />

      {/* ── Offline popup toasts ── */}
      {offlineAlerts.length > 0 && (
        <View style={styles.toastContainer}>
          {offlineAlerts.map(({ id, deviceLabel }) => (
            <View key={id} style={[styles.toast, {
              backgroundColor: dark ? "#1f2937" : "#ffffff",
            }]}>
              <Text style={{ fontSize: 22 }}>📡</Text>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.toastTitle}>Device Offline</Text>
                <Text style={[styles.toastSub, { color: sub }]}>
                  {deviceLabel} has gone offline
                </Text>
              </View>
              <TouchableOpacity onPress={() => setOfflineAlerts(a => a.filter(x => x.id !== id))}>
                <Text style={{ color: sub, fontSize: 18, paddingHorizontal: 4 }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: nav, borderBottomColor: brd }]}>
        <View>
          <View style={styles.row}>
            <Text style={{ fontSize: 20 }}>🌲🔥</Text>
            <View style={{ marginLeft: 8 }}>
              <Text style={[styles.navTitle, { color: text }]}>Forest Fire Monitor</Text>
              <Text style={[styles.xs, { color: sub }]}>
                {role === "hiker" ? "Hiker Safety Dashboard" : "Government Officer Panel"}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.row}>
          <View style={[styles.badge, {
            backgroundColor: role === "officer"
              ? (dark ? "#1e3a5f" : "#eff6ff")
              : (dark ? "#052e16" : "#f0fdf4"),
          }]}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: role === "officer" ? "#3b82f6" : "#16a34a" }}>
              {role === "officer" ? "🏛 Officer" : "🥾 Hiker"}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.logoutBtn, { borderColor: brd }]}
            onPress={logout}
          >
            <Text style={[styles.xs, { color: sub }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Fire Alert Banner */}
        {anyFire && (
          <View style={styles.alertBanner}>
            <Text style={{ fontSize: 32 }}>🔥</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.alertTitle]}>FIRE DETECTED!</Text>
              <Text style={{ color: "#fca5a5", fontSize: 13 }}>
                {fire1 && fire2 ? "Both devices detecting fire!"
                  : fire1 ? "Device 01 detecting fire"
                  : "Device 02 detecting fire"}
              </Text>
            </View>
          </View>
        )}

        {/* Welcome */}
        <View style={[styles.card, { backgroundColor: nav, borderColor: brd, marginBottom: 12 }]}>
          <Text style={[styles.xs, { color: sub }]}>Welcome back</Text>
          <Text style={[styles.welcomeName, { color: text }]}>{profile?.name || user?.email}</Text>
        </View>

        {/* HIKER VIEW */}
        {role === "hiker" && (
          <>
            {/* Hero */}
            <View style={[styles.hero, {
              borderColor:     anyFire ? (dark ? "#ef4444" : "#fca5a5") : (dark ? "#166534" : "#86efac"),
              backgroundColor: anyFire ? (dark ? "#2d0a0a" : "#fff1f2") : (dark ? "#052e16" : "#f0fdf4"),
            }]}>
              <Text style={{ fontSize: 56, textAlign: "center" }}>{anyFire ? "🔥" : "🌿"}</Text>
              <Text style={[styles.heroStatus, { color: anyFire ? "#ef4444" : (dark ? "#4ade80" : "#16a34a") }]}>
                {anyFire ? "DANGER!" : "ALL CLEAR"}
              </Text>
              <Text style={[styles.heroSub, { color: sub }]}>
                {anyFire
                  ? "Fire detected — evacuate immediately and call for help"
                  : "Conditions are safe for hiking. Stay alert."}
              </Text>
            </View>

            {/* Stop Alarm */}
            {anyFire && (
              <TouchableOpacity
                style={[styles.muteBtn, alarmMuted
                  ? { backgroundColor: nav, borderWidth: 1, borderColor: brd }
                  : { backgroundColor: "#ef4444" }]}
                onPress={() => { Vibration.cancel(); setAlarmMuted(true); }}
              >
                <Text style={{ fontSize: 20 }}>{alarmMuted ? "🔕" : "🔔"}</Text>
                <Text style={[styles.muteBtnText, { color: alarmMuted ? sub : "#fff" }]}>
                  {alarmMuted ? "Alarm Silenced" : "Stop Alarm Sound"}
                </Text>
              </TouchableOpacity>
            )}

            {/* Emergency Tips */}
            <View style={[styles.card, {
              backgroundColor: dark ? "#1c0a00" : "#fff7ed",
              borderColor:     dark ? "#92400e" : "#fdba74",
            }]}>
              <Text style={[{ fontSize: 12, fontWeight: "700", marginBottom: 8, color: dark ? "#fb923c" : "#c2410c" }]}>
                🆘 Emergency Tips
              </Text>
              {["Move upwind and uphill away from fire", "Call emergency services: 999 / 112", "Do not re-enter the area until cleared"].map(t => (
                <Text key={t} style={{ fontSize: 12, color: dark ? "#fdba74" : "#9a3412", marginBottom: 2 }}>• {t}</Text>
              ))}
            </View>

            <Text style={[styles.sectionLabel, { color: sub }]}>Monitoring Stations</Text>
            <HikerDeviceCard deviceId="device_01" deviceData={dev1.data} online={dev1.online} lastSeen={dev1.lastSeen} dark={dark} fakeGps={fakeGPS?.device_01} />
            <HikerDeviceCard deviceId="device_02" deviceData={dev2.data} online={dev2.online} lastSeen={dev2.lastSeen} dark={dark} fakeGps={fakeGPS?.device_02} />
          </>
        )}

        {/* OFFICER VIEW */}
        {role === "officer" && (
          <>
            {anyFire && (
              <TouchableOpacity
                style={[styles.muteBtn, alarmMuted
                  ? { backgroundColor: nav, borderWidth: 1, borderColor: brd }
                  : { backgroundColor: "#ef4444" }]}
                onPress={() => { Vibration.cancel(); setAlarmMuted(true); }}
              >
                <Text style={{ fontSize: 20 }}>{alarmMuted ? "🔕" : "🔔"}</Text>
                <Text style={[styles.muteBtnText, { color: alarmMuted ? sub : "#fff" }]}>
                  {alarmMuted ? "Alarm Silenced" : "Stop Alarm Sound"}
                </Text>
              </TouchableOpacity>
            )}
            <Text style={[styles.sectionLabel, { color: sub }]}>Monitoring Stations</Text>
            <OfficerDeviceCard deviceId="device_01" deviceData={dev1.data} online={dev1.online} lastSeen={dev1.lastSeen} dark={dark} fakeGps={fakeGPS?.device_01} />
            <OfficerDeviceCard deviceId="device_02" deviceData={dev2.data} online={dev2.online} lastSeen={dev2.lastSeen} dark={dark} fakeGps={fakeGPS?.device_02} />
          </>
        )}

        {/* Last update */}
        <Text style={[{ textAlign: "center", fontSize: 11, marginTop: 12, color: sub }]}>
          {dev1.lastSeen
            ? `Last updated: ${dev1.lastSeen.toLocaleTimeString()}`
            : "Waiting for data..."}
        </Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  toastContainer: { position: "absolute", top: 60, left: 16, right: 16, zIndex: 9999, gap: 8 },
  toast:          { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1.5, borderColor: "#f97316", padding: 12, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
  toastTitle:     { color: "#f97316", fontWeight: "700", fontSize: 14 },
  toastSub:       { fontSize: 12, marginTop: 2 },
  topBar:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12, borderBottomWidth: 1 },
  navTitle:     { fontSize: 14, fontWeight: "700" },
  card:         { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 12 },
  row:          { flexDirection: "row", alignItems: "center", gap: 6 },
  dot:          { width: 8, height: 8, borderRadius: 4 },
  xs:           { fontSize: 11 },
  deviceTitle:  { fontSize: 13, fontWeight: "700" },
  badge:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  fireBox:      { borderRadius: 14, borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "center", marginVertical: 10 },
  fireTitle:    { fontSize: 14, fontWeight: "700" },
  sectionLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  grid3:        { flexDirection: "row", marginBottom: 12 },
  grid2:        { flexDirection: "row", marginBottom: 12 },
  mapLink:      { borderRadius: 14, borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  mapText:      { fontSize: 12, fontWeight: "600", flex: 1 },
  flameGrid:    { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  flameZone:    { borderRadius: 12, borderWidth: 1, padding: 8, alignItems: "center", width: "18%" },
  flameVal:     { fontSize: 12, fontWeight: "700", fontVariant: ["tabular-nums"] },
  warnBox:      { borderRadius: 14, borderWidth: 1, padding: 10, marginBottom: 8 },
  alertBanner:  { borderRadius: 20, borderWidth: 1.5, borderColor: "#ef4444", backgroundColor: "#2d0a0a", padding: 16, flexDirection: "row", alignItems: "center", marginBottom: 12 },
  alertTitle:   { color: "#ef4444", fontWeight: "700", fontSize: 18 },
  welcomeName:  { fontSize: 18, fontWeight: "700", marginTop: 2 },
  hero:         { borderRadius: 20, borderWidth: 1.5, padding: 28, alignItems: "center", marginBottom: 12 },
  heroStatus:   { fontSize: 30, fontWeight: "700", marginTop: 8, fontVariant: ["tabular-nums"] },
  heroSub:      { fontSize: 13, marginTop: 6, textAlign: "center" },
  muteBtn:      { borderRadius: 18, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 },
  muteBtnText:  { fontSize: 14, fontWeight: "600" },
  logoutBtn:    { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
});
