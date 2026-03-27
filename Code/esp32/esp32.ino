#include "DHT.h"
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <TinyGPS++.h>
#include <HardwareSerial.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

const char* ssid     = "Dulmina";
const char* password = "dula1790";

#define DEVICE_ID    "device_01"
#define API_KEY      "AIzaSyCmoWFcH_9xC53dT7j-XvUo74Td0J-dLv4"
#define DATABASE_URL "https://forestfiresysterm-default-rtdb.asia-southeast1.firebasedatabase.app"

FirebaseData   fbdo;
FirebaseData   fbdo2;
FirebaseAuth   auth;
FirebaseConfig config;

bool firebaseReady = false;
bool signupDone    = false;

TinyGPSPlus gps;
HardwareSerial gpsSerial(1);
#define GPS_RX_PIN  16
#define GPS_TX_PIN  17

float gpsLat   = 0;
float gpsLng   = 0;
float gpsAlt   = 0;
float gpsSpeed = 0;
int   gpsSats  = 0;
bool  gpsFixed = false;

#define DHTPIN           4
#define DHTTYPE          DHT22
#define RAIN_DIGITAL_PIN 27
#define RAIN_ANALOG_PIN  33
#define MQ2_ANALOG_PIN   34
#define MQ9_ANALOG_PIN   35
#define FLAME_1_PIN      36
#define FLAME_2_PIN      39
#define FLAME_3_PIN      32
#define FLAME_4_PIN      25
#define FLAME_5_PIN      13
#define FLAME_6_PIN      14
#define FLAME_7_PIN      12
#define FLAME_8_PIN      15
#define FLAME_9_PIN      2
#define FLAME_10_PIN     5
#define VOLTAGE_PIN      26   // ← changed to 26

#define VOLTAGE_R1       30000.0
#define VOLTAGE_R2        7500.0
#define VOLTAGE_REF          3.3
#define VOLTAGE_ADC_MAX   4095.0
#define BATTERY_MAX          8.4
#define BATTERY_MIN          6.0

#define GAS_THRESHOLD   1000
#define FIRE_THRESHOLD  1500
#define CONFIRM_COUNT   5
#define RAIN_THRESHOLD  400

DHT dht(DHTPIN, DHTTYPE);

float temperature   = 0;
float humidity      = 0;
int   rainPercent   = 0;
int   rainRaw       = 0;
bool  isRaining     = false;
int   mq2Raw        = 0;
int   mq9Raw        = 0;
int   mq2Percent    = 0;
int   mq9Percent    = 0;
bool  lastRainState = false;
bool  fireConfirmed = false;
bool  lastFireState = false;
int   flameRaw[10]  = {0,0,0,0,0,0,0,0,0,0};
float batteryVoltage = 0;
int   batteryPercent = 0;
String batteryStatus = "Unknown";

const char* rainLabel() {
  if (rainPercent == 0)  return "No Rain";
  if (rainPercent <= 30) return "Light Rain";
  if (rainPercent <= 60) return "Moderate Rain";
  return "Heavy Rain";
}

const char* gasLabel(int r) {
  if (r < 500)  return "Safe";
  if (r < 1000) return "Low";
  if (r < 2000) return "Medium";
  if (r < 3000) return "High";
  return "DANGER";
}

const char* flameLabel(int r) {
  if (r > 3000) return "No Fire";
  if (r > 2000) return "Far";
  if (r > 1500) return "Medium";
  if (r > 500)  return "Close";
  return "VERY CLOSE";
}

void readBattery() {
  int total = 0;
  for (int i = 0; i < 20; i++) {
    total += analogRead(VOLTAGE_PIN);
    delay(2);
  }
  float avgRaw     = total / 20.0;
  float adcVoltage = (avgRaw / VOLTAGE_ADC_MAX) * VOLTAGE_REF;
  batteryVoltage   = adcVoltage * ((VOLTAGE_R1 + VOLTAGE_R2) / VOLTAGE_R2);
  batteryPercent   = constrain(map(
    (int)(batteryVoltage * 100),
    (int)(BATTERY_MIN * 100),
    (int)(BATTERY_MAX * 100),
    0, 100), 0, 100);

  if      (batteryPercent >= 80) batteryStatus = "Full";
  else if (batteryPercent >= 60) batteryStatus = "Good";
  else if (batteryPercent >= 40) batteryStatus = "Medium";
  else if (batteryPercent >= 20) batteryStatus = "Low";
  else                           batteryStatus = "Critical";
}

void readGPS() {
  unsigned long start = millis();
  while (millis() - start < 300) {
    while (gpsSerial.available()) gps.encode(gpsSerial.read());
  }
  gpsSats = gps.satellites.value();
  if (gps.location.isValid()) {
    gpsFixed = true;
    gpsLat   = gps.location.lat();
    gpsLng   = gps.location.lng();
    gpsAlt   = gps.altitude.meters();
    gpsSpeed = gps.speed.kmph();
  } else {
    gpsFixed = false;
  }
}

bool readFlameSensors() {
  flameRaw[0] = analogRead(FLAME_1_PIN);
  flameRaw[1] = analogRead(FLAME_2_PIN);
  flameRaw[2] = analogRead(FLAME_3_PIN);
  flameRaw[3] = analogRead(FLAME_4_PIN);
  flameRaw[4] = analogRead(FLAME_5_PIN);
  flameRaw[5] = analogRead(FLAME_6_PIN);
  flameRaw[6] = analogRead(FLAME_7_PIN);
  flameRaw[7] = analogRead(FLAME_8_PIN);
  flameRaw[8] = analogRead(FLAME_9_PIN);
  flameRaw[9] = analogRead(FLAME_10_PIN);

  bool anyFire = false;
  Serial.println(F("---- Flame ----"));
  for (int i = 0; i < 10; i++) {
    Serial.print(F("S")); Serial.print(i + 1);
    Serial.print(F(": ")); Serial.print(flameRaw[i]);
    Serial.print(F(" -> ")); Serial.println(flameLabel(flameRaw[i]));
    if (flameRaw[i] < FIRE_THRESHOLD) anyFire = true;
  }
  return anyFire;
}

void sendFlameToFirebase() {
  if (!Firebase.ready() || !signupDone) return;
  FirebaseJson json;
  for (int i = 0; i < 10; i++) {
    json.set("s" + String(i + 1), flameRaw[i]);
  }
  if (Firebase.RTDB.setJSON(&fbdo2,
      "/devices/device_01/sensors/flame", &json)) {
    Serial.println(F("Flame OK!"));
  } else {
    Serial.print(F("Flame fail: "));
    Serial.println(fbdo2.errorReason());
  }
}

void sendToFirebase() {
  if (!Firebase.ready() || !signupDone) return;

  Serial.print(F("Sending... "));
  String b = "/devices/device_01";

  FirebaseJson sJson;
  sJson.set("temperature",    temperature);
  sJson.set("humidity",       humidity);
  sJson.set("rain_raw",       rainRaw);
  sJson.set("rain_percent",   rainPercent);
  sJson.set("rain_status",    rainLabel());
  sJson.set("is_raining",     isRaining);
  sJson.set("mq2_raw",        mq2Raw);
  sJson.set("mq2_percent",    mq2Percent);
  sJson.set("mq2_status",     gasLabel(mq2Raw));
  sJson.set("mq9_raw",        mq9Raw);
  sJson.set("mq9_percent",    mq9Percent);
  sJson.set("mq9_status",     gasLabel(mq9Raw));
  sJson.set("fire_confirmed", fireConfirmed);
  Firebase.RTDB.setJSON(&fbdo, (b+"/sensors").c_str(), &sJson);

  FirebaseJson gJson;
  gJson.set("fixed",      gpsFixed);
  gJson.set("satellites", gpsSats);
  if (gpsFixed) {
    gJson.set("latitude",  gpsLat);
    gJson.set("longitude", gpsLng);
    gJson.set("altitude",  gpsAlt);
    gJson.set("speed",     gpsSpeed);
    String mapsLink = "https://maps.google.com/?q=";
    mapsLink += String(gpsLat, 6) + "," + String(gpsLng, 6);
    gJson.set("maps_link", mapsLink.c_str());
  }
  Firebase.RTDB.setJSON(&fbdo, (b+"/gps").c_str(), &gJson);

  FirebaseJson bJson;
  bJson.set("voltage", batteryVoltage);
  bJson.set("percent", batteryPercent);
  bJson.set("status",  batteryStatus.c_str());
  Firebase.RTDB.setJSON(&fbdo, (b+"/battery").c_str(), &bJson);

  FirebaseJson iJson;
  iJson.set("device_id", DEVICE_ID);
  iJson.set("status",    "online");
  iJson.set("uptime",    (int)(millis()/1000));
  Firebase.RTDB.setJSON(&fbdo, (b+"/info").c_str(), &iJson);

  bool mq2Alert = mq2Raw > GAS_THRESHOLD;
  bool mq9Alert = mq9Raw > GAS_THRESHOLD;
  FirebaseJson aJson;
  aJson.set("fire",        fireConfirmed);
  aJson.set("gas",         mq2Alert || mq9Alert);
  aJson.set("rain",        isRaining);
  aJson.set("battery_low", batteryPercent < 20);
  Firebase.RTDB.setJSON(&fbdo, (b+"/alerts").c_str(), &aJson);

  Serial.println(F("Done!"));
  sendFlameToFirebase();
}

void connectWiFi() {
  Serial.print(F("Connecting WiFi..."));
  WiFi.begin(ssid, password);
  int attempt = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(F("."));
    if (++attempt > 40) { Serial.println(F("FAILED!")); return; }
  }
  Serial.println();
  Serial.print(F("IP: ")); Serial.println(WiFi.localIP());
  Serial.print(F("Signal: ")); Serial.print(WiFi.RSSI()); Serial.println(F(" dBm"));
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  Serial.println(F("GPS started GPIO 16/17"));

  dht.begin();
  delay(2000);

  pinMode(RAIN_DIGITAL_PIN, INPUT);
  pinMode(VOLTAGE_PIN,      INPUT);
  pinMode(FLAME_6_PIN,  INPUT);
  pinMode(FLAME_7_PIN,  INPUT);
  pinMode(FLAME_8_PIN,  INPUT);
  pinMode(FLAME_9_PIN,  INPUT);
  pinMode(FLAME_10_PIN, INPUT);

  Serial.println(F("========================================"));
  Serial.println(F("  ESP32 Forest Fire [device_01] + GPS"));
  Serial.println(F("  Voltage sensor on GPIO 26"));
  Serial.println(F("========================================"));

  float testH = dht.readHumidity();
  float testT = dht.readTemperature();
  if (isnan(testH) || isnan(testT)) {
    Serial.println(F("DHT22: FAILED!"));
  } else {
    Serial.println(F("DHT22: OK"));
    Serial.print(F("Temp: ")); Serial.print(testT, 1); Serial.println(F(" C"));
    Serial.print(F("Hum : ")); Serial.print(testH, 1); Serial.println(F(" %"));
  }

  // Battery test
  readBattery();
  Serial.print(F("Battery raw ADC : ")); Serial.println(analogRead(VOLTAGE_PIN));
  Serial.print(F("Battery voltage : ")); Serial.print(batteryVoltage, 2); Serial.println(F(" V"));
  Serial.print(F("Battery percent : ")); Serial.print(batteryPercent); Serial.println(F(" %"));
  Serial.print(F("Battery status  : ")); Serial.println(batteryStatus);
  if (batteryVoltage < 0.1) {
    Serial.println(F("WARNING: 0V! Check S->GPIO26 +->Battery+ -->GND"));
  }

  int dryTest = analogRead(RAIN_ANALOG_PIN);
  Serial.print(F("Rain dry: ")); Serial.println(dryTest);

  Serial.println(F("Warming up MQ 60 seconds..."));
  for (int i = 60; i > 0; i--) {
    while (gpsSerial.available()) gps.encode(gpsSerial.read());
    Serial.print(i);
    Serial.print(F("s MQ2:")); Serial.print(analogRead(MQ2_ANALOG_PIN));
    Serial.print(F(" MQ9:")); Serial.print(analogRead(MQ9_ANALOG_PIN));
    Serial.print(F(" GPS:")); Serial.println(gps.satellites.value());
    delay(1000);
  }
  Serial.println(F("MQ ready!"));

  connectWiFi();

  config.api_key      = API_KEY;
  config.database_url = DATABASE_URL;
  config.token_status_callback = tokenStatusCallback;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  int attempt = 0;
  while (!signupDone) {
    if (Firebase.signUp(&config, &auth, "", "")) {
      Serial.println(F("Firebase OK!"));
      signupDone = true; firebaseReady = true;
    } else {
      if (++attempt >= 5) { Serial.println(F("Firebase FAILED!")); break; }
      delay(2000);
    }
  }

  Serial.println(F("========================================"));
  Serial.println(firebaseReady ? F("System Ready!") : F("No Firebase"));
  Serial.println(F("========================================"));
}

void loop() {

  while (gpsSerial.available()) gps.encode(gpsSerial.read());

  bool rawFire = readFlameSensors();
  static int flameCounter = 0;

  if (rawFire) {
    if (flameCounter < CONFIRM_COUNT) flameCounter++;
  } else {
    flameCounter  = 0;
    fireConfirmed = false;
  }
  if (flameCounter >= CONFIRM_COUNT) fireConfirmed = true;

  if (fireConfirmed && !lastFireState) {
    Serial.println(F("FIRE CONFIRMED!"));
    FirebaseJson aJson;
    aJson.set("fire",        true);
    aJson.set("gas",         mq2Raw > GAS_THRESHOLD);
    aJson.set("rain",        isRaining);
    aJson.set("battery_low", batteryPercent < 20);
    Firebase.RTDB.setJSON(&fbdo,
      "/devices/device_01/alerts", &aJson);
  }
  lastFireState = fireConfirmed;

  Serial.print(F("Fire: ")); Serial.print(flameCounter);
  Serial.print(F("/")); Serial.print(CONFIRM_COUNT);
  Serial.print(F(" ")); Serial.println(fireConfirmed ? F("FIRE!") : F("OK"));

  mq2Raw     = analogRead(MQ2_ANALOG_PIN);
  mq9Raw     = analogRead(MQ9_ANALOG_PIN);
  mq2Percent = map(mq2Raw, 0, 4095, 0, 100);
  mq9Percent = map(mq9Raw, 0, 4095, 0, 100);

  static unsigned long lastRead = 0;
  if (millis() - lastRead >= 2000) {
    lastRead = millis();

    float h = dht.readHumidity();
    float t = dht.readTemperature();
    if (!isnan(t)) temperature = t;
    if (!isnan(h)) humidity    = h;

    rainRaw     = analogRead(RAIN_ANALOG_PIN);
    rainPercent = map(rainRaw, 4095, 0, 0, 100);
    isRaining   = rainRaw < RAIN_THRESHOLD;

    readBattery();
    readGPS();

    if (isRaining  && !lastRainState) Serial.println(F("Rain Started!"));
    if (!isRaining && lastRainState)  Serial.println(F("Rain Stopped!"));
    lastRainState = isRaining;

    if (temperature > 38.0)     Serial.println(F("HIGH TEMP!"));
    if (humidity    > 85.0)     Serial.println(F("HIGH HUMIDITY!"));
    if (mq2Raw > GAS_THRESHOLD) Serial.println(F("MQ-2 ALERT!"));
    if (mq9Raw > GAS_THRESHOLD) Serial.println(F("MQ-9 ALERT!"));
    if (batteryPercent < 20)    Serial.println(F("BATTERY LOW!"));
    if (fireConfirmed)          Serial.println(F("FIRE CONFIRMED!"));

    if (WiFi.status() != WL_CONNECTED) connectWiFi();

    Serial.println(F("========================================"));
    Serial.print(F("Temp    : ")); Serial.print(temperature, 1); Serial.println(F(" C"));
    Serial.print(F("Hum     : ")); Serial.print(humidity, 1);    Serial.println(F(" %"));
    Serial.print(F("Rain    : ")); Serial.print(rainRaw);
    Serial.print(F(" | ")); Serial.print(rainPercent);
    Serial.print(F("% | ")); Serial.println(rainLabel());
    Serial.print(F("Raining : ")); Serial.println(isRaining ? F("YES") : F("NO"));
    Serial.print(F("MQ2     : ")); Serial.print(mq2Raw);
    Serial.print(F(" | ")); Serial.println(gasLabel(mq2Raw));
    Serial.print(F("MQ9     : ")); Serial.print(mq9Raw);
    Serial.print(F(" | ")); Serial.println(gasLabel(mq9Raw));
    Serial.println(F("---- Battery ----"));
    Serial.print(F("Voltage : ")); Serial.print(batteryVoltage, 2); Serial.println(F(" V"));
    Serial.print(F("Percent : ")); Serial.print(batteryPercent);    Serial.println(F(" %"));
    Serial.print(F("Status  : ")); Serial.println(batteryStatus);
    Serial.println(F("---- GPS ----"));
    Serial.print(F("Fixed   : ")); Serial.println(gpsFixed ? F("YES") : F("NO"));
    Serial.print(F("Sats    : ")); Serial.println(gpsSats);
    if (gpsFixed) {
      Serial.print(F("Lat     : ")); Serial.println(gpsLat, 6);
      Serial.print(F("Lng     : ")); Serial.println(gpsLng, 6);
      Serial.print(F("Alt     : ")); Serial.print(gpsAlt, 1); Serial.println(F(" m"));
      Serial.print(F("Speed   : ")); Serial.print(gpsSpeed, 1); Serial.println(F(" km/h"));
      Serial.print(F("Map     : https://maps.google.com/?q="));
      Serial.print(gpsLat, 6); Serial.print(F(","));
      Serial.println(gpsLng, 6);
    }
    Serial.println(F("========================================"));
    Serial.println();

    sendToFirebase();
  }

  delay(100);
}
