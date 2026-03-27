import { View, Text, StyleSheet } from "react-native";

export default function SensorCard({ icon, label, value, sub, level, dark }) {
  const bg = {
    safe:  dark ? "#052e16" : "#f0fdf4",
    warn:  dark ? "#1c1400" : "#fffbeb",
    alert: dark ? "#1f0000" : "#fff1f2",
    ok:    dark ? "#1f2937" : "#ffffff",
  }[level] || (dark ? "#1f2937" : "#ffffff");

  const border = {
    safe:  dark ? "#166534" : "#86efac",
    warn:  dark ? "#92400e" : "#fcd34d",
    alert: dark ? "#991b1b" : "#fca5a5",
    ok:    dark ? "#374151" : "#e5e7eb",
  }[level] || (dark ? "#374151" : "#e5e7eb");

  const valColor = {
    safe:  dark ? "#4ade80" : "#15803d",
    warn:  dark ? "#fbbf24" : "#b45309",
    alert: dark ? "#f87171" : "#b91c1c",
    ok:    dark ? "#f9fafb" : "#1f2937",
  }[level] || (dark ? "#f9fafb" : "#1f2937");

  return (
    <View style={[styles.card, { backgroundColor: bg, borderColor: border }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.label, { color: dark ? "#9ca3af" : "#6b7280" }]}>{label}</Text>
      <Text style={[styles.value, { color: valColor }]}>{value}</Text>
      {sub ? <Text style={[styles.sub, { color: dark ? "#9ca3af" : "#6b7280" }]}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    minWidth: 90,
  },
  icon:  { fontSize: 22, marginBottom: 4 },
  label: { fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  value: { fontSize: 20, fontWeight: "700", fontVariant: ["tabular-nums"] },
  sub:   { fontSize: 10, marginTop: 2 },
});
