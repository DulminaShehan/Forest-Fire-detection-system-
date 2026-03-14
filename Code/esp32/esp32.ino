#include <WiFi.h>
#include "DHT.h"

#define LED_PIN 2
#define DHTPIN 4
#define DHTTYPE DHT22

#define FLAME_ANALOG_PIN 34  // Flame AO
#define LDR_PIN 35           // LDR analog pin

const char* ssid = "Dulmina";
const char* password = "dula1790";

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);

  // WiFi
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
    Serial.println("Failed to read DHT sensor!");
  } else {
    Serial.print("Temp: ");
    Serial.print(tempC);
    Serial.print(" °C, Hum: ");
    Serial.print(hum);
    Serial.println(" %");
  }

  // Read Flame analog sensor
  int flameValue = analogRead(FLAME_ANALOG_PIN);
  Serial.print("Flame Analog Value: ");
  Serial.println(flameValue);

  // Read LDR analog sensor
  int ldrValue = analogRead(LDR_PIN);
  Serial.print("LDR Analog Value: ");
  Serial.println(ldrValue);

  delay(1000);
}