#include <WiFi.h>

const char* ssid = "Dulmina";
const char* password = "dula1790";

#define LED 2

void setup() {
  Serial.begin(115200);
  delay(1000);   // Important for serial start

  pinMode(LED, OUTPUT);

  Serial.println();
  Serial.println("Starting ESP32...");
  Serial.println("Connecting to WiFi");

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  digitalWrite(LED, HIGH);
}

void loop() {
}