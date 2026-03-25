#include "esp_camera.h"
#include "soc/rtc_cntl_reg.h"
#include "soc/soc.h"
#include <WiFi.h>
#include <WebServer.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"

// ── Credentials ───────────────────────────────
#define WIFI_SSID   "Dulmina"
#define WIFI_PASS   "dula1790"
#define API_KEY     "AIzaSyCmoWFcH_9xC53dT7j-XvUo74Td0J-dLv4"
#define DB_URL      "https://forestfiresysterm-default-rtdb.asia-southeast1.firebasedatabase.app"
#define DEVICE_PATH "/devices/device_01"

// ── Camera Pins ───────────────────────────────
#define PWDN  32
#define RESET -1
#define XCLK   0
#define SIOD  26
#define SIOC  27
#define D7    35
#define D6    34
#define D5    39
#define D4    36
#define D3    21
#define D2    19
#define D1    18
#define D0     5
#define VSYNC 25
#define HREF  23
#define PCLK  22

FirebaseData   fbdo;
FirebaseAuth   auth;
FirebaseConfig cfg;
WebServer      server(80);

bool fbReady    = false;
bool lastFire   = false;
int  photoCount = 0;

// ── Camera Init ───────────────────────────────
bool initCam() {
  camera_config_t c;
  c.ledc_channel = LEDC_CHANNEL_0;
  c.ledc_timer   = LEDC_TIMER_0;
  c.pin_d0=D0; c.pin_d1=D1; c.pin_d2=D2; c.pin_d3=D3;
  c.pin_d4=D4; c.pin_d5=D5; c.pin_d6=D6; c.pin_d7=D7;
  c.pin_xclk=XCLK; c.pin_pclk=PCLK; c.pin_vsync=VSYNC;
  c.pin_href=HREF; c.pin_sscb_sda=SIOD; c.pin_sscb_scl=SIOC;
  c.pin_pwdn=PWDN; c.pin_reset=RESET;
  c.xclk_freq_hz = 20000000;
  c.pixel_format = PIXFORMAT_JPEG;

  if (psramFound()) {
    c.frame_size   = FRAMESIZE_VGA;
    c.jpeg_quality = 12;
    c.fb_count     = 2;
    c.fb_location  = CAMERA_FB_IN_PSRAM;
    c.grab_mode    = CAMERA_GRAB_LATEST;
    Serial.println(F("PSRAM found!"));
  } else {
    c.frame_size   = FRAMESIZE_QVGA;
    c.jpeg_quality = 15;
    c.fb_count     = 1;
    c.fb_location  = CAMERA_FB_IN_DRAM;
    c.grab_mode    = CAMERA_GRAB_WHEN_EMPTY;
    Serial.println(F("No PSRAM"));
  }

  if (esp_camera_init(&c) != ESP_OK) {
    Serial.println(F("CAM FAIL")); return false;
  }
  Serial.println(F("CAM OK"));
  return true;
}

// ── Firebase Init ─────────────────────────────
void initFirebase() {
  cfg.api_key      = API_KEY;
  cfg.database_url = DB_URL;
  cfg.token_status_callback = tokenStatusCallback;
  Firebase.begin(&cfg, &auth);
  Firebase.reconnectWiFi(true);

  for (int i = 0; i < 5; i++) {
    if (Firebase.signUp(&cfg, &auth, "", "")) {
      fbReady = true;
      Serial.println(F("Firebase OK!"));
      FirebaseJson j;
      j.set("status", "online");
      j.set("ip",     WiFi.localIP().toString().c_str());
      j.set("active", false);
      Firebase.RTDB.setJSON(&fbdo,
        DEVICE_PATH"/camera/info", &j);
      return;
    }
    delay(2000);
  }
  Serial.println(F("Firebase FAILED!"));
}

// ── Take Photo ────────────────────────────────
void snap(const char* reason) {
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) { Serial.println(F("SNAP FAIL")); return; }

  photoCount++;
  Serial.print(F("Photo #")); Serial.print(photoCount);
  Serial.print(F(" ")); Serial.print(fb->len); Serial.println(F(" bytes"));

  if (fbReady) {
    FirebaseJson j;
    j.set("count",     photoCount);
    j.set("reason",    reason);
    j.set("timestamp", (int)(millis()/1000));
    j.set("size",      (int)fb->len);
    Firebase.RTDB.setJSON(&fbdo,
      DEVICE_PATH"/camera/last_photo", &j);
    Firebase.RTDB.setBool(&fbdo,
      DEVICE_PATH"/camera/active", true);
    Serial.println(F("Saved to Firebase!"));
  }

  esp_camera_fb_return(fb);
}

// ── Check Firebase Fire Alert ─────────────────
void checkFire() {
  if (!fbReady) return;
  if (!Firebase.RTDB.getBool(&fbdo,
      DEVICE_PATH"/alerts/fire")) return;

  bool fire = fbdo.boolData();

  if (fire && !lastFire) {
    Serial.println(F("FIRE! Taking photo..."));
    snap("fire_detected");
  }
  if (!fire && lastFire) {
    Serial.println(F("Fire cleared"));
    Firebase.RTDB.setBool(&fbdo,
      DEVICE_PATH"/camera/active", false);
  }
  lastFire = fire;
}

// ── Web Routes ────────────────────────────────
void onPhoto() {
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) { server.send(500, "text/plain", "Camera failed"); return; }
  photoCount++;
  Serial.print(F("Manual photo #")); Serial.println(photoCount);
  server.sendHeader("Content-Type", "image/jpeg");
  server.sendHeader("Content-Disposition", "inline; filename=photo.jpg");
  server.send_P(200, "image/jpeg", (const char*)fb->buf, fb->len);
  esp_camera_fb_return(fb);
}

void onStatus() {
  String s = "";
  s += "IP      : " + WiFi.localIP().toString() + "\n";
  s += "Signal  : " + String(WiFi.RSSI()) + " dBm\n";
  s += "PSRAM   : " + String(psramFound() ? "YES" : "NO") + "\n";
  s += "Firebase: " + String(fbReady ? "OK" : "NO") + "\n";
  s += "Photos  : " + String(photoCount) + "\n";
  s += "Fire    : " + String(lastFire ? "YES" : "NO") + "\n";
  server.send(200, "text/plain", s);
}

// ── WiFi Connect ──────────────────────────────
void connectWiFi() {
  Serial.print(F("Connecting WiFi..."));
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  for (int i = 0; i < 40 && WiFi.status() != WL_CONNECTED; i++) {
    delay(500); Serial.print(F("."));
  }
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("WiFi FAILED!")); return;
  }
  Serial.println();
  Serial.print(F("IP: ")); Serial.println(WiFi.localIP());
  Serial.print(F("Signal: ")); Serial.print(WiFi.RSSI()); Serial.println(F(" dBm"));
}

// ── Setup ─────────────────────────────────────
void setup() {
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);
  Serial.begin(115200);
  delay(500);

  Serial.println(F("========================================"));
  Serial.println(F("      ESP32-CAM + Firebase"));
  Serial.println(F("========================================"));

  if (!initCam()) {
    Serial.println(F("Camera FAILED! Halting."));
    while (true) delay(1000);
  }

  connectWiFi();
  initFirebase();

  server.on("/photo",  onPhoto);
  server.on("/status", onStatus);
  server.begin();

  Serial.println(F("========================================"));
  Serial.print(F("Photo : http://")); Serial.print(WiFi.localIP()); Serial.println(F("/photo"));
  Serial.print(F("Status: http://")); Serial.print(WiFi.localIP()); Serial.println(F("/status"));
  Serial.println(F("Watching Firebase for fire alerts..."));
  Serial.println(F("========================================"));
}

// ── Loop ──────────────────────────────────────
void loop() {
  server.handleClient();

  static unsigned long t = 0;
  if (millis() - t >= 2000) {
    t = millis();
    checkFire();
  }
}