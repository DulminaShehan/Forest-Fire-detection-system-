#include "DHT.h"

// DHT22 Setup
#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// Flame Sensor Pins
#define FLAME_1 34
#define FLAME_2 35
#define FLAME_3 32
#define FLAME_4 33
#define FLAME_5 25

// Buzzer Pin
#define BUZZER_PIN 26

// ── Debounce Settings ──────────────────────────
// How many consecutive detections before confirming fire
#define CONFIRM_COUNT 5      // must detect 5 times in a row
#define CHECK_INTERVAL 100   // check every 100ms

int flameCounter = 0;        // counts consecutive detections
bool fireConfirmed = false;

void setup() {
  Serial.begin(115200);
  dht.begin();

  pinMode(FLAME_1, INPUT);
  pinMode(FLAME_2, INPUT);
  pinMode(FLAME_3, INPUT);
  pinMode(FLAME_4, INPUT);
  pinMode(FLAME_5, INPUT);

  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  Serial.println("Fire Detection System Ready...");
}

bool readFlameSensors() {
  bool flame1 = digitalRead(FLAME_1) == LOW;
  bool flame2 = digitalRead(FLAME_2) == LOW;
  bool flame3 = digitalRead(FLAME_3) == LOW;
  bool flame4 = digitalRead(FLAME_4) == LOW;
  bool flame5 = digitalRead(FLAME_5) == LOW;

  // Show which sensor triggered
  if (flame1 || flame2 || flame3 || flame4 || flame5) {
    Serial.print("Sensor triggered → ");
    if (flame1) Serial.print("S1 ");
    if (flame2) Serial.print("S2 ");
    if (flame3) Serial.print("S3 ");
    if (flame4) Serial.print("S4 ");
    if (flame5) Serial.print("S5 ");
    Serial.println();
  }

  return flame1 || flame2 || flame3 || flame4 || flame5;
}

void loop() {
  delay(CHECK_INTERVAL);

  bool rawFire = readFlameSensors();

  // ── Debounce Logic ─────────────────────────────
  if (rawFire) {
    flameCounter++;
    Serial.print("Detection count: ");
    Serial.print(flameCounter);
    Serial.print(" / ");
    Serial.println(CONFIRM_COUNT);
  } else {
    // Reset counter if no fire reading
    if (flameCounter > 0) {
      Serial.println("False signal cleared.");
    }
    flameCounter = 0;
    fireConfirmed = false;
  }

  // Only confirm fire after CONFIRM_COUNT consecutive reads
  if (flameCounter >= CONFIRM_COUNT) {
    fireConfirmed = true;
  }

  // ── DHT22 Reading (every 2 seconds) ────────────
  static unsigned long lastDHTRead = 0;
  if (millis() - lastDHTRead >= 2000) {
    lastDHTRead = millis();

    float humidity    = dht.readHumidity();
    float temperature = dht.readTemperature();

    if (!isnan(temperature) && !isnan(humidity)) {
      Serial.print("Temp: ");
      Serial.print(temperature);
      Serial.print(" °C  |  Humidity: ");
      Serial.print(humidity);
      Serial.println(" %");

      if (temperature > 50.0) {
        fireConfirmed = true;
        Serial.println("⚠️  HIGH TEMPERATURE DETECTED!");
      }
    }
  }

  // ── Buzzer Control ─────────────────────────────
  if (fireConfirmed) {
    Serial.println("🔥 FIRE CONFIRMED! BUZZER ON!");
    digitalWrite(BUZZER_PIN, HIGH);
    delay(100);
    digitalWrite(BUZZER_PIN, LOW);
    delay(100);
  } else {
    digitalWrite(BUZZER_PIN, LOW);
    Serial.println("✅ All Clear.");
  }

  Serial.println("─────────────────────────────────────────");
}
