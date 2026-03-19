#include "DHT.h"
#include <WiFi.h>
#include <WebServer.h>

// ── WiFi ───────────────────────────────────────
const char* ssid     = "Dulmina";      // ← Change this
const char* password = "dula1790";  // ← Change this

WebServer server(80);

// ── DHT22 ──────────────────────────────────────
#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// ── Buzzer ─────────────────────────────────────
#define BUZZER_PIN 26

// ── Rain Sensor ────────────────────────────────
#define RAIN_DIGITAL_PIN 27
#define RAIN_ANALOG_PIN  33

// ── MQ-2 ───────────────────────────────────────
#define MQ2_DIGITAL_PIN  25

// ── MQ-9 ───────────────────────────────────────
#define MQ9_DIGITAL_PIN  32

// ── LDR ────────────────────────────────────────
#define LDR_PIN          36

// ── Global Sensor Values ───────────────────────
float temperature  = 0;
float humidity     = 0;
int   rainAnalog   = 0;
int   rainPercent  = 0;
bool  isRaining    = false;
bool  mq2Gas       = false;
bool  mq9Gas       = false;
int   ldrValue     = 0;
int   ldrPercent   = 0;
bool  lastRainState = false;

// ── Buzzer ─────────────────────────────────────
void buzzerBeep(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(200);
    digitalWrite(BUZZER_PIN, LOW);
    delay(150);
  }
}

void buzzerAlarm() {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(100);
  digitalWrite(BUZZER_PIN, LOW);
  delay(100);
}

// ── Read All Sensors ───────────────────────────
void readSensors() {
  // DHT22
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  if (!isnan(h)) humidity    = h;
  if (!isnan(t)) temperature = t;

  // Rain
  isRaining   = digitalRead(RAIN_DIGITAL_PIN) == LOW;
  rainAnalog  = analogRead(RAIN_ANALOG_PIN);
  rainPercent = map(rainAnalog, 4095, 0, 0, 100);

  // MQ2 MQ9
  mq2Gas = digitalRead(MQ2_DIGITAL_PIN) == LOW;
  mq9Gas = digitalRead(MQ9_DIGITAL_PIN) == LOW;

  // LDR
  ldrValue   = analogRead(LDR_PIN);
  ldrPercent = map(ldrValue, 0, 4095, 0, 100);

  // Rain alerts
  if (isRaining && !lastRainState) {
    Serial.println("Rain Started!");
    buzzerBeep(2);
  }
  if (!isRaining && lastRainState) {
    Serial.println("Rain Stopped!");
    buzzerBeep(1);
  }
  lastRainState = isRaining;
}

// ── Light Level Label ──────────────────────────
String lightLabel() {
  if      (ldrPercent >= 80) return "Very Bright";
  else if (ldrPercent >= 60) return "Bright";
  else if (ldrPercent >= 40) return "Medium";
  else if (ldrPercent >= 20) return "Dim";
  else if (ldrPercent >= 5)  return "Dark";
  else                       return "Very Dark";
}

// ── Rain Label ─────────────────────────────────
String rainLabel() {
  if      (rainPercent == 0)  return "No Rain";
  else if (rainPercent <= 30) return "Light Rain";
  else if (rainPercent <= 60) return "Moderate Rain";
  else                        return "Heavy Rain";
}

// ── Web Dashboard Page ─────────────────────────
void handleRoot() {
  String html = R"rawhtml(
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="5">
  <title>ESP32 Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, sans-serif;
      background: #1a1a2e;
      color: #eee;
      padding: 20px;
    }
    h1 {
      text-align: center;
      color: #00d4ff;
      margin-bottom: 24px;
      font-size: 24px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
      max-width: 700px;
      margin: 0 auto;
    }
    .card {
      background: #16213e;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      border: 1px solid #0f3460;
    }
    .card .icon { font-size: 32px; margin-bottom: 8px; }
    .card .label { font-size: 12px; color: #888; margin-bottom: 6px; }
    .card .value { font-size: 22px; font-weight: bold; color: #00d4ff; }
    .card .sub   { font-size: 12px; color: #aaa; margin-top: 4px; }
    .card.alert  { border-color: #ff4444; background: #2a1010; }
    .card.safe   { border-color: #44ff88; }
    .card.warn   { border-color: #ffaa00; background: #2a2010; }
    .footer {
      text-align: center;
      margin-top: 24px;
      font-size: 11px;
      color: #555;
    }
  </style>
</head>
<body>
  <h1>ESP32 Sensor Dashboard</h1>
  <div class="grid">
)rawhtml";

  // Temperature card
  String tempClass = (temperature > 38.0) ? "card warn" : "card safe";
  html += "<div class='" + tempClass + "'>";
  html += "<div class='icon'>🌡️</div>";
  html += "<div class='label'>Temperature</div>";
  html += "<div class='value'>" + String(temperature, 1) + " °C</div>";
  html += "<div class='sub'>" + String(temperature > 38.0 ? "⚠️ HIGH TEMP" : "Normal") + "</div>";
  html += "</div>";

  // Humidity card
  String humClass = (humidity > 85.0) ? "card warn" : "card safe";
  html += "<div class='" + humClass + "'>";
  html += "<div class='icon'>💧</div>";
  html += "<div class='label'>Humidity</div>";
  html += "<div class='value'>" + String(humidity, 1) + " %</div>";
  html += "<div class='sub'>" + String(humidity > 85.0 ? "⚠️ HIGH" : "Normal") + "</div>";
  html += "</div>";

  // Rain card
  String rainClass = isRaining ? "card warn" : "card";
  html += "<div class='" + rainClass + "'>";
  html += "<div class='icon'>" + String(isRaining ? "🌧️" : "☀️") + "</div>";
  html += "<div class='label'>Rain</div>";
  html += "<div class='value'>" + String(rainPercent) + " %</div>";
  html += "<div class='sub'>" + rainLabel() + "</div>";
  html += "</div>";

  // MQ-2 card
  String mq2Class = mq2Gas ? "card alert" : "card safe";
  html += "<div class='" + mq2Class + "'>";
  html += "<div class='icon'>" + String(mq2Gas ? "🚨" : "✅") + "</div>";
  html += "<div class='label'>MQ-2 Smoke/LPG</div>";
  html += "<div class='value'>" + String(mq2Gas ? "GAS!" : "Clear") + "</div>";
  html += "<div class='sub'>" + String(mq2Gas ? "Evacuate!" : "Safe") + "</div>";
  html += "</div>";

  // MQ-9 card
  String mq9Class = mq9Gas ? "card alert" : "card safe";
  html += "<div class='" + mq9Class + "'>";
  html += "<div class='icon'>" + String(mq9Gas ? "🚨" : "✅") + "</div>";
  html += "<div class='label'>MQ-9 CO/Gas</div>";
  html += "<div class='value'>" + String(mq9Gas ? "GAS!" : "Clear") + "</div>";
  html += "<div class='sub'>" + String(mq9Gas ? "Danger!" : "Safe") + "</div>";
  html += "</div>";

  // LDR card
  html += "<div class='card'>";
  html += "<div class='icon'>💡</div>";
  html += "<div class='label'>Light Level</div>";
  html += "<div class='value'>" + String(ldrPercent) + " %</div>";
  html += "<div class='sub'>" + lightLabel() + "</div>";
  html += "</div>";

  html += R"rawhtml(
  </div>
  <div class="footer">Auto refresh every 5 seconds</div>
</body>
</html>
)rawhtml";

  server.send(200, "text/html", html);
}

// ── Setup ──────────────────────────────────────
void setup() {
  Serial.begin(115200);
  dht.begin();
  delay(2000);

  pinMode(BUZZER_PIN,       OUTPUT);
  pinMode(RAIN_DIGITAL_PIN, INPUT);
  pinMode(MQ2_DIGITAL_PIN,  INPUT);
  pinMode(MQ9_DIGITAL_PIN,  INPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // ── Connect WiFi ───────────────────────────────
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);

  int attempt = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    attempt++;
    if (attempt > 40) {
      Serial.println("\n❌ WiFi Failed! Check ssid and password.");
      break;
    }
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("🌐 Open this in browser: http://");
    Serial.println(WiFi.localIP());
    buzzerBeep(3); // 3 beeps = WiFi connected
  }

  // ── Start Web Server ───────────────────────────
  server.on("/", handleRoot);
  server.begin();
  Serial.println("✅ Web server started!");

  // MQ warmup
  Serial.println("⏳ Warming up MQ sensors...");
  for (int i = 10; i > 0; i--) {
    Serial.print(i); Serial.print("...");
    delay(1000);
  }
  Serial.println("\n✅ All Ready!");
}

// ── Loop ───────────────────────────────────────
void loop() {
  server.handleClient(); // Handle web requests

  // Gas check every 500ms
  bool mq2 = digitalRead(MQ2_DIGITAL_PIN) == LOW;
  bool mq9 = digitalRead(MQ9_DIGITAL_PIN) == LOW;
  if (mq2 || mq9) {
    buzzerAlarm();
  } else {
    digitalWrite(BUZZER_PIN, LOW);
  }

  // Read all sensors every 2 seconds
  static unsigned long lastRead = 0;
  if (millis() - lastRead >= 2000) {
    lastRead = millis();
    readSensors();

    Serial.println("========================================");
    Serial.print("Temp: ");     Serial.print(temperature); Serial.println(" °C");
    Serial.print("Humidity: "); Serial.print(humidity);    Serial.println(" %");
    Serial.print("Rain: ");     Serial.print(rainPercent); Serial.println(" %");
    Serial.print("MQ-2: ");     Serial.println(mq2Gas ? "GAS DETECTED" : "Clear");
    Serial.print("MQ-9: ");     Serial.println(mq9Gas ? "GAS DETECTED" : "Clear");
    Serial.print("Light: ");    Serial.print(ldrPercent);  Serial.println(" %");
    Serial.println("========================================");
  }
}