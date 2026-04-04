import { useState, useEffect, useRef, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCmoWFcH_9xC53dT7j-XvUo74Td0J-dLv4",
  authDomain: "forestfiresysterm.firebaseapp.com",
  databaseURL: "https://forestfiresysterm-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "forestfiresysterm",
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// ── Helpers ──────────────────────────────────
function flameLabel(v) {
  if (v == null) return "NO DATA";
  if (v > 3000)  return "No Fire";
  if (v > 2000)  return "Far";
  if (v > 1500)  return "Medium";
  if (v > 500)   return "Close";
  return "VERY CLOSE";
}
function flameLevel(v) {
  if (v == null) return "dead";
  if (v < 1500)  return "fire";
  if (v < 2000)  return "medium";
  return "ok";
}
function gasLabel(r) {
  if (r < 500)  return "SAFE";
  if (r < 1000) return "LOW";
  if (r < 2000) return "MEDIUM";
  if (r < 3000) return "HIGH";
  return "DANGER";
}
function gasLevel(r) {
  if (r < 1000) return "safe";
  if (r < 2000) return "warn";
  return "danger";
}

// ── Audio alarm ──────────────────────────────
function useAlarm() {
  const ctxRef      = useRef(null);
  const loopRef     = useRef(null);
  const playingRef  = useRef(false);

  const beep = useCallback(() => {
    if (!playingRef.current) return;
    const ctx  = ctxRef.current;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
    loopRef.current = setTimeout(beep, 800);
  }, []);

  const start = useCallback(() => {
    if (playingRef.current) return;
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    playingRef.current = true;
    beep();
  }, [beep]);

  const stop = useCallback(() => {
    playingRef.current = false;
    clearTimeout(loopRef.current);
  }, []);

  return { start, stop };
}

// ── Login Screen ─────────────────────────────
function LoginScreen({ onLogin }) {
  return (
    <div style={styles.loginWrap}>
      <div style={styles.loginGlow} />
      <div style={styles.loginBox}>
        <div style={styles.loginLogo}>Forest Fire Monitor</div>
        <div style={styles.loginTitle}>Select your role</div>
        <RoleButton
          icon="🥾"
          title="Hiker"
          desc="Weather conditions & fire alerts"
          color="#4ade80"
          onClick={() => onLogin("hiker")}
        />
        <RoleButton
          icon="🏛"
          title="Government Officer"
          desc="Full system monitoring & sensor status"
          color="#60a5fa"
          onClick={() => onLogin("officer")}
        />
      </div>
    </div>
  );
}

function RoleButton({ icon, title, desc, color, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      style={{ ...styles.roleBtn, borderColor: hover ? color : "#2a3a2a" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
    >
      <div style={{ ...styles.roleIcon, borderColor: color + "60" }}>{icon}</div>
      <div>
        <div style={styles.roleName}>{title}</div>
        <div style={styles.roleDesc}>{desc}</div>
      </div>
    </button>
  );
}

// ── Top Bar ──────────────────────────────────
function TopBar({ role, online, lastUpdate, onLogout }) {
  return (
    <div style={styles.topbar}>
      <div style={styles.topbarLeft}>
        <div style={styles.topbarLogo}>FFM</div>
        <div style={styles.topbarRole}>{role === "hiker" ? "HIKER" : "OFFICER"}</div>
      </div>
      <div style={styles.topbarRight}>
        <div style={{ ...styles.statusDot, background: online ? "#4ade80" : "#f87171",
          boxShadow: `0 0 8px ${online ? "#4ade80" : "#f87171"}` }} />
        <span style={styles.statusText}>{online ? `Live · ${lastUpdate}` : "Offline"}</span>
        <button style={styles.logoutBtn} onClick={onLogout}>Exit</button>
      </div>
    </div>
  );
}

// ── Alert Banner ─────────────────────────────
function AlertBanner({ show, text }) {
  if (!show) return null;
  return (
    <div style={styles.alertBanner}>
      <span style={{ fontSize: 24 }}>🔥</span>
      <div>
        <div style={styles.alertText}>FIRE DETECTED</div>
        <div style={styles.alertSub}>{text}</div>
      </div>
    </div>
  );
}

// ── Sensor Warning ────────────────────────────
function SensorWarning({ dead }) {
  if (!dead || dead.length === 0) return null;
  return (
    <div style={styles.sensorWarn}>
      <span style={{ fontSize: 18 }}>⚠️</span>
      <span style={styles.sensorWarnText}>
        Sensor fault: {dead.join(", ")} not responding — check connections
      </span>
    </div>
  );
}

// ── Sensor Card ──────────────────────────────
function SensorCard({ label, value, sub, level, badge }) {
  const borderColor = level === "alert" ? "#f87171" : level === "warn" ? "#fbbf24" : "#2a3a2a";
  const bg          = level === "alert" ? "#1a0a0a"  : level === "warn" ? "#1a150a"  : "#111811";
  const valColor    = level === "alert" ? "#f87171"  : level === "warn" ? "#fbbf24"  : "#e2e8e2";
  return (
    <div style={{ ...styles.card, borderColor, background: bg }}>
      <div style={styles.cardLabel}>{label}</div>
      <div style={{ ...styles.cardValue, color: valColor }}>{value}</div>
      <div style={styles.cardSub}>{sub}</div>
      {badge && <StatusBadge level={badge.level} text={badge.text} />}
    </div>
  );
}

// ── Status Badge ─────────────────────────────
function StatusBadge({ level, text }) {
  const colors = {
    safe:   { bg: "#052e16", color: "#4ade80" },
    warn:   { bg: "#431407", color: "#fbbf24" },
    danger: { bg: "#450a0a", color: "#f87171" },
    dead:   { bg: "#431407", color: "#fbbf24" },
  };
  const c = colors[level] || colors.safe;
  return (
    <div style={{ ...styles.badge, background: c.bg, color: c.color }}>{text}</div>
  );
}

// ── Flame Card ───────────────────────────────
function FlameCard({ zone, value }) {
  const level = flameLevel(value);
  const borderColor = level === "fire" ? "#f87171" : level === "medium" ? "#fbbf24" : level === "dead" ? "#fbbf2460" : "#2a3a2a";
  const bg          = level === "fire" ? "#1a0a0a"  : level === "medium" ? "#1a150a"  : "#111811";
  const valColor    = level === "fire" ? "#f87171"  : level === "medium" ? "#fbbf24"  : "#e2e8e2";
  return (
    <div style={{ ...styles.flameCard, borderColor, background: bg, opacity: level === "dead" ? 0.6 : 1 }}>
      <div style={styles.flameLabel}>ZONE {zone}</div>
      <div style={{ ...styles.flameVal, color: valColor }}>{value ?? "??"}</div>
      <div style={styles.flameSub}>{flameLabel(value)}</div>
    </div>
  );
}

// ── Section Title ─────────────────────────────
function Section({ title }) {
  return <div style={styles.sectionTitle}>{title}</div>;
}

// ── Hiker View ────────────────────────────────
function HikerView({ s, fireOn }) {
  return (
    <div>
      <div style={styles.hikerHero}>
        <div style={styles.hikerHeroTitle}>Area Fire Status</div>
        <div style={{
          ...styles.fireStatusBig,
          color: fireOn ? "#f87171" : "#4ade80",
          animation: fireOn ? "flash 0.5s infinite" : "none",
        }}>
          {fireOn ? "FIRE!" : "SAFE"}
        </div>
        <div style={styles.fireStatusSub}>
          {fireOn
            ? "FIRE DETECTED — Leave the area immediately!"
            : "No fire detected in monitoring area"}
        </div>
      </div>

      <Section title="WEATHER CONDITIONS" />
      <div style={styles.cardsGrid}>
        <SensorCard
          label="TEMPERATURE"
          value={s.temperature != null ? s.temperature.toFixed(1) + "°" : "--"}
          sub="Celsius"
          level={s.temperature > 38 ? "warn" : "ok"}
        />
        <SensorCard
          label="HUMIDITY"
          value={s.humidity != null ? s.humidity.toFixed(1) + "%" : "--"}
          sub="Relative %"
          level={s.humidity > 85 ? "warn" : "ok"}
        />
        <SensorCard
          label="RAIN"
          value={s.rain_percent != null ? s.rain_percent + "%" : "--"}
          sub={s.rain_status || "—"}
          level={s.is_raining ? "warn" : "ok"}
        />
      </div>
    </div>
  );
}

// ── Officer View ──────────────────────────────
function OfficerView({ s, fireOn, deadSensors }) {
  const flame = s.flame || {};
  return (
    <div>
      <SensorWarning dead={deadSensors} />

      <Section title="ENVIRONMENT" />
      <div style={styles.cardsGrid}>
        <SensorCard label="TEMPERATURE"
          value={s.temperature != null ? s.temperature.toFixed(1) + "°" : "--"}
          sub="Celsius" level={s.temperature > 38 ? "warn" : "ok"}
          badge={{ level: s.temperature > 38 ? "warn" : "safe", text: s.temperature > 38 ? "HIGH" : "OK" }}
        />
        <SensorCard label="HUMIDITY"
          value={s.humidity != null ? s.humidity.toFixed(1) + "%" : "--"}
          sub="%" level={s.humidity > 85 ? "warn" : "ok"}
          badge={{ level: s.humidity > 85 ? "warn" : "safe", text: s.humidity > 85 ? "HIGH" : "OK" }}
        />
        <SensorCard label="RAIN LEVEL"
          value={s.rain_percent != null ? s.rain_percent + "%" : "--"}
          sub={s.rain_status || "—"} level={s.is_raining ? "warn" : "ok"}
          badge={{ level: s.is_raining ? "warn" : "safe", text: s.is_raining ? "RAINING" : "DRY" }}
        />
      </div>

      <Section title="GAS SENSORS" />
      <div style={styles.cardsGrid}>
        <SensorCard label="MQ-2 SMOKE/LPG"
          value={s.mq2_raw ?? "--"}
          sub={s.mq2_percent != null ? s.mq2_percent + " %" : "--"}
          level={gasLevel(s.mq2_raw) === "danger" ? "alert" : gasLevel(s.mq2_raw)}
          badge={{ level: gasLevel(s.mq2_raw), text: gasLabel(s.mq2_raw ?? 0) }}
        />
        <SensorCard label="MQ-9 CO/GAS"
          value={s.mq9_raw ?? "--"}
          sub={s.mq9_percent != null ? s.mq9_percent + " %" : "--"}
          level={gasLevel(s.mq9_raw) === "danger" ? "alert" : gasLevel(s.mq9_raw)}
          badge={{ level: gasLevel(s.mq9_raw), text: gasLabel(s.mq9_raw ?? 0) }}
        />
        <SensorCard label="FIRE STATUS"
          value={fireOn ? "FIRE!" : "CLEAR"}
          sub="Flame sensors"
          level={fireOn ? "alert" : "ok"}
          badge={{ level: fireOn ? "danger" : "safe", text: fireOn ? "FIRE!" : "NO FIRE" }}
        />
      </div>

      <Section title="FLAME SENSORS — 5 ZONES" />
      <div style={styles.flameGrid}>
        {[1,2,3,4,5].map(i => (
          <FlameCard key={i} zone={i} value={flame["s" + i] ?? null} />
        ))}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────
export default function App() {
  const [role,       setRole]       = useState(null);
  const [sensors,    setSensors]    = useState({});
  const [alerts,     setAlerts]     = useState({});
  const [online,     setOnline]     = useState(false);
  const [lastUpdate, setLastUpdate] = useState("—");
  const lastDataRef = useRef(null);
  const { start: startAlarm, stop: stopAlarm } = useAlarm();

  // Firebase listener
  useEffect(() => {
    if (!role) return;
    const unsub = onValue(ref(db, "/"), snap => {
      const data = snap.val() || {};
      setSensors(data.sensors || {});
      setAlerts(data.alerts   || {});
      setOnline(true);
      lastDataRef.current = new Date();
      setLastUpdate(new Date().toLocaleTimeString());
    });

    // Offline detection
    const timer = setInterval(() => {
      if (lastDataRef.current) {
        const diff = (new Date() - lastDataRef.current) / 1000;
        if (diff > 15) setOnline(false);
      }
    }, 5000);

    return () => { unsub(); clearInterval(timer); };
  }, [role]);

  const fireOn = alerts.fire === true || sensors.fire_confirmed === true;

  // Alarm
  useEffect(() => {
    if (fireOn) startAlarm();
    else        stopAlarm();
    return () => stopAlarm();
  }, [fireOn, startAlarm, stopAlarm]);

  // Dead sensors (officer only)
  const deadSensors = [];
  if (role === "officer" && sensors.flame) {
    [1,2,3,4,5].forEach(i => {
      if (sensors.flame["s" + i] == null) deadSensors.push("Zone " + i);
    });
  }

  if (!role) return <LoginScreen onLogin={setRole} />;

  return (
    <div style={styles.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@300;400;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0e0a; }
        @keyframes flash { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      <TopBar
        role={role}
        online={online}
        lastUpdate={lastUpdate}
        onLogout={() => { stopAlarm(); setRole(null); }}
      />

      <div style={styles.content}>
        <AlertBanner
          show={fireOn}
          text="Flame sensors have confirmed fire presence"
        />

        {role === "hiker"
          ? <HikerView s={sensors} fireOn={fireOn} />
          : <OfficerView s={sensors} fireOn={fireOn} deadSensors={deadSensors} />
        }

        <div style={styles.lastUpdate}>
          Last update: {lastUpdate}
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────
const styles = {
  app: { background: "#0a0e0a", minHeight: "100vh", fontFamily: "'IBM Plex Sans', sans-serif", color: "#e2e8e2" },

  // Login
  loginWrap:  { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0e0a", position: "relative", overflow: "hidden" },
  loginGlow:  { position: "absolute", width: 600, height: 600, background: "radial-gradient(circle, #4ade8010 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" },
  loginBox:   { background: "#111811", border: "1px solid #2a3a2a", borderRadius: 4, padding: 48, width: "100%", maxWidth: 400, position: "relative", zIndex: 1 },
  loginLogo:  { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: 3, color: "#4ade80", textTransform: "uppercase", marginBottom: 8 },
  loginTitle: { fontSize: 24, fontWeight: 600, marginBottom: 32 },
  roleBtn:    { width: "100%", padding: "16px 20px", border: "1px solid #2a3a2a", background: "#1a201a", color: "#e2e8e2", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 15, cursor: "pointer", borderRadius: 4, marginBottom: 12, textAlign: "left", display: "flex", alignItems: "center", gap: 14, transition: "border-color 0.2s" },
  roleIcon:   { width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, background: "#1a2a1a", border: "1px solid #166534" },
  roleName:   { fontWeight: 600, fontSize: 15, marginBottom: 2 },
  roleDesc:   { color: "#6b7a6b", fontSize: 12 },

  // Topbar
  topbar:      { background: "#111811", borderBottom: "1px solid #2a3a2a", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 },
  topbarLeft:  { display: "flex", alignItems: "center", gap: 16 },
  topbarLogo:  { fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: 2, color: "#4ade80", textTransform: "uppercase" },
  topbarRole:  { fontSize: 12, color: "#6b7a6b", background: "#1a201a", border: "1px solid #2a3a2a", padding: "3px 10px", borderRadius: 2, fontFamily: "'IBM Plex Mono', monospace" },
  topbarRight: { display: "flex", alignItems: "center", gap: 12 },
  statusDot:   { width: 8, height: 8, borderRadius: "50%", transition: "all 0.3s" },
  statusText:  { fontSize: 12, color: "#6b7a6b" },
  logoutBtn:   { background: "none", border: "1px solid #2a3a2a", color: "#6b7a6b", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, padding: "5px 12px", cursor: "pointer", borderRadius: 2 },

  // Content
  content: { padding: 24, maxWidth: 1200, margin: "0 auto" },

  // Alert
  alertBanner: { background: "#2a0a0a", border: "1px solid #f87171", borderRadius: 4, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14 },
  alertText:   { fontWeight: 600, fontSize: 16, color: "#f87171" },
  alertSub:    { fontSize: 13, color: "#fca5a5", marginTop: 2 },

  // Sensor warning
  sensorWarn:     { background: "#2a1a00", border: "1px solid #fbbf24", borderRadius: 4, padding: "12px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 },
  sensorWarnText: { fontSize: 13, color: "#fbbf24" },

  // Section
  sectionTitle: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: 3, color: "#6b7a6b", textTransform: "uppercase", marginBottom: 14, marginTop: 28 },

  // Cards
  cardsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 },
  card:      { background: "#111811", border: "1px solid #2a3a2a", borderRadius: 4, padding: 20, transition: "border-color 0.3s" },
  cardLabel: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: 2, color: "#6b7a6b", textTransform: "uppercase", marginBottom: 12 },
  cardValue: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 28, fontWeight: 600, lineHeight: 1, marginBottom: 6 },
  cardSub:   { fontSize: 12, color: "#6b7a6b" },
  badge:     { display: "inline-block", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, padding: "2px 8px", borderRadius: 2, marginTop: 8 },

  // Flame
  flameGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 },
  flameCard: { background: "#111811", border: "1px solid #2a3a2a", borderRadius: 4, padding: 14, textAlign: "center", transition: "border-color 0.3s" },
  flameLabel:{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#6b7a6b", marginBottom: 8, letterSpacing: 1 },
  flameVal:  { fontFamily: "'IBM Plex Mono', monospace", fontSize: 20, fontWeight: 600 },
  flameSub:  { fontSize: 10, color: "#6b7a6b", marginTop: 4 },

  // Hiker hero
  hikerHero:      { background: "#111811", border: "1px solid #2a3a2a", borderRadius: 4, padding: 32, textAlign: "center", marginBottom: 20 },
  hikerHeroTitle: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: 3, color: "#6b7a6b", textTransform: "uppercase", marginBottom: 8 },
  fireStatusBig:  { fontFamily: "'IBM Plex Mono', monospace", fontSize: 48, fontWeight: 600, margin: "16px 0 8px", transition: "color 0.3s" },
  fireStatusSub:  { fontSize: 14, color: "#6b7a6b" },

  // Last update
  lastUpdate: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#6b7a6b", textAlign: "right", marginTop: 20 },
};
