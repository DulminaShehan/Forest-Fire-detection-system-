import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, useColorScheme, StatusBar, KeyboardAvoidingView, Platform,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";

export default function AuthScreen() {
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  const { login, register } = useAuth();

  const [mode,    setMode]    = useState("login");
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [pass,    setPass]    = useState("");
  const [role,    setRole]    = useState("hiker");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const bg   = dark ? "#030712" : "#f9fafb";
  const card = dark ? "#111827" : "#ffffff";
  const text = dark ? "#ffffff" : "#111827";
  const sub  = dark ? "#9ca3af" : "#6b7280";
  const inp  = dark ? "#1f2937" : "#f9fafb";
  const brd  = dark ? "#374151" : "#e5e7eb";

  async function handleSubmit() {
    if (!email || !pass) { setError("Please fill in all fields."); return; }
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />
      <ScrollView
        style={{ flex: 1, backgroundColor: bg }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { backgroundColor: card }]}>

          {/* Logo */}
          <Text style={styles.logo}>🌲🔥</Text>
          <Text style={[styles.title, { color: text }]}>Forest Fire Monitor</Text>
          <Text style={[styles.subtitle, { color: sub }]}>Real-time detection system</Text>

          {/* Tabs */}
          <View style={[styles.tabs, { backgroundColor: dark ? "#1f2937" : "#f3f4f6" }]}>
            {["login", "register"].map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.tab, mode === m && { backgroundColor: dark ? "#f97316" : "#ffffff" }]}
                onPress={() => { setMode(m); setError(""); }}
              >
                <Text style={[styles.tabText, { color: mode === m ? (dark ? "#fff" : "#ea580c") : sub }]}>
                  {m === "login" ? "Sign In" : "Register"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Name (register) */}
          {mode === "register" && (
            <View style={styles.field}>
              <Text style={[styles.label, { color: sub }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inp, borderColor: brd, color: text }]}
                placeholder="Your name" placeholderTextColor={sub}
                value={name} onChangeText={setName}
              />
            </View>
          )}

          {/* Email */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: sub }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: inp, borderColor: brd, color: text }]}
              placeholder="your@email.com" placeholderTextColor={sub}
              autoCapitalize="none" keyboardType="email-address"
              value={email} onChangeText={setEmail}
            />
          </View>

          {/* Password */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: sub }]}>Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: inp, borderColor: brd, color: text }]}
              placeholder="••••••••" placeholderTextColor={sub}
              secureTextEntry value={pass} onChangeText={setPass}
            />
          </View>

          {/* Role (register) */}
          {mode === "register" && (
            <View style={styles.field}>
              <Text style={[styles.label, { color: sub }]}>Your Role</Text>
              <View style={styles.roles}>
                {[
                  { id: "hiker",   icon: "🥾", label: "Hiker",         desc: "Weather & fire alerts" },
                  { id: "officer", icon: "🏛",  label: "Gov. Officer",  desc: "Full system access" },
                ].map(r => (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.roleCard, {
                      backgroundColor: inp,
                      borderColor: role === r.id ? "#f97316" : brd,
                    }]}
                    onPress={() => setRole(r.id)}
                  >
                    <Text style={styles.roleIcon}>{r.icon}</Text>
                    <Text style={[styles.roleLabel, { color: text }]}>{r.label}</Text>
                    <Text style={[styles.roleDesc, { color: sub }]}>{r.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.5 }]}
            onPress={handleSubmit} disabled={loading}
          >
            <Text style={styles.btnText}>
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </Text>
          </TouchableOpacity>

          {/* Switch mode */}
          <View style={styles.switchRow}>
            <Text style={{ color: sub, fontSize: 12 }}>
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            </Text>
            <TouchableOpacity onPress={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
              <Text style={{ color: "#f97316", fontSize: 12, fontWeight: "600" }}>
                {mode === "login" ? "Register" : "Sign In"}
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll:    { flexGrow: 1, justifyContent: "center", padding: 20 },
  card:      { borderRadius: 24, padding: 28, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 20, elevation: 4 },
  logo:      { textAlign: "center", fontSize: 44, marginBottom: 8 },
  title:     { textAlign: "center", fontSize: 24, fontWeight: "700", letterSpacing: -0.5 },
  subtitle:  { textAlign: "center", fontSize: 13, marginTop: 4, marginBottom: 24 },
  tabs:      { flexDirection: "row", borderRadius: 14, padding: 4, marginBottom: 20 },
  tab:       { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  tabText:   { fontSize: 13, fontWeight: "600" },
  field:     { marginBottom: 16 },
  label:     { fontSize: 11, fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.3 },
  input:     { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14 },
  roles:     { flexDirection: "row", gap: 10 },
  roleCard:  { flex: 1, borderRadius: 14, borderWidth: 1.5, padding: 12 },
  roleIcon:  { fontSize: 22, marginBottom: 4 },
  roleLabel: { fontSize: 12, fontWeight: "700" },
  roleDesc:  { fontSize: 10, marginTop: 2 },
  errorBox:  { backgroundColor: "#fef2f2", borderColor: "#fca5a5", borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 12 },
  errorText: { color: "#b91c1c", fontSize: 12 },
  btn:       { backgroundColor: "#f97316", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  btnText:   { color: "#fff", fontWeight: "700", fontSize: 15 },
  switchRow: { flexDirection: "row", justifyContent: "center", marginTop: 16 },
});
