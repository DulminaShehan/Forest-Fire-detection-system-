#include <WiFi.h>
#include "DHT.h"

#define LED_PIN 2      // Built-in LED
#define DHTPIN 4       // DHT sensor DATA pin
#define DHTTYPE DHT22  // Change to DHT11 if using that

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

  // DHT sensor
  dht.begin();
}

void loop() {
  // Blink LED
  digitalWrite(LED_PIN, HIGH);
  delay(500);
  digitalWrite(LED_PIN, LOW);
  delay(500);

  // Read temperature & humidity
  float tempC = dht.readTemperature();
  float hum = dht.readHumidity();

  if (isnan(tempC) || isnan(hum)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  Serial.print("Temperature: ");
  Serial.print(tempC);
  Serial.print(" °C, Humidity: ");
  Serial.print(hum);
  Serial.println(" %");
}