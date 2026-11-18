# Adaptive Semantic Morse-Based Optical Communication System
### Phase 1 — Mobile-to-ESP32 Optical Communication Proof of Concept

> A prototype for transmitting text and voice-derived messages as Morse-code light signals using a mobile web application and ESP32-based optical transmitter.

---

## 📌 Overview

Conventional communication systems such as cellular networks, Wi-Fi, and Bluetooth may become unavailable or unreliable in certain emergency or infrastructure-limited situations.

This project explores an alternative communication mechanism using **optical signaling through visible light**.

The proposed system converts emergency messages into compact semantic representations and transmits them using adaptive optical Morse signaling.

### Phase 1 focuses on validating the fundamental communication pipeline:

**Mobile Input → Web Application → Morse Conversion → ESP32 → LED → Optical Signal**

The mobile device is temporarily used for microphone input and computational processing. Future phases will progressively move toward a more independent and intelligent embedded system.

---

## 🎯 Phase 1 Objective

To develop a working proof-of-concept that can:

- [x] Accept voice input from a mobile device (Web Speech API)
- [x] Accept typed text as an alternative input
- [x] Accept manually entered Morse code (Interactive telegraph tapper paddle)
- [x] Convert text into Morse code (ITU-R M.1677-1 standard)
- [x] Adaptive Semantic Compression (Reduces optical transmission duration by up to 50%)
- [x] Send the Morse sequence from a web application to an ESP32 (Wi-Fi HTTP REST & Web Serial USB)
- [x] Control an LED using the ESP32 (Precision non-blocking FreeRTOS hardware timing)
- [x] Transmit the Morse sequence through visible light (Onboard LED, High-Power LED, Phone Flashlight Torch)

---

## 🏗️ System Architecture

```text
                 ┌──────────────────────┐
                 │      MOBILE PHONE    │
                 │                      │
                 │  🎙️ Voice Input      │
                 │  ⌨️ Text Input       │
                 │  • Morse Input       │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │    CUSTOM WEB APP    │
                 │                      │
                 │ Speech → Text        │
                 │ Text → Morse         │
                 │ Morse Validation     │
                 │ Transmission Control │
                 └──────────┬───────────┘
                            │
                       Wi-Fi / HTTP / USB
                            │
                            ▼
                 ┌──────────────────────┐
                 │        ESP32         │
                 │                      │
                 │ Receive Morse Data   │
                 │ Generate Timing      │
                 │ Control LED          │
                 └──────────┬───────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   🔦 LED      │
                    │               │
                    │  • = Short    │
                    │  - = Long     │
                    └───────┬───────┘
                            │
                            ▼
                     OPTICAL SIGNAL
```

---

## 📦 Project Directory Structure

```text
BIOTCP/
├── index.html                   # Mobile-responsive Transmission Studio UI
├── css/
│   └── styles.css               # Cyber-tactical glassmorphism dark mode styles
├── js/
│   ├── app.js                   # Application coordinator & event bindings
│   ├── morseEngine.js           # ITU Morse encoder/decoder & Adaptive Semantic engine
│   ├── audioSidetone.js         # Web Audio API 750Hz acoustic telegraph synthesizer
│   ├── opticalTransmitter.js    # Screen beacon, phone camera torch & waveform visualizer
│   ├── speechHandler.js         # Web Speech API voice-to-text recognition
│   └── esp32Service.js          # Hardware driver: Wi-Fi REST, Web Serial USB & Virtual Sim
├── esp32_firmware/
│   ├── esp32_firmware.ino       # ESP32 C++ firmware with FreeRTOS optical timing
│   └── README_FIRMWARE.md       # Circuit schematics, MOSFET driver & flashing instructions
├── server.js                    # Node.js dev server, CORS relay proxy & Mock ESP32 engine
├── server.py                    # Lightweight Python 3 zero-dependency server alternative
└── package.json                 # Project configuration & start scripts
```

---

## 🚀 Quick Start Guide

### 1. Launch the Web Application

#### Option A: Using Node.js
```bash
npm start
# or: node server.js
```

#### Option B: Using Python
```bash
python server.py
```

Open your browser at:
- **Desktop**: [http://localhost:3000](http://localhost:3000)
- **Mobile Device (Full Console)**: Connect phone to `BIOTCP-Optical-Transmitter` Wi-Fi (pass: `12345678`), turn **Mobile Data OFF**, and open `http://<YOUR_COMPUTER_IP>:3000` (e.g., `http://192.168.4.2:3000`).
- **Mobile Device (Standalone Offline Portal)**: Open `http://192.168.4.1` (served directly from ESP32 flash memory, zero computer required!).

> 💡 *See [esp32_firmware/README_FIRMWARE.md](file:///c:/Users/shrey/Downloads/BIOTCP/esp32_firmware/README_FIRMWARE.md) for full mobile prerequisites, DevKit V1 GPIO wiring without MOSFET, and troubleshooting.*

---

## 💡 How to Use the System

### 1. Transmission Studio (`🎙️ / ⌨️ Studio`)
- **Voice Input**: Tap `🎙️ Voice Input` and speak your emergency message (e.g., *"Emergency need medical help"*).
- **Text Input**: Type any message directly.
- **Quick Semantic Presets**: Tap emergency buttons such as **SOS**, **MED HELP**, **FIRE EVAC**, or **TRAPPED SOS**.
- **Adaptive Semantic Compression**: When enabled, the engine shortens verbose phrases into standardized emergency abbreviations, saving up to 50% in optical battery energy and transmission time.
- **Actions**:
  - `🚀 Transmit to ESP32`: Dispatches the Morse payload to the ESP32 hardware via Wi-Fi HTTP or Web Serial.
  - `🔦 Play Optical Beacon`: Flashes the on-screen optical strobe, plays acoustic sidetone, and triggers the phone's physical camera LED torch.

### 2. Manual Morse Key (`•- Tapper Key`)
- Tap the large circular key for short bursts (`•` Dot) or hold for long presses (`—` Dash).
- Hear real-time acoustic sidetone feedback (750Hz sine tone).
- Watch your taps automatically decode into English text in real time.
- Click `📥 Transfer Decoded Text to Transmission Studio` to send your tapped message to the transmitter.

### 3. Optical Signal Simulator (`💡 Optical Beacon`)
- High-intensity luminescent strobe bulb pulsing in perfect synchrony with the optical Morse signal.
- Real-time digital pulse waveform canvas showing the high/low optical states.
- **Mobile Camera Torch Switch**: Enables the smartphone's rear camera flashlight to physically pulse the optical Morse code.
- **Fullscreen Strobe**: Converts the entire phone screen into a high-visibility optical emergency beacon.

### 4. ESP32 Hardware Bridge (`📡 ESP32 Bridge`)
- **Mode 1: Simulated Virtual ESP32**: Allows 100% full testing and development on any computer or phone without physical hardware.
- **Mode 2: Wi-Fi HTTP REST**: Communicates directly with the ESP32 over Wi-Fi (either via ESP32's SoftAP `BIOTCP-Optical-Transmitter` @ `192.168.4.1` or LAN).
- **Mode 3: Web Serial API**: Connect your ESP32 directly to your phone or laptop using a USB cable for zero-configuration, zero-latency optical control!

---

## 🔋 Power Independence & Field Deployment (Zero Laptop Required)

### Frequently Asked: Can I unplug the ESP32 from the laptop and use an external power source?
**Yes, 100%! Everything works completely normally.**

- **Code Persistence in Non-Volatile Flash**:
  Once flashed from the Arduino IDE, the firmware is stored permanently in the ESP32's onboard SPI flash memory. **Disconnecting power or turning off your computer will NEVER erase your program.**
- **Instant Autonomous Boot**:
  Whenever the ESP32 is reconnected to any standard 5V power source (USB power bank, phone wall charger, or battery pack), it boots up in under **2 seconds**.
- **Automatic Wi-Fi Broadcasting**:
  The ESP32 immediately launches its private `BIOTCP-Optical-Transmitter` Wi-Fi hotspot upon boot—no host computer or router required.
- **Wire-Free Field Setup**:
  1. Plug the ESP32 into a **5V USB power bank**.
  2. On your mobile phone, disable **Mobile Data** and connect to Wi-Fi **`BIOTCP-Optical-Transmitter`** (Password: `12345678`).
  3. Open your mobile browser to **`http://192.168.4.1`**.
  4. Transmit emergency optical Morse signals anywhere in the field!

---

## 🔧 ESP32 Hardware Setup & Wiring

For complete wiring diagrams (standard 5mm LED direct from GPIO without MOSFET, DevKit V1 pin mappings, and high-power MOSFET driver circuits), refer to [esp32_firmware/README_FIRMWARE.md](file:///c:/Users/shrey/Downloads/BIOTCP/esp32_firmware/README_FIRMWARE.md).