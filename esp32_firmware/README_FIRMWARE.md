# 🔦 ESP32 Optical LED Transmitter — Hardware & Firmware Guide

This document describes how to flash, wire, and operate the **ESP32 Optical Transmitter** node for the **OPTIX Optical Communication System**.

> **Related Documentation:** [README.md](../README.md) · [HARDWARE_SETUP.md](../HARDWARE_SETUP.md) · [Project_OPTIX_Report.docx](../Project_OPTIX_Report.docx) · [Project_OPTIX_DCN_Report.docx](../Project_OPTIX_DCN_Report.docx) · [OPTIX_Presentation.pptx](../OPTIX_Presentation.pptx) · [ARCHITECTURE.md](../ARCHITECTURE.md) · [PROTOCOL.md](../PROTOCOL.md) · [SECURITY_AND_SAFETY.md](../SECURITY_AND_SAFETY.md)

---

## 📋 Bill of Materials (BOM)

| Component | Quantity | Purpose | Notes |
| :--- | :---: | :--- | :--- |
| **ESP32 Dev Module** | 1 | Microcontroller & Web Server | ESP-WROOM-32 or NodeMCU-32S |
| **High-Intensity Visible LED** | 1 | Optical Signal Emitter | White, Red, or High-Power 1W/3W LED |
| **Current Limiting Resistor** | 1 | Protects standard LED | 150Ω to 220Ω (for 5mm LED) |
| **N-Channel MOSFET** *(Optional)* | 1 | For 1W–3W High-Power LEDs | 2N7000 or IRLZ44N |
| **Jumper Wires & Breadboard** | 1 set | Prototyping | — |
| **Micro-USB / Type-C Cable** | 1 | Power & Firmware Flashing | High-quality data cable |

---

## ⚡ Circuit Schematic & Wiring

### Option A: Standard 5mm LED Direct from GPIO (No MOSFET Needed)
For bench testing and portable optical signaling without external transistors:

```text
ESP32 DevKit V1
  ┌───────────────┐
  │        Pin D4 ├──────[ 220Ω Resistor ]──────(+) LED Anode (Long Leg)
  │      (GPIO 4) │                                   
  │           GND ├─────────────────────────────(-) LED Cathode (Short Leg / Flat Rim)
  └───────────────┘
```

> **📌 DevKit V1 Pin Identification Tip:**
> ESP32 DevKit boards do **not** print the word "GPIO". Instead, pins are labeled with a **`D`**:
> - **GPIO 4 is printed as `D4`** (on standard 30-pin boards, count 4 pins up from the bottom on the right column: `3V3` → `D15` → `D2` → **`D4`**).
> - **GPIO 2 is printed as `D2`** (drives the onboard blue LED in parallel).
> - **Polarity**: The **longer leg** of the LED is the Anode (+), and the **shorter leg** (or flat edge on the rim) is the Cathode (-).
> - **Safety**: Always include a **150Ω – 330Ω resistor** (220Ω recommended). Connecting the LED directly without a resistor can permanently damage the ESP32 GPIO pin.

---

### Option B: High-Power Optical LED / Spotlight (Transistor/MOSFET Driver)
For long-distance emergency optical signaling (hundreds of meters):

```text
               +5V (or External +12V)
                     │
                     ▼
             [ High-Power LED ]
                     │
                     ├─── Anode (+)
                     └─── Cathode (-)
                             │
                             ▼ Drain
ESP32 GPIO 4 ───[ 1kΩ ]──── Gate [ N-MOSFET IRLZ44N ]
                             ▲ Source
                             │
ESP32 GND    ────────────────┴────────────────── External GND
```

---

## 🚀 How to Flash the Firmware

### Using Arduino IDE 2.x

1. **Install ESP32 Board Core**:
   - Open Arduino IDE → `File` → `Preferences`.
   - In *Additional Board Manager URLs*, add:
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Go to `Tools` → `Board` → `Boards Manager`, search for `esp32` by Espressif Systems and click **Install**.

2. **Install Required Library**:
   - Go to `Sketch` → `Include Library` → `Manage Libraries...`.
   - Search for **ArduinoJson** (by Benoit Blanchon, v6 or v7) and click **Install**.

3. **Open & Configure Sketch**:
   - Open `esp32_firmware/esp32_firmware.ino`.
   - Select your board: `Tools` → `Board` → `ESP32 Arduino` → `ESP32 Dev Module`.
   - Select your COM port: `Tools` → `Port` → `COMx`.

4. **Upload**:
   - Click **Upload** (arrow icon). If your board requires holding the `BOOT` button, press and hold `BOOT` when `Connecting......` appears.

---

## 🌐 Wi-Fi & Connection Modes

### 1. Autonomous SoftAP Mode (Emergency Field Operation)
- The ESP32 creates its own independent Wi-Fi hotspot:
  - **SSID**: `OPTIX-Optical-Transmitter`
  - **Password**: `12345678`
  - **Default Gateway / Node IP**: `http://192.168.4.1`

---

## 📱 Mobile Device Field Access Guide

### Frequently Asked Questions:
- **Q: Do I need to disconnect the ESP32 Wi-Fi from my laptop before connecting my phone?**  
  **No! Do NOT disconnect the laptop.** The ESP32 SoftAP operates just like a wireless router and supports **multiple client connections concurrently**. You can keep your laptop connected while simultaneously operating from your phone.
- **Q: Should my phone be connected to the same Wi-Fi?**  
  **Yes, absolutely.** Your phone must be connected to `OPTIX-Optical-Transmitter` so it resides on the same local `192.168.4.x` subnet.

### 📋 Mobile Prerequisites Checklist

| # | Prerequisite | Action Required | Why It's Crucial |
| :-: | :--- | :--- | :--- |
| 1 | **ESP32 Powered On** | Connect via USB data cable to PC or 5V power bank. | Generates the private local RF bubble. |
| 2 | **Connect to Wi-Fi** | Join `OPTIX-Optical-Transmitter` using password `12345678`. | Establishes local IP link. |
| 3 | **Disable Mobile Data** | **Turn OFF Cellular / Mobile Data (4G/5G)** on your phone. | **Crucial:** Modern phones detect "No Internet" on the ESP32 Wi-Fi and attempt to route browser traffic to cellular data instead of the local subnet. |
| 4 | **Acknowledge Wi-Fi Prompt** | Tap **"Stay Connected"** / **"Keep Connection"** when iOS or Android asks. | Prevents the OS from automatically disconnecting. |

### 📲 Two Ways to Control from Mobile

#### Method A: Full OPTIX Web Console on Mobile *(Quiet Minimal UI, Voice Dictation & Presets)*
1. Keep `node server.js` running on your laptop while the laptop is connected to `OPTIX-Optical-Transmitter`.
2. Connect your mobile phone to `OPTIX-Optical-Transmitter` (with Mobile Data disabled).
3. In Chrome or Safari on your phone, open:
   ```
   http://192.168.4.2:3000
   ```
   *(Replace `192.168.4.2` with your laptop's local IP address if different; use `https://<HOST_IP>:3443` if you need browser microphone dictation).*
4. Navigate to **`04. Hardware`** on your phone:
   - Set **Connection Mode** to **`Wi-Fi HTTP REST`**.
   - Ensure **ESP32 IP / Host** is `192.168.4.1` and tap **`PING ESP32`** to confirm `SYS.ONLINE` / `LINK ONLINE`.
5. In **`01. Transmit`**:
   - Tap an emergency token, use voice dictation, or type a payload, then tap **`TRANSMIT VIA ESP32 ↵`** in the sticky bottom bar.

#### Method B: Standalone Embedded Portal *(Zero Laptop Needed — 100% Offline Field Mode)*
1. Power the ESP32 from any 5V USB power bank or smartphone charger (no computer needed).
2. Connect your phone to `OPTIX-Optical-Transmitter` (password: `12345678`).
3. Open your phone's browser and go directly to:
   ```
   http://192.168.4.1
   ```
4. A lightweight emergency transmission portal served directly from the ESP32's flash memory will appear. Type your Morse code or emergency text and tap **Transmit Morse**.

---

### Troubleshooting & Common Issues

- **Issue 1: Only sounds play from speakers, but the ESP32 LED doesn't blink:**
  - Open **`04. Hardware`**. If **Connection Mode** is set to `Simulated ESP32` (`SYS.SIMULATED`), transmissions run on the built-in local simulator instead of physical hardware. Switch to **`Wi-Fi HTTP REST`** or **`Web Serial (USB)`**.
  - In **`01. Transmit`**, tap **`TRANSMIT VIA ESP32 ↵`** (solid black primary button), not **`LOOP BEACON`** (bordered white button, which runs local screen/camera-torch playback).
- **Issue 2: "Site Can't Be Reached" / Timeout on Mobile:**
  - You must turn **OFF Mobile Data / Cellular Data** on your phone. Mobile OS network managers silently bypass Wi-Fi connections that do not possess upstream internet access unless cellular data is disabled.
- **Issue 3: Built-in Blue LED (`D2`) blinks, but external LED (`D4`) stays dark:**
  - Swap the legs of the external LED. The longer leg (Anode) must connect through the resistor to `D4`, and the shorter leg (Cathode) must connect to `GND`. Check that jumper wires are firmly seated on `D4` and `GND`.

---

### 2. Station (STA) Mode
- Edit lines 32-33 in `esp32_firmware.ino` to add your Wi-Fi credentials:
  ```cpp
  const char* STA_SSID = "Your_Home_WiFi";
  const char* STA_PASS = "Your_Password";
  ```
- The ESP32 will connect to your router and print its assigned IP to the Serial Monitor at 115200 baud.

---

## 📡 REST API Reference

All endpoints include CORS headers (`Access-Control-Allow-Origin: *`) for browser compatibility.

### 1. Heartbeat Probe
`GET /api/ping`
```json
{
  "status": "ok",
  "device": "ESP32-Optical-Transmitter",
  "firmware": "OPTIX-v1.0",
  "uptime_sec": 42,
  "gpio_builtin": 2,
  "gpio_optical": 4
}
```

### 2. Transmit Optical Morse
`POST /api/transmit`
**Body:**
```json
{
  "morse": "... --- ...",
  "unit_ms": 80,
  "repeat": 3
}
```
**Response:**
```json
{
  "success": true,
  "message": "Optical transmission queued",
  "sequence": "... --- ...",
  "unit_ms": 80,
  "repeat": 3
}
```

### 3. Emergency Stop
`POST /api/stop`
**Response:**
```json
{
  "success": true,
  "message": "Optical transmission aborted"
}
```

### 4. Telemetry Status
`GET /api/status`
```json
{
  "transmitting": false,
  "current_sequence": "... --- ...",
  "unit_ms": 80,
  "uptime_sec": 128,
  "free_heap": 245380,
  "total_transmissions": 5,
  "total_pulses": 45,
  "wifi_mode": "AP",
  "ip_address": "192.168.4.1"
}
```

---

## 💻 USB Serial Interface (115200 Baud)

You can also control the ESP32 directly via USB Serial terminal:
- `TX ... --- ... 80 1` → Transmits SOS with 80ms unit duration, 1 repeat.
- `STOP` → Aborts active transmission immediately.
- `PING` → Returns device uptime and free heap.
- `STATUS` → Queries active sequence and pulse count.

---

## 🔋 Power Independence & Standalone Field Operation

- **Flash Memory Persistence**: Uploading firmware writes the code to the ESP32's onboard SPI flash memory. Disconnecting power **never erases the code**.
- **Cold Boot Time**: When connected to any standard 5V power source (power bank, USB wall charger, or 5V battery), the ESP32 boots in **< 2 seconds** and immediately begins broadcasting the `OPTIX-Optical-Transmitter` Wi-Fi network.
- **Autonomous Emergency Node**: In disaster situations, you can power the ESP32 with just a pocket power bank. Responders or survivors can connect with their smartphones directly to `http://192.168.4.1` and transmit optical signals without needing a laptop, internet router, or cellular network.

---

## 🔭 Phase 1 Benchtop Validation → Phase 2 Self-Contained Torch (`OPTIX-MK2`)

This ESP32 + breadboard circuit serves as **Phase 1 Proof-of-Concept Hardware**, validating ITU-R M.1677-1 optical timing, non-blocking FreeRTOS pulse generation, and `IRLZ44N` MOSFET high-power LED switching on an accessible low-cost benchtop rig.

In **Phase 2 (`OPTIX-MK2` Future Scope)** — modeled interactively in the **`06. 3D Torch`** tab (including **Fullscreen Presentation Mode**) — this optical driver stage migrates onto a **Raspberry Pi Compute Module 5 (CM5, 4GB RAM)** custom carrier PCB (`GPIO 18` PWM → `IRLZ44N` constant-current buck driver → `10W` Cree XHP50 collimated LED) inside a custom 3D-printed rugged enclosure powered by a `2S1P 18650` pack with **18W USB-C PD** charging, enabling 100% phone-free offline voice AI (`whisper.cpp` + quantized semantic compression) in the field. See [ARCHITECTURE.md](../ARCHITECTURE.md) and [PROTOCOL.md](../PROTOCOL.md) for the complete Phase 2 BOM and pinout specification.
