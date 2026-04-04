import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function FireMapView({ lat, lng, deviceId, fire, dark }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1, duration: fire ? 900 : 1600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0, duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fire]);

  const scale   = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, fire ? 3.0 : 2.2] });
  const opacity = pulse.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.75, 0.3, 0] });

  const color     = fire ? "#ef4444" : "#3b82f6";
  const ringColor = fire ? "rgba(239,68,68,0.55)" : "rgba(59,130,246,0.45)";
  const emoji     = fire ? "🔥" : "📡";
  const labelBg   = fire ? "rgba(239,68,68,0.92)" : "rgba(59,130,246,0.88)";
  const label     = fire
    ? `🔥 ${deviceId.replace("_", " ").toUpperCase()} — FIRE LOCATION`
    : `📡 ${deviceId.replace("_", " ").toUpperCase()} — DEVICE LOCATION`;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude:       lat,
          longitude:      lng,
          latitudeDelta:  0.004,
          longitudeDelta: 0.004,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        <Marker coordinate={{ latitude: lat, longitude: lng }} tracksViewChanges={false}>
          <View style={styles.markerWrap}>
            <Animated.View style={[
              styles.ring,
              { backgroundColor: ringColor, transform: [{ scale }], opacity },
            ]} />
            <View style={[styles.dot, {
              backgroundColor: color,
              shadowColor: color,
            }]}>
              <Text style={{ fontSize: 13 }}>{emoji}</Text>
            </View>
          </View>
        </Marker>
      </MapView>

      <View style={[styles.label, { backgroundColor: labelBg }]}>
        <Text style={styles.labelText}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { borderRadius: 18, overflow: "hidden", height: 210, marginBottom: 12 },
  map:        { flex: 1 },
  markerWrap: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  ring: {
    position: "absolute",
    width: 28, height: 28, borderRadius: 14,
  },
  dot: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2.5, borderColor: "#fff",
    alignItems: "center", justifyContent: "center",
    shadowOpacity: 0.85, shadowRadius: 8, elevation: 6,
  },
  label: {
    position: "absolute", bottom: 10, left: 10,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  labelText: { color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
});
