# 🌲🔥 Forest Fire Detection System

A real-time forest fire detection and monitoring system using ESP32, multiple sensors, Firebase, and a React web/mobile app.

---

## 📋 Table of Contents

- [System Overview](#system-overview)
- [Hardware Components](#hardware-components)
- [Pin Connections](#pin-connections)
- [Software Requirements](#software-requirements)
- [Firebase Setup](#firebase-setup)
- [ESP32 Setup](#esp32-setup)
- [ESP32-CAM Setup](#esp32-cam-setup)
- [Web App Setup](#web-app-setup)
- [User Roles](#user-roles)
- [Firebase Data Structure](#firebase-data-structure)
- [Troubleshooting](#troubleshooting)

---

## 🏗 System Overview

```
┌─────────────────┐     WiFi      ┌──────────────────┐
│   ESP32 Main    │ ──────────── │   ESP32-CAM      │
│   (Sensors)     │              │   (Camera)        │
└────────┬────────┘              └────────┬─────────┘
         │                                │
         │         Firebase RTDB          │
         └──────────────┬─────────────────┘
                        │
              ┌─────────┴──────────┐
              │                    │
        ┌─────┴──────┐    ┌───────┴───────┐
        │  Web App   │    │  Mobile App   │
        │  (React)   │    │  (Capacitor)  │
        └─────┬──────┘    └───────┬───────┘
              │                    │
        ┌─────┴──────┐    ┌───────┴───────┐
        │   Hiker    │    │  Gov Officer  │
        │   View     │    │    View       │
        └────────────┘    └───────────────┘
```

---

## 🔧 Hardware Components

| Component | Quantity | Purpose |
|---|---|---|
| ESP32 Dev Module | 1 | Main sensor board |
| ESP32-CAM (AI Thinker) | 1 | Camera module |
| DHT22 | 1 | Temperature & humidity |
| Flame sensor (IR) | 10 | Fire detection zones |
| MQ-2 gas sensor | 1 | Smoke / LPG / CO detection |
| MQ-9 gas sensor | 1 | CO / flammable gas detection |
| Rain sensor | 1 | Rain detection |
| NEO-6M GPS module | 1 | Location tracking |
| Voltage sensor module | 1 | Battery monitoring |
| Solar panel (5V) | 1 | Power charging |
| 7.4V LiPo battery | 1 | Power storage |
| CP2102 USB-TTL | 1 | ESP32-CAM programming |

---

## 📌 Pin Connections

### ESP32 Main Board

| Sensor | Pin | ESP32 GPIO |
|---|---|---|
| DHT22 DATA | Signal | GPIO 4 |
| DHT22 VCC | Power | 3.3V |
| Rain sensor D0 | Digital | GPIO 27 |
| Rain sensor A0 | Analog | GPIO 33 |
| MQ-2 A0 | Analog | GPIO 34 |
| MQ-9 A0 | Analog | GPIO 35 |
| Flame sensor 1 | Analog | GPIO 36 (VP) |
| Flame sensor 2 | Analog | GPIO 39 (VN) |
| Flame sensor 3 | Analog | GPIO 32 |
| Flame sensor 4 | Analog | GPIO 25 |
| Flame sensor 5 | Analog | GPIO 13 |
| Flame sensor 6 | Analog | GPIO 14 |
| Flame sensor 7 | Analog | GPIO 12 |
| Flame sensor 8 | Analog | GPIO 15 |
| Flame sensor 9 | Analog | GPIO 2 |
| Flame sensor 10 | Analog | GPIO 5 |
| GPS TX | RX | GPIO 16 |
| GPS RX | TX | GPIO 17 |
| Voltage sensor S | Signal | GPIO 26 |
| MQ-2 VCC | Power | 5V |
| MQ-9 VCC | Power | 5V |
| GPS VCC | Power | 3.3V |

### ESP32-CAM

| Component | ESP32-CAM Pin |
|---|---|
| Camera | Built-in |
| GPS TX | GPIO 12 |
| GPS RX | GPIO 13 |

### Voltage Sensor Module Wiring

```
Battery (+) ──── Module (+)
Battery (-) ──── Module (-) ──── GND
Module (S)  ──── GPIO 26
```

---

## 💻 Software Requirements

### Arduino IDE Libraries

Install these in **Sketch → Include Library → Manage Libraries**:

| Library | Author | Purpose |
|---|---|---|
| DHT sensor library | Adafruit | DHT22 sensor |
| Firebase Arduino Client Library | Mobizt | Firebase connection |
| TinyGPS++ | Mikal Hart | GPS parsing |
| esp32 board package | Espressif | ESP32 support |

### Arduino IDE Board Settings

**For ESP32 Main Board:**
| Setting | Value |
|---|---|
| Board | ESP32 Dev Module |
| Partition Scheme | Huge APP (3MB No OTA) |
| Flash Size | 4MB |
| Upload Speed | 115200 |

**For ESP32-CAM:**
| Setting | Value |
|---|---|
| Board | AI Thinker ESP32-CAM |
| Partition Scheme | Huge APP (3MB No OTA) |
| Flash Mode | QIO |
| Flash Frequency | 80MHz |

---

## 🔥 Firebase Setup

### Step 1 — Create Project
1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add Project**
3. Name it `forestfiresysterm`
4. Click **Create Project**

### Step 2 — Enable Realtime Database
1. Click **Build → Realtime Database**
2. Click **Create Database**
3. Select **Asia Southeast** region
4. Select **Start in test mode**
5. Click **Enable**

### Step 3 — Enable Authentication
1. Click **Authentication → Get Started**
2. Click **Sign-in method**
3. Enable **Email/Password**
4. Enable **Anonymous**
5. Click **Save**

### Step 4 — Set Database Rules
Go to **Realtime Database → Rules** and paste:

```json
{
  "rules": {
    "devices": {
      ".read": "auth != null",
      ".write": true
    },
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

### Step 5 — Get Credentials
Go to **Project Settings → General → Your apps → Web app**

Copy:
- `apiKey`
- `databaseURL`

---

## ⚡ ESP32 Setup

### Step 1 — Update Credentials
In `esp32.ino` update:

```cpp
const char* ssid     = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

#define API_KEY      "YOUR_FIREBASE_API_KEY"
#define DATABASE_URL "YOUR_FIREBASE_DATABASE_URL"
```

### Step 2 — Set Battery Type
Update these values based on your battery:

```cpp
#define BATTERY_MAX   8.4   // 7.4V LiPo fully charged
#define BATTERY_MIN   6.0   // 7.4V LiPo empty
```

| Battery Type | MAX | MIN |
|---|---|---|
| 7.4V LiPo (2 cell) | 8.4 | 6.0 |
| 11.1V LiPo (3 cell) | 12.6 | 9.0 |
| 12V Lead Acid | 12.7 | 11.0 |

### Step 3 — Upload
1. Connect ESP32 via USB
2. Select correct COM port
3. Click Upload
4. Open Serial Monitor at **115200 baud**

---

## 📷 ESP32-CAM Setup

### Wiring for Upload (via CP2102)

```
ESP32-CAM        CP2102
──────────────────────────
5V        →      5V
GND       →      GND
U0R (RX)  →      TXD
U0T (TX)  →      RXD
IO0       →      GND  ← MUST for upload mode
```

### Upload Steps
1. Connect IO0 to GND
2. Plug CP2102 into PC
3. Select **AI Thinker ESP32-CAM** board
4. Click Upload
5. When upload done — disconnect IO0 from GND
6. Press RESET button on ESP32-CAM
7. Open Serial Monitor to get IP address

### After Upload
Update ESP32 main code with CAM IP:
```cpp
const char* camIP = "http://192.168.x.xxx"; // your CAM IP
```

---

## 🌐 Web App Setup

### Requirements
- Node.js 18+
- npm

### Installation

```bash
cd ForestFireApp
npm install
npm start
```

Opens at **http://localhost:3000**

### Deploy to Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

Your app will be live at:
```
https://forestfiresysterm.web.app
```

### Environment
Firebase credentials are already in `src/firebase.js`

---

## 👥 User Roles

### Hiker
- Temperature and humidity
- Rain status and level
- Fire alert with alarm sound
- Simple safe/fire status display

### Government Officer
- All sensor data
- 10 flame sensor zones
- Gas sensor readings (MQ-2, MQ-9)
- GPS location with Google Maps link
- Battery status and voltage
- Sensor fault warnings
- Camera photo status

---

## 📊 Firebase Data Structure

```
devices/
└── device_01/
    ├── info/
    │   ├── device_id    → "device_01"
    │   ├── status       → "online"
    │   └── uptime       → 3600
    ├── sensors/
    │   ├── temperature  → 29.5
    │   ├── humidity     → 65.0
    │   ├── rain_raw     → 4095
    │   ├── rain_percent → 0
    │   ├── rain_status  → "No Rain"
    │   ├── is_raining   → false
    │   ├── mq2_raw      → 450
    │   ├── mq2_status   → "Safe"
    │   ├── mq9_raw      → 380
    │   ├── mq9_status   → "Safe"
    │   ├── fire_confirmed → false
    │   └── flame/
    │       ├── s1  → 3800
    │       ├── s2  → 3750
    │       └── ... s10
    ├── gps/
    │   ├── fixed        → true
    │   ├── satellites   → 6
    │   ├── latitude     → 6.927079
    │   ├── longitude    → 79.861243
    │   ├── altitude     → 12.3
    │   ├── speed        → 0.0
    │   └── maps_link    → "https://maps.google.com/?q=..."
    ├── battery/
    │   ├── voltage      → 7.40
    │   ├── percent      → 85
    │   └── status       → "Good"
    ├── alerts/
    │   ├── fire         → false
    │   ├── gas          → false
    │   ├── rain         → false
    │   └── battery_low  → false
    └── camera/
        ├── active       → false
        └── last_photo/
            ├── count    → 1
            ├── reason   → "fire_detected"
            └── timestamp → 3600

users/
└── {uid}/
    ├── name    → "John Doe"
    ├── email   → "john@example.com"
    ├── role    → "hiker" or "officer"
    └── createdAt → timestamp
```

---

## 🔧 Troubleshooting

### ESP32 Upload Fails
| Problem | Fix |
|---|---|
| No serial data received | Hold BOOT button while uploading |
| Wrong baud rate | Set to 115200 |
| COM port not showing | Install CP2102 driver |

### Sensors Not Working
| Sensor | Problem | Fix |
|---|---|---|
| DHT22 | Shows NaN | Add 10kΩ resistor DATA→VCC |
| MQ-2/9 | Shows 0 | Must use 5V power not 3.3V |
| Flame sensors | Always fire | Adjust FIRE_THRESHOLD value |
| Rain sensor | Wrong reading | Adjust RAIN_THRESHOLD value |
| GPS | No fix | Place outside or near window |
| Voltage | Shows 0V | Check + wire to battery positive |

### Firebase Issues
| Problem | Fix |
|---|---|
| Token error | Enable Anonymous auth in Firebase |
| Signup failed | Check API key and database URL |
| Data not showing | Check database rules |

### Sketch Too Big
1. Go to **Tools → Partition Scheme**
2. Select **Huge APP (3MB No OTA)**
3. Upload again

### Web App Issues
| Problem | Fix |
|---|---|
| Login fails | Enable Email/Password auth in Firebase |
| No data showing | Check Firebase database rules |
| Build fails | Run `npm install` again |

---

## 📁 Project Structure

```
ForestFireDetectionSystem/
├── Code/
│   ├── esp32/
│   │   └── esp32.ino          ← Main ESP32 code
│   └── esp32cam/
│       └── esp32cam.ino       ← ESP32-CAM code
├── ForestFireApp/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── firebase.js
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── hooks/
│   │   │   └── useSensors.js
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx
│   │   │   └── Dashboard.jsx
│   │   └── components/
│   │       └── SensorCard.jsx
│   └── package.json
└── README.md
```

---

## 🔑 Credentials Reference

> ⚠️ Keep these private — do not share publicly

| Item | Value |
|---|---|
| WiFi SSID | Dulmina |
| Firebase Project | forestfiresysterm |
| Database Region | Asia Southeast 1 |
| Device ID | device_01 |

---

## 📱 Mobile App (Android/iOS)

To build mobile app from web app:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init
npm run build
npx cap add android
npx cap sync
npx cap open android
```

Then build APK from Android Studio.

---

## 🚀 Future Improvements

- [ ] Telegram alerts when fire detected
- [ ] Email notifications
- [ ] Multiple devices (device_02, device_03)
- [ ] Historical data charts
- [ ] Firebase Storage for photos
- [ ] Push notifications on mobile

---

*Forest Fire Detection System — Built with ESP32 + Firebase + React*
