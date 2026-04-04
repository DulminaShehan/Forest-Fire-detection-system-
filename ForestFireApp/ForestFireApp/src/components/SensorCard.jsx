export default function SensorCard({ icon, label, value, sub, level, dark }) {
  const colors = {
    ok:    dark ? "border-gray-700 bg-gray-800/50"         : "border-gray-200 bg-white",
    safe:  dark ? "border-green-500/30 bg-green-500/5"     : "border-green-200 bg-green-50",
    warn:  dark ? "border-amber-500/40 bg-amber-500/8"     : "border-amber-200 bg-amber-50",
    alert: dark ? "border-red-500/50 bg-red-500/10"        : "border-red-200 bg-red-50",
  };

  const valColors = {
    ok:    dark ? "text-gray-100"  : "text-gray-800",
    safe:  dark ? "text-green-400" : "text-green-700",
    warn:  dark ? "text-amber-400" : "text-amber-700",
    alert: dark ? "text-red-400"   : "text-red-700",
  };

  return (
    <div className={`rounded-2xl border p-4 transition-all duration-300 ${colors[level] || colors.ok}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className={`text-xs font-medium uppercase tracking-wider mb-1 ${dark ? "text-gray-400" : "text-gray-500"}`}>
        {label}
      </div>
      <div className={`text-2xl font-bold font-mono ${valColors[level] || valColors.ok}`}>
        {value}
      </div>
      {sub && (
        <div className={`text-xs mt-1 ${dark ? "text-gray-400" : "text-gray-500"}`}>{sub}</div>
      )}
    </div>
  );
}
