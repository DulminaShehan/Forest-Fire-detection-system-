#include <WiFi.h>
#include <TinyGPS++.h>

// WiFi details
const char* ssid = "Dulmina";
const char* password = "dula1790";

// GPS
TinyGPSPlus gps;
HardwareSerial gpsSerial(1);

void setup() {
  Serial.begin(115200);
  delay(1000);

  // Start GPS (RX=12, TX=13)
  gpsSerial.begin(9600, SERIAL_8N1, 12, 13);

  // Connect WiFi
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n✅ WiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  Serial.println("📡 Waiting for GPS signal...");
}

void loop() {
  while (gpsSerial.available()) {
    gps.encode(gpsSerial.read());

    if (gps.location.isUpdated()) {
      float lat = gps.location.lat();
      float lng = gps.location.lng();

      Serial.println("📍 GPS DATA:");

      Serial.print("Latitude: ");
      Serial.println(lat, 6);

      Serial.print("Longitude: ");
      Serial.println(lng, 6);

      // Google Maps link
      Serial.print("🌍 Map Link: ");
      Serial.print("https://www.google.com/maps?q=");
      Serial.print(lat, 6);
      Serial.print(",");
      Serial.println(lng, 6);

      Serial.println("----------------------");
    }
  }
}