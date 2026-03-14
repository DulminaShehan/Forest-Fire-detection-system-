#include <WiFi.h>
#include "DHT.h"

#define LED_PIN 2      // Built-in LED
#define DHTPIN 4       // DHT sensor DATA pin
#define DHTTYPE DHT22  // DHT22 or DHT11

#define FLAME_PIN 15   // Connect D1 to GPIO15

const char* ssid = "Dulmina";
const char* password = "dula1790";

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  pinMode(FLAME_PIN, INPUT);

  // WiFi connection
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.println("WiFi Connected ✅");
  Serial.print("ESP32 IP Address: ");
  Serial.println(WiFi.localIP());

  // Start DHT sensor
  dht.begin();
}

void loop() {
  // Blink LED
  digitalWrite(LED_PIN, HIGH);
  delay(500);
  digitalWrite(LED_PIN, LOW);
  delay(500);

  // Read DHT22
  float tempC = dht.readTemperature();
  float hum = dht.readHumidity();
  if (isnan(tempC) || isnan(hum)) {
    Serial.println("Failed to read from DHT sensor!");
  } else {
    Serial.print("Temperature: ");
    Serial.print(tempC);
    Serial.print(" °C, Humidity: ");
    Serial.print(hum);
    Serial.println(" %");
  }

  // Read Flame sensor
  int flameState = digitalRead(FLAME_PIN);
  if (flameState == LOW) { // LOW = flame detected (depends on module)
    Serial.println("🔥 Flame Detected!");
    digitalWrite(LED_PIN, HIGH); // Turn LED ON
  } else {
    Serial.println("No Flame");
  }

  delay(1000);
}