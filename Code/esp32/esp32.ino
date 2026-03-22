#include "DHT.h"
#include <WiFi.h>

// ══════════════════════════════════════════════
//   WiFi Credentials  <- CHANGE THESE
// ══════════════════════════════════════════════
const char* ssid     = "Dulmina";
const char* password = "dula1790";

// ══════════════════════════════════════════════
//   Pin Definitions
// ══════════════════════════════════════════════
#define DHTPIN           4
#define DHTTYPE          DHT22
#define BUZZER_PIN       26
#define RAIN_DIGITAL_PIN 27
#define RAIN_ANALOG_PIN  33
#define MQ2_ANALOG_PIN   34
#define MQ9_ANALOG_PIN   35
#define FLAME_1_PIN      36
#define FLAME_2_PIN      39
#define FLAME_3_PIN      32
#define FLAME_4_PIN      25
#define FLAME_5_PIN      13

DHT dht(DHTPIN, DHTTYPE);

float temperature   = 0;
float humidity      = 0;
int   rainPercent   = 0;
bool  isRaining     = false;
int   mq2Raw        = 0;
int   mq9Raw        = 0;
int   mq2Percent    = 0;
int   mq9Percent    = 0;
bool  lastRainState = false;
bool  fireConfirmed = false;

// ══════════════════════════════════════════════
//   Thresholds
// ══════════════════════════════════════════════
#define GAS_THRESHOLD   1000
#define FIRE_THRESHOLD  1500
#define CONFIRM_COUNT   5

// ══════════════════════════════════════════════
//   Buzzer
// ══════════════════════════════════════════════
void buzzerBeep(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(BUZZER_PIN, HIGH); delay(200);
    digitalWrite(BUZZER_PIN, LOW);  delay(150);
  }
}

void buzzerAlarm() {
  digitalWrite(BUZZER_PIN, HIGH); delay(100);
  digitalWrite(BUZZER_PIN, LOW);  delay(100);
}

// ══════════════════════════════════════════════
//   Labels
// ══════════════════════════════════════════════
String rainLabel() {
  if      (rainPercent == 0)  return "No Rain";
  else if (rainPercent <= 30) return "Light Rain";
  else if (rainPercent <= 60) return "Moderate Rain";
  else                        return "Heavy Rain";
}

String gasLabel(int raw) {
  if      (raw < 500)  return "Safe";
  else if (raw < 1000) return "Low";
  else if (raw < 2000) return "Medium";
  else if (raw < 3000) return "High";
  else                 return "DANGER";
}

String flameLabel(int raw) {
  if      (raw > 3000) return "No Fire";
  else if (raw > 2000) return "Far Fire";
  else if (raw > 1500) return "Medium Fire";
  else if (raw > 500)  return "Close Fire";
  else                 return "VERY CLOSE FIRE";
}

// ══════════════════════════════════════════════
//   Read Flame Sensors
// ══════════════════════════════════════════════
bool readFlameSensors() {
  int f1 = analogRead(FLAME_1_PIN);
  int f2 = analogRead(FLAME_2_PIN);
  int f3 = analogRead(FLAME_3_PIN);
  int f4 = analogRead(FLAME_4_PIN);
  int f5 = analogRead(FLAME_5_PIN);

  bool fire1 = f1 < FIRE_THRESHOLD;
  bool fire2 = f2 < FIRE_THRESHOLD;
  bool fire3 = f3 < FIRE_THRESHOLD;
  bool fire4 = f4 < FIRE_THRESHOLD;
  bool fire5 = f5 < FIRE_THRESHOLD;

  Serial.println("---- Flame Sensors ----");
  Serial.print("S1: "); Serial.print(f1); Serial.print("  ->  "); Serial.println(flameLabel(f1));
  Serial.print("S2: "); Serial.print(f2); Serial.print("  ->  "); Serial.println(flameLabel(f2));
  Serial.print("S3: "); Serial.print(f3); Serial.print("  ->  "); Serial.println(flameLabel(f3));
  Serial.print("S4: "); Serial.print(f4); Serial.print("  ->  "); Serial.println(flameLabel(f4));
  Serial.print("S5: "); Serial.print(f5); Serial.print("  ->  "); Serial.println(flameLabel(f5));

  return (fire1 || fire2 || fire3 || fire4 || fire5);
}

// ══════════════════════════════════════════════
//   WiFi Connect
// ══════════════════════════════════════════════
void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  int attempt = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    attempt++;
    if (attempt > 40) {
      Serial.println();
      Serial.println("WiFi FAILED! Check name and password.");
      return;
    }
  }
  Serial.println();
  Serial.println("WiFi Connected!");
  Serial.print("  IP Address : "); Serial.println(WiFi.localIP());
  Serial.print("  Signal     : "); Serial.print(WiFi.RSSI()); Serial.println(" dBm");
  buzzerBeep(3);
}

// ══════════════════════════════════════════════
//   Setup
// ══════════════════════════════════════════════
void setup() {
  Serial.begin(115200);
  delay(1000);

  dht.begin();
  delay(2000);

  pinMode(BUZZER_PIN,       OUTPUT);
  pinMode(RAIN_DIGITAL_PIN, INPUT);
  digitalWrite(BUZZER_PIN,  LOW);

  Serial.println("========================================");
  Serial.println("     ESP32 Sensor System Ready          ");
  Serial.println("========================================");

  // DHT22 test
  float testH = dht.readHumidity();
  float testT = dht.readTemperature();
  if (isnan(testH) || isnan(testT)) {
    Serial.println("DHT22 : FAILED - Check GPIO 4 wiring!");
  } else {
    Serial.println("DHT22 : OK");
    Serial.print("Temp  : "); Serial.print(testT, 1); Serial.println(" C");
    Serial.print("Hum   : "); Serial.print(testH, 1); Serial.println(" %");
  }

  // WiFi connect
  Serial.println("----------------------------------------");
  connectWiFi();
  Serial.println("========================================");
}

// ══════════════════════════════════════════════
//   Loop
// ══════════════════════════════════════════════
void loop() {

  // ── Flame Check with Debounce ──────────────────
  bool rawFire = readFlameSensors();

  static int flameCounter = 0;

  if (rawFire) {
    if (flameCounter < CONFIRM_COUNT) flameCounter++;
  } else {
    flameCounter  = 0;
    fireConfirmed = false;
  }

  if (flameCounter >= CONFIRM_COUNT) {
    fireConfirmed = true;
  }

  Serial.print("Fire count  : ");
  Serial.print(flameCounter);
  Serial.print("/");
  Serial.println(CONFIRM_COUNT);
  Serial.print("Fire Status : ");
  Serial.println(fireConfirmed ? "FIRE CONFIRMED!" : "No Fire");

  // ── MQ Analog Read ─────────────────────────────
  mq2Raw     = analogRead(MQ2_ANALOG_PIN);
  mq9Raw     = analogRead(MQ9_ANALOG_PIN);
  mq2Percent = map(mq2Raw, 0, 4095, 0, 100);
  mq9Percent = map(mq9Raw, 0, 4095, 0, 100);

  bool mq2Alert = mq2Raw > GAS_THRESHOLD;
  bool mq9Alert = mq9Raw > GAS_THRESHOLD;

  // ── Buzzer Control ─────────────────────────────
  if (fireConfirmed || mq2Alert || mq9Alert) {
    buzzerAlarm();
  } else {
    digitalWrite(BUZZER_PIN, LOW);
  }

  // ── Full Print Every 2 Seconds ─────────────────
  static unsigned long lastRead = 0;
  if (millis() - lastRead >= 2000) {
    lastRead = millis();

    // DHT22
    float h = dht.readHumidity();
    float t = dht.readTemperature();
    if (!isnan(t)) temperature = t;
    if (!isnan(h)) humidity    = h;

    // Rain
    isRaining   = digitalRead(RAIN_DIGITAL_PIN) == LOW;
    int rawRain = analogRead(RAIN_ANALOG_PIN);
    rainPercent = map(rawRain, 4095, 0, 0, 100);

    // Rain alerts
    if (isRaining && !lastRainState) {
      Serial.println("Rain Started!"); buzzerBeep(2);
    }
    if (!isRaining && lastRainState) {
      Serial.println("Rain Stopped!"); buzzerBeep(1);
    }
    lastRainState = isRaining;

    if (temperature > 38.0) {
      Serial.println("HIGH TEMPERATURE WARNING!"); buzzerBeep(3);
    }
    if (humidity > 85.0) {
      Serial.println("HIGH HUMIDITY WARNING!"); buzzerBeep(2);
    }

    // WiFi status check
    Serial.println("---- WiFi ----");
    if (WiFi.status() == WL_CONNECTED) {
      Serial.print("Status  : Connected");
      Serial.print("  IP: "); Serial.print(WiFi.localIP());
      Serial.print("  Signal: "); Serial.print(WiFi.RSSI()); Serial.println(" dBm");
    } else {
      Serial.println("Status  : Disconnected! Reconnecting...");
      connectWiFi();
    }

    Serial.println("========================================");
    Serial.print("Temperature : "); Serial.print(temperature, 1); Serial.println(" C");
    Serial.print("Humidity    : "); Serial.print(humidity, 1);    Serial.println(" %");
    Serial.print("Rain        : "); Serial.print(rainPercent);    Serial.print(" % | "); Serial.println(rainLabel());
    Serial.println("---- MQ-2 (Smoke/LPG/CO) ----");
    Serial.print("Raw         : "); Serial.println(mq2Raw);
    Serial.print("Percentage  : "); Serial.print(mq2Percent); Serial.println(" %");
    Serial.print("Status      : "); Serial.println(gasLabel(mq2Raw));
    Serial.println("---- MQ-9 (CO/Flammable Gas) ----");
    Serial.print("Raw         : "); Serial.println(mq9Raw);
    Serial.print("Percentage  : "); Serial.print(mq9Percent); Serial.println(" %");
    Serial.print("Status      : "); Serial.println(gasLabel(mq9Raw));
    Serial.println("========================================");
    Serial.println();
  }

  delay(100);
}