import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

export default function AuthPage() {
  const { login, register } = useAuth();
  const { dark, toggle }    = useTheme();

  const [mode,    setMode]    = useState("login");
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [pass,    setPass]    = useState("");
  const [role,    setRole]    = useState("hiker");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (mode === "login") await login(email, pass);
      else                  await register(email, pass, name, role);
    } catch (err) {
      setError(err.message.replace("Firebase: ", "").replace(/\(.*\)/, "").trim());
    }
    setLoading(false);
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
      dark ? "bg-gray-950" : "bg-gray-50"
    }`}>

      {/* Theme toggle */}
      <button
        onClick={toggle}
        className={`fixed top-4 right-4 p-2 rounded-full text-lg transition-colors ${
          dark ? "bg-gray-800 text-yellow-400" : "bg-white text-gray-600 shadow"
        }`}
      >{dark ? "☀️" : "🌙"}</button>

      <div className={`w-full max-w-md rounded-2xl p-8 transition-colors duration-300 ${
        dark ? "bg-gray-900 border border-gray-800" : "bg-white shadow-xl"
      }`}>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🌲🔥</div>
          <h1 className={`text-2xl font-bold tracking-tight ${dark ? "text-white" : "text-gray-900"}`}>
            Forest Fire Monitor
          </h1>
          <p className={`text-sm mt-1 ${dark ? "text-gray-400" : "text-gray-500"}`}>
            Real-time detection system
          </p>
        </div>

        {/* Tabs */}
        <div className={`flex rounded-xl p-1 mb-6 ${dark ? "bg-gray-800" : "bg-gray-100"}`}>
          {["login","register"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                mode === m
                  ? dark ? "bg-orange-500 text-white shadow" : "bg-white text-orange-600 shadow"
                  : dark ? "text-gray-400" : "text-gray-500"
              }`}
            >{m}</button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name (register only) */}
          {mode === "register" && (
            <div>
              <label className={`block text-xs font-medium mb-1 ${dark ? "text-gray-300" : "text-gray-700"}`}>
                Full Name
              </label>
              <input
                type="text" required value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all border ${
                  dark
                    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-orange-500"
                    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-orange-400"
                }`}
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${dark ? "text-gray-300" : "text-gray-700"}`}>
              Email
            </label>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all border ${
                dark
                  ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-orange-500"
                  : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-orange-400"
              }`}
            />
          </div>

          {/* Password */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${dark ? "text-gray-300" : "text-gray-700"}`}>
              Password
            </label>
            <input
              type="password" required value={pass}
              onChange={e => setPass(e.target.value)}
              placeholder="••••••••"
              className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all border ${
                dark
                  ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-orange-500"
                  : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-orange-400"
              }`}
            />
          </div>

          {/* Role (register only) */}
          {mode === "register" && (
            <div>
              <label className={`block text-xs font-medium mb-2 ${dark ? "text-gray-300" : "text-gray-700"}`}>
                Your Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "hiker",   icon: "🥾", label: "Hiker",              desc: "Weather & fire alerts" },
                  { id: "officer", icon: "🏛",  label: "Gov. Officer",       desc: "Full system access" },
                ].map(r => (
                  <button key={r.id} type="button" onClick={() => setRole(r.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      role === r.id
                        ? dark
                          ? "border-orange-500 bg-orange-500/10"
                          : "border-orange-400 bg-orange-50"
                        : dark
                          ? "border-gray-700 bg-gray-800"
                          : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="text-xl mb-1">{r.icon}</div>
                    <div className={`text-xs font-semibold ${dark ? "text-white" : "text-gray-900"}`}>{r.label}</div>
                    <div className={`text-xs mt-0.5 ${dark ? "text-gray-400" : "text-gray-500"}`}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit" disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
              loading
                ? "opacity-50 cursor-not-allowed"
                : "hover:opacity-90 active:scale-95"
            } bg-orange-500 text-white`}
          >
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className={`text-center text-xs mt-4 ${dark ? "text-gray-500" : "text-gray-400"}`}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            className="text-orange-500 font-medium"
          >
            {mode === "login" ? "Register" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}
