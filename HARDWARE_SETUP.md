# OPTIX — Complete Hardware Wiring, Configuration & Multi-Device Access Guide

This document is the complete, end-to-end operational manual for assembling, flashing, configuring, and controlling the **OPTIX Phase 1 ESP32 Optical Transmitter** across **Laptop (Wi-Fi & USB)**, **Mobile Phone (Full Console & Standalone Offline Portal)**, and **Home/Lab Router Networks**.

> **Related Documentation:** [README.md](README.md) · [Project_OPTIX_Report.docx](Project_OPTIX_Report.docx) · [OPTIX_Presentation.pptx](OPTIX_Presentation.pptx) · [ARCHITECTURE.md](ARCHITECTURE.md) · [PROTOCOL.md](PROTOCOL.md) · [SECURITY_AND_SAFETY.md](SECURITY_AND_SAFETY.md) · [esp32_firmware/README_FIRMWARE.md](esp32_firmware/README_FIRMWARE.md) · [esp32_firmware/esp32_firmware.ino](esp32_firmware/esp32_firmware.ino)

---

## Table of Contents

1. [System Connection Overview](#1-system-connection-overview)
2. [Bill of Materials (BOM)](#2-bill-of-materials-bom)
3. [ESP32 & Breadboard Wiring Guide](#3-esp32--breadboard-wiring-guide)
4. [Flashing & Firmware Configuration](#4-flashing--firmware-configuration)
5. [Running the OPTIX Server & Firewall Setup](#5-running-the-optix-server--firewall-setup)
6. [All Access & Connection Methods](#6-all-access--connection-methods)
   - [Method A: Laptop via Wi-Fi SoftAP](#method-a-laptop-via-wi-fi-softap-full-web-console)
   - [Method B: Laptop via USB Cable (Web Serial & CLI)](#method-b-laptop-via-usb-cable-web-serial--serial-monitor)
   - [Method C: Mobile Phone — Full OPTIX Web Console](#method-c-mobile-phone--full-optix-web-console-via-laptop)
   - [Method D: Mobile Phone — 100% Standalone Offline Mode](#method-d-mobile-phone--100-standalone-offline-mode-zero-laptop)
   - [Method E: Shared Home / Lab Wi-Fi Router (STA Mode)](#method-e-shared-home--lab-wi-fi-router-sta-mode--internet--voice-ai)
   - [Method F: Offline Virtual Simulation Mode](#method-f-offline-virtual-simulation-mode-no-hardware)
7. [OPTIX Web Console Configuration Reference](#7-optix-web-console-configuration-reference)
8. [REST API & USB Serial Protocol Reference](#8-rest-api--usb-serial-protocol-reference)
9. [Troubleshooting Guide](#9-troubleshooting-guide)
10. [Pre-Demo Verification Checklist](#10-pre-demo-verification-checklist)

---

## 1. System Connection Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT CONTROLLERS                              │
│  • Laptop Browser (Chrome / Edge / Firefox)                             │
│  • Mobile Browser (Android Chrome / iOS Safari)                         │
└──────────────────┬───────────────────────────────────┬──────────────────┘
                   │                                   │
     ┌─────────────▼─────────────┐       ┌─────────────▼─────────────┐
     │  OPTIX Web Server (Laptop)│       │   Direct ESP32 Connection │
     │  HTTP  :3000              │       │   • SoftAP: 192.168.4.1   │
     │  HTTPS :3443 (Mic/Torch)  │       │   • USB Web Serial 115200 │
     │  CORS Relay Proxy (/proxy)│       │   • Embedded Portal (/)   │
     └─────────────┬─────────────┘       └─────────────┬─────────────┘
                   └─────────────────┬─────────────────┘
                                     ▼
                  ┌────────────────────────────────────┐
                  │         ESP32 DevKit Module        │
                  │  • FreeRTOS Core 1 Optical Engine  │
                  │  • GPIO 2 (D2): Onboard Blue LED   │
                  │  • GPIO 4 (D4): Breadboard Optical │
                  └──────────────────┬─────────────────┘
                                     ▼
                  ┌────────────────────────────────────┐
                  │     Breadboard Optical Emitter     │
                  │  • Option A: 220Ω + 5mm LED        │
                  │  • Option B: IRLZ44N + 1W-3W LED   │
                  └────────────────────────────────────┘
```

### Quick Mode Comparison

| Access Mode | Laptop Needed? | Internet Available? | Phone Camera Torch / Voice Mic? | Best For |
| :--- | :---: | :---: | :---: | :--- |
| **A. Laptop Wi-Fi (SoftAP)** | Yes | No *(on ESP32 Wi-Fi)* | Desktop Mic (Offline) | Quick benchtop demo without USB cable |
| **B. Laptop USB (`Web Serial`)** | Yes | **Yes** *(laptop keeps normal Wi-Fi!)* | **Yes** *(online voice works!)* | Best laptop demo — zero Wi-Fi switching |
| **C. Mobile Full Console (SoftAP)** | Yes | No *(on ESP32 Wi-Fi)* | Torch via HTTPS `:3443` | Full UI + 3D Twin + presets from phone |
| **D. Mobile Standalone (`192.168.4.1`)** | **No** | No | No *(lightweight HTML portal)* | 100% offline disaster / power-bank field demo |
| **E. Shared Router (STA Mode)** | Optional | **Yes** | **Yes** *(Full voice + torch)* | Lab / classroom demos with internet access |
| **F. Simulated ESP32** | Yes | Yes | Yes | Testing UI without physical board |

---

## 2. Bill of Materials (BOM)

| Component | Qty | Specification | Required For |
| :--- | :---: | :--- | :--- |
| **ESP32 Development Board** | 1 | ESP32 DevKit V1 (30-pin / 38-pin) or NodeMCU-32S (`ESP-WROOM-32`) | All hardware modes |
| **USB Data Cable** | 1 | Micro-USB or USB-C **data** cable *(not charge-only)* | Flashing, power & Web Serial |
| **Breadboard** | 1 | Standard 400-point or 830-point solderless breadboard | Prototyping |
| **Jumper Wires** | 2–5 | Male-to-Male (and/or Female-to-Male if board pins sit off-board) | Connections |
| **5mm Visible LED** | 1 | High-brightness White or Red 5mm LED | Option A (Bench Demo) |
| **Current-Limiting Resistor** | 1 | **220 Ω** recommended *(safe range: 150 Ω – 330 Ω, ¼ W)* | Option A (Protects GPIO 4) |
| **N-Channel Logic MOSFET** | 1 | `IRLZ44N` (high power) or `2N7000` (small load) | Option B (High-Power LED) |
| **Gate / Pull-Down Resistors** | 2 | `1 kΩ` (Gate series) + `10 kΩ` (Gate-to-GND pull-down, optional) | Option B (High-Power LED) |
| **High-Power LED + Driver** | 1 | 1W–3W LED + appropriate power resistor / constant-current driver + 5V supply | Option B (Long-Range Beam) |
| **5V USB Power Bank** *(Optional)* | 1 | Standard 5V/1A+ USB power bank | Method D (Standalone field demo) |

---

## 3. ESP32 & Breadboard Wiring Guide

### Firmware Pin Assignments
Defined in [esp32_firmware/esp32_firmware.ino](esp32_firmware/esp32_firmware.ino#L30-L31):

| Constant | GPIO | DevKit Silkscreen Label | Function |
| :--- | :---: | :---: | :--- |
| `LED_BUILTIN_PIN` | `GPIO 2` | **`D2`** | Onboard blue LED — mirrors optical Morse automatically (no external wiring needed). |
| `LED_OPTICAL_PIN` | `GPIO 4` | **`D4`** | External optical emitter output (breadboard LED or MOSFET gate). |
| Ground | `GND` | **`GND`** | Common electrical return path. |

> **Finding `D4` on an ESP32 DevKit V1:**
> ESP32 boards print **`D`** instead of `GPIO`. On a standard 30-pin DevKit V1 (with the USB port facing **down**), `D4` is on the **right-hand column**, 4th pin up from the bottom (`3V3` → `GND` or `D15` → `D2` → **`D4`**). Always verify against the silkscreen printed next to the pin on your specific board.

---

### Option A: Standard 5mm LED on Breadboard *(Recommended for Benchtop Demos)*

#### Circuit Schematic
```text
ESP32 DevKit
┌──────────────┐
│  D4 (GPIO 4) ├────[ 220Ω Resistor ]────(+) LED Long Leg (Anode)
│              │
│          GND ├─────────────────────────(-) LED Short Leg / Flat Rim (Cathode)
└──────────────┘
```

#### Step-by-Step Breadboard Assembly
1. **Mount the ESP32:** Press the ESP32 across the center divider trench of the breadboard with the USB port hanging slightly over the edge.
   - *Wide-board tip:* Many 30-pin ESP32 DevKits are wide enough to cover almost all columns on one side of a standard breadboard. If `D4` or `GND` has no exposed breadboard hole beside it, either:
     - Place the ESP32 straddling **two breadboards snapped side-by-side**, or
     - Keep the ESP32 beside the breadboard and connect **`D4`** and **`GND`** to the breadboard using **Female-to-Male** jumper wires.
2. **Place the 220 Ω Resistor:**
   - Connect one leg of the **220 Ω resistor** to **`D4`** (directly in `D4`'s breadboard row, or via a jumper wire to an empty row such as **Row 10**).
   - Insert the other leg of the resistor into a fresh empty row (e.g., **Row 15**).
3. **Insert the LED (Check Polarity!):**
   - **Long leg (`+` Anode):** Plug into **Row 15** (same row as the resistor's output leg).
   - **Short leg / flat edge on plastic rim (`-` Cathode):** Plug into a separate empty row (e.g., **Row 18**).
4. **Connect Ground (`GND`):**
   - Run a jumper wire from **Row 18** (LED short leg) to any **`GND`** pin on the ESP32.

> **Electrical Safety Rule:** Never wire an LED directly to `D4` without a `150 Ω – 330 Ω` resistor. ESP32 GPIO pins are rated for `3.3 V` logic and limited current; omitting the resistor can permanently burn out the LED or the ESP32 GPIO driver.

---

### Option B: High-Power 1W–3W LED with N-Channel MOSFET *(Long-Range Signaling)*

Use this circuit when driving a high-power LED that exceeds the ESP32 GPIO's safe current limit (~12–20 mA recommended).

```text
                    +5V (External Power Supply or ESP32 VIN)
                          │
                    [ Current-Limiting Power Resistor / CC Driver ]
                          │
                    (+) High-Power LED (-)
                          │
                          ├─── Drain  (Center pin on TO-220 IRLZ44N)
ESP32 D4 ──[ 1kΩ ]────┬───┤─── Gate   (Left pin, flat face toward you)
                      │   ├─── Source (Right pin)
                   [10kΩ] │
                      │   │
ESP32 GND ────────────┴───┴─── External Supply GND (COMMON GROUND REQUIRED)
```

- **Why the `1 kΩ` gate resistor?** Limits inrush current from the ESP32 pin into the MOSFET gate capacitance.
- **Why the `10 kΩ` pull-down resistor?** Holds the MOSFET **OFF** during ESP32 reset/boot before `GPIO 4` is configured as an output.
- **Why Common Ground?** ESP32 `GND` **must** be tied to the external 5V/12V supply's `GND`, otherwise the gate-source voltage (`V_GS`) floats and the MOSFET will not switch reliably.

---

### Instant Wiring Verification (Power-On Self-Test)
Every time the ESP32 boots or you press the physical **`EN` / `RST`** button, the firmware executes a **3-blink Power-On Self-Test (POST)** (`70 ms ON / 70 ms OFF × 3`) on **both** `D2` and `D4`:
- **Both onboard blue LED (`D2`) and breadboard LED (`D4`) blink 3 times:** Wiring is 100% correct!
- **Only onboard blue LED (`D2`) blinks, breadboard LED stays dark:** Flip the breadboard LED legs (polarity reversed) and verify your jumper is on `D4` (not `D2`, `RX2`, or `D15`) and `GND`.

---

## 4. Flashing & Firmware Configuration

### 4.1 Arduino IDE 2.x Setup (One-Time)
1. **Install USB-to-UART Driver** *(if your COM port does not appear)*:
   - Most ESP32 DevKits use either **CP2102** (Silicon Labs) or **CH340** (WCH). Install the matching Windows driver if Device Manager shows an unknown USB device.
2. **Add ESP32 Board Manager URL:**
   - Open Arduino IDE → **File → Preferences**.
   - In **Additional boards manager URLs**, add:
     ```text
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
3. **Install ESP32 Board Package:**
   - Open **Tools → Board → Boards Manager**, search `esp32` by **Espressif Systems**, and install.
4. **Install Required Library:**
   - Open **Sketch → Include Library → Manage Libraries**, search **`ArduinoJson`** (by Benoit Blanchon, v6 or v7), and install.

### 4.2 Flashing the Firmware
1. Open [esp32_firmware/esp32_firmware.ino](esp32_firmware/esp32_firmware.ino).
2. Select **Tools → Board → esp32 → ESP32 Dev Module**.
3. Select **Tools → Port → COMx** (your ESP32's port).
4. Click **Upload**.
   - *Tip:* If the upload stalls at `Connecting........_____`, press and **hold** the **`BOOT`** button on the ESP32 until writing starts, then release.
5. Open **Tools → Serial Monitor** and set baud rate to **`115200`** to confirm boot output:
   ```text
   🔦 OPTIX Optical Communication System - ESP32 Firmware
   [WIFI] SoftAP Active: OPTIX-Optical-Transmitter | IP: 192.168.4.1
   [HTTP] REST Web Server running on port 80
   [SYSTEM] Ready for optical Morse commands!
   ```
   > **Note:** Close the Arduino Serial Monitor before using **Web Serial (USB)** in the browser — only one app can hold a COM port at a time.

### 4.3 Wi-Fi Mode Configuration inside `esp32_firmware.ino`
- **Default — Autonomous SoftAP Mode (Offline Field Mode):**
  Lines 34–42 of [esp32_firmware/esp32_firmware.ino](esp32_firmware/esp32_firmware.ino#L34-L42):
  ```cpp
  const char* AP_SSID = "OPTIX-Optical-Transmitter";
  const char* AP_PASS = "12345678";
  // Leave STA_SSID empty to always start in SoftAP mode (192.168.4.1)
  const char* STA_SSID = "";
  const char* STA_PASS = "";
  ```
- **Optional — Station (STA) Mode (Connect to Home/Lab Wi-Fi Router):**
  Fill in `STA_SSID` and `STA_PASS`, then re-upload:
  ```cpp
  const char* STA_SSID = "Your_WiFi_Name";
  const char* STA_PASS = "Your_WiFi_Password";
  ```
  If the router is unreachable after ~10 seconds, the firmware **automatically falls back** to SoftAP mode (`OPTIX-Optical-Transmitter` @ `192.168.4.1`).

---

## 5. Running the OPTIX Server & Firewall Setup

### Starting the Local Web Server (Laptop)
Open a terminal in the project folder (`c:\Users\shrey\Downloads\BIOTCP`) and run:

```powershell
# Recommended (starts HTTP :3000, HTTPS :3443 if certs exist, and CORS Relay Proxy)
node server.js
# or
npm start
```

*(Zero-dependency Python fallback — HTTP only, no HTTPS/Proxy):*
```powershell
python server.py
```

When `node server.js` starts, it prints every available URL automatically:
```text
💻 Local HTTP:         http://localhost:3000
📱 Mobile Network:     http://192.168.4.2:3000
🔒 Local HTTPS:        https://localhost:3443
🎙️ Mobile HTTPS (Mic): https://192.168.4.2:3443
```
*(Your `192.168.4.x` address is assigned by the ESP32 SoftAP; always use the exact IP printed in your terminal.)*

### Windows Firewall Setup (If Mobile Cannot Reach `:3000` or `:3443`)
Windows Defender Firewall often blocks inbound connections on a new Wi-Fi network (especially when classified as a *Public* network). If `http://192.168.4.1` works on your phone but `http://192.168.4.2:3000` times out, run PowerShell **as Administrator** once:

```powershell
New-NetFirewallRule -DisplayName "OPTIX Web Server HTTP 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
New-NetFirewallRule -DisplayName "OPTIX Web Server HTTPS 3443" -Direction Inbound -Protocol TCP -LocalPort 3443 -Action Allow
```

*(Or click **Allow access** for both Private and Public networks when the Windows Security Alert popup appears the first time you run `node server.js`.)*

---

## 6. All Access & Connection Methods

### Method A: Laptop via Wi-Fi SoftAP *(Full Web Console)*
1. Power the ESP32 (USB to laptop or 5V power bank).
2. Connect your laptop Wi-Fi to **`OPTIX-Optical-Transmitter`** (password: `12345678`).
3. Run `node server.js` and open **`http://localhost:3000`** in Chrome, Edge, or Firefox.
4. Go to tab **`04. Hardware`**:
   - **CONNECTION MODE:** `Wi-Fi HTTP REST`
   - **ESP32 IP / HOST:** `192.168.4.1`
   - **HTTP PORT:** `80`
   - **CORS Relay Proxy:** OFF *(optional; turn ON if using `https://localhost:3443`)*
   - Click **`PING ESP32`** → verify `ONLINE` in the header & Telemetry Log.
5. Go to **`01. Transmit`**, enter a message or click **`SOS`**, and click **`TRANSMIT VIA ESP32 ↵`**.

---

### Method B: Laptop via USB Cable *(Web Serial & Serial Monitor)*

> **Why Method B is awesome for laptop demos:** Your laptop **stays on your normal internet Wi-Fi** (so browser Voice Dictation works cleanly!), while commands go straight over the USB cable at `115200` baud with near-zero latency.

#### Option B1: OPTIX Web Console via Web Serial (Chrome / Edge Desktop)
1. Plug the ESP32 into your laptop with a **USB data cable**.
2. Make sure **Arduino IDE Serial Monitor is CLOSED** (so the COM port isn't locked).
3. Run `node server.js` and open **`http://localhost:3000`** in **Google Chrome** or **Microsoft Edge** *(Web Serial is not supported in Firefox or Safari)*.
4. Open tab **`04. Hardware`**:
   - Set **CONNECTION MODE** to **`Web Serial (USB)`**.
   - Click **`CONNECT USB SERIAL`** (appears automatically when `Web Serial (USB)` is selected).
   - Pick your ESP32's COM port (e.g., `CP2102 USB to UART Bridge` or `USB-SERIAL CH340`) and click **Connect**.
5. Go to **`01. Transmit`**, type or dictate a message, and click **`TRANSMIT VIA ESP32 ↵`**.

#### Option B2: Direct USB Serial Terminal (Arduino Serial Monitor / PuTTY / PowerShell)
Connect at **`115200` baud** with **Newline (`\n`)** line ending and type commands directly:
```text
PING
STATUS
TX ...---... 80 3
STOP
```
*(Note: In direct Serial CLI mode, use continuous symbols without spaces inside the Morse token if passing explicit `unit_ms` and `repeat` arguments, because the firmware's serial parser splits arguments on spaces. For full spaced Morse strings with word gaps, use the HTTP REST API or OPTIX Web Console.)*

---

### Method C: Mobile Phone — Full OPTIX Web Console *(Via Laptop)*

Access all 6 workspaces (`01. Transmit`, `02. Manual Key`, `03. Beacon`, `04. Hardware`, `05. Parameters`, `06. 3D Torch`) on your phone while driving the physical ESP32 LED.

#### Step 1: Phone Network Prerequisites
1. **Keep your laptop connected** to **`OPTIX-Optical-Transmitter`** (do NOT disconnect it — the ESP32 SoftAP supports multiple simultaneous devices).
2. **Start `node server.js`** on your laptop and note the `192.168.4.x` address printed (usually `192.168.4.2`).
3. On your **mobile phone**:
   - **Turn OFF Mobile Data (4G/5G)** *(mandatory — otherwise the phone bypasses the offline ESP32 Wi-Fi)*.
   - Connect to Wi-Fi **`OPTIX-Optical-Transmitter`** (password: **`12345678`**).
   - Tap **"Stay Connected" / "Keep Wi-Fi"** when prompted about no internet access.

#### Step 2: Open OPTIX on Your Phone
- **Standard HTTP (Fastest, No Certificate Prompt):**
  Open Chrome (Android) or Safari (iOS) and go to:
  ```text
  http://192.168.4.2:3000
  ```
  *(Replace `192.168.4.2` with your laptop's actual `192.168.4.x` IP from the terminal.)*
- **HTTPS Mode (Required for Mobile Camera Torch in `03. Beacon`):**
  Go to:
  ```text
  https://192.168.4.2:3443
  ```
  Tap **Advanced → Proceed to 192.168.4.2 (unsafe)** to accept the local self-signed certificate (`cert.pem`).

#### Step 3: Configure `04. Hardware` on Your Phone
1. Tap **`04. Hardware`**.
2. Set **CONNECTION MODE** → **`Wi-Fi HTTP REST`**.
3. Verify **ESP32 IP / HOST** = `192.168.4.1` and **HTTP PORT** = `80`.
4. **If using HTTPS (`:3443`):** Turn **ON** **`CORS Relay Proxy`**!
   - *Why?* Mobile browsers block Mixed Content (`https://` page calling `http://192.168.4.1`). Turning on **CORS Relay Proxy** routes the request securely over HTTPS to `server.js`, which forwards it to `http://192.168.4.1`.
5. Tap **`PING ESP32`** → confirm `ONLINE`.
6. Go to **`01. Transmit`**, select a preset (e.g., `SOS`), and tap **`TRANSMIT VIA ESP32 ↵`** in the bottom bar.

---

### Method D: Mobile Phone — 100% Standalone Offline Mode *(Zero Laptop)*

Ideal for field demonstrations, power-bank portability, and zero-infrastructure disaster operation.

1. Unplug the ESP32 from your laptop and power it from any **5V USB power bank** or wall charger.
   - The flashed firmware persists permanently in SPI flash and boots in **< 2 seconds** (you will see the 3 POST blinks on `D2` + `D4`).
2. On your phone:
   - **Turn OFF Mobile Data (4G/5G)**.
   - Connect to Wi-Fi **`OPTIX-Optical-Transmitter`** (password: **`12345678`**).
   - Tap **Stay Connected** when prompted.
3. Open your phone browser and navigate directly to:
   ```text
   http://192.168.4.1
   ```
4. The embedded **OPTIX Optical Transmitter** emergency portal loads directly from the ESP32's onboard flash memory. Enter Morse code (e.g., `... --- ...`) and tap **Transmit Morse** (or **Abort** to stop immediately).

---

### Method E: Shared Home / Lab Wi-Fi Router *(STA Mode — Internet + Voice AI)*

Use this when you want your **laptop**, **phone**, and **ESP32** on the same Wi-Fi router **with full internet access** (so Google/Apple cloud Voice Dictation works seamlessly alongside physical ESP32 optical transmission, and you don't need to disable Mobile Data).

1. Edit lines 41–42 of [esp32_firmware/esp32_firmware.ino](esp32_firmware/esp32_firmware.ino#L41-L42) with your router's **2.4 GHz** Wi-Fi SSID & password *(ESP32 does not support 5 GHz Wi-Fi)*.
2. Re-flash the ESP32 and open Serial Monitor (`115200` baud) to read its assigned router IP, e.g.:
   ```text
   [WIFI] Connected! Station IP: 192.168.1.45
   ```
3. Connect your laptop and phone to the **same Wi-Fi router** and start `node server.js` on the laptop.
4. Open the laptop's LAN URL on your phone (e.g., `https://192.168.1.20:3443` for Voice Mic + Camera Torch, or `http://192.168.1.20:3000`).
5. In **`04. Hardware`**, set:
   - **CONNECTION MODE:** `Wi-Fi HTTP REST`
   - **ESP32 IP / HOST:** `192.168.1.45` *(the ESP32's Station IP from step 2)*
   - **HTTP PORT:** `80`
   - **CORS Relay Proxy:** ON if using HTTPS (`:3443`)
6. Tap **`PING ESP32`** → confirm `ONLINE`, then transmit from **`01. Transmit`**!

---

### Method F: Offline Virtual Simulation Mode *(No Hardware)*
If you want to test or demonstrate the UI without an ESP32 plugged in:
1. Open **`04. Hardware`** → set **CONNECTION MODE** to **`Simulated ESP32`**.
2. All transmissions run against the built-in client-side virtual ESP32 emulator (no physical board or Wi-Fi change needed).

---

## 7. OPTIX Web Console Configuration Reference

| Workspace | Control / Setting | Purpose & Notes |
| :--- | :--- | :--- |
| **`04. Hardware`** | `CONNECTION MODE` | Choose `Wi-Fi HTTP REST` (real ESP32 over Wi-Fi), `Web Serial (USB)` (USB cable), or `Simulated ESP32`. |
| **`04. Hardware`** | `ESP32 IP / HOST` & `HTTP PORT` | `192.168.4.1` & `80` for SoftAP mode, or the router IP for STA mode. Saved automatically in `localStorage`. |
| **`04. Hardware`** | `CORS Relay Proxy` | Routes ESP32 HTTP calls through `server.js` (`/proxy/esp32`). **Must be ON** when accessing the console over **HTTPS (`:3443`)**. |
| **`04. Hardware`** | `PING ESP32` | Sends `GET /api/ping` and logs uptime, GPIO pins, and connection health in the Telemetry Log. |
| **`01. Transmit`** | `TRANSMIT VIA ESP32 ↵` *(Black button)* | Dispatches the encoded Morse sequence to the configured ESP32 hardware (plus local visual/audio sync). |
| **`01. Transmit`** | `LOOP BEACON` *(White bordered button)* | Runs **local** screen beacon / mobile camera torch loop only — does **not** transmit to the ESP32. |
| **`03. Beacon`** | `Mobile Camera Torch` / `Acoustic Sidetone` | Toggles rear phone flash strobe (requires HTTPS `:3443` on supported Android Chrome) and CW audio tone. |
| **`05. Parameters`** | `TRANSMISSION SPEED` (`5–40 WPM`) | Adjusts dot unit duration (`unit_ms = 1200 / WPM`). Default: `15 WPM` (`80 ms / dot`). |
| **`05. Parameters`** | `SIDETONE FREQUENCY` (`300–1500 Hz`) | Adjusts Web Audio CW sidetone pitch. Default: `750 Hz`. |
| **Global Shortcut** | `Esc` key | Immediately aborts any active ESP32 & local optical transmission (`POST /api/stop`). |

---

## 8. REST API & USB Serial Protocol Reference

### HTTP REST API (Port `80`, CORS Enabled)

| Method & Route | Request Body (JSON) | Description |
| :--- | :--- | :--- |
| `GET /` | — | Serves the standalone embedded HTML emergency transmitter portal. |
| `GET /api/ping` | — | Health probe returning firmware version, uptime, `gpio_builtin: 2`, `gpio_optical: 4`. |
| `GET /api/status` | — | Returns active transmission state, sequence, `unit_ms`, free heap, pulse counter, Wi-Fi mode, and IP. |
| `POST /api/transmit` | `{"morse":"... --- ...","unit_ms":80,"repeat":1}` | Queues a non-blocking optical Morse burst on FreeRTOS Core 1 (`unit_ms`: `20–1000`). |
| `POST /api/stop` | — | Immediately cancels the active burst and forces both `D2` and `D4` `LOW`. |

#### Quick `curl` / PowerShell Hardware Test
```powershell
# Ping ESP32 directly from PowerShell (when connected to OPTIX-Optical-Transmitter)
Invoke-RestMethod http://192.168.4.1/api/ping

# Trigger SOS optical burst (80ms dot, 2 repeats)
Invoke-RestMethod -Method Post -Uri http://192.168.4.1/api/transmit `
  -ContentType "application/json" `
  -Body '{"morse":"... --- ...","unit_ms":80,"repeat":2}'

# Emergency Stop
Invoke-RestMethod -Method Post -Uri http://192.168.4.1/api/stop
```

### USB Serial CLI (`115200` Baud, `\n` Terminated)

| Command | Example | Behavior |
| :--- | :--- | :--- |
| `PING` | `PING` | Replies `[ACK] PONG \| Uptime: <sec> \| Heap: <bytes>` |
| `STATUS` | `STATUS` | Replies active state, current sequence, and total optical pulses |
| `TX <morse> [unit_ms] [repeat]` | `TX ...---... 80 2` | Queues optical burst on `D2` and `D4` |
| `STOP` | `STOP` | Aborts active transmission and turns LEDs OFF |

---

## 9. Troubleshooting Guide

| Symptom | Root Cause | Fix |
| :--- | :--- | :--- |
| **Onboard blue LED (`D2`) blinks, breadboard LED (`D4`) stays dark** | LED inserted backwards, wrong pin, or loose jumper. | Swap the LED's two legs (long leg `+` → resistor → `D4`; short leg `-` → `GND`). Confirm pin silkscreen reads `D4`, not `D2` or `D15`. |
| **Neither LED blinks on power-up (no 3-blink POST)** | Firmware not flashed, power-only USB cable, or brownout. | Re-flash `esp32_firmware.ino` using a **data** USB cable. Press `EN`/`RST` and check Serial Monitor at `115200` baud. |
| **App plays Morse sound, but ESP32 LED doesn't blink** | Console still in `Simulated ESP32` mode, or wrong button tapped. | Open **`04. Hardware`** → set mode to **`Wi-Fi HTTP REST`** (or **`Web Serial (USB)`**) → tap **`PING ESP32`**. In **`01. Transmit`**, tap **`TRANSMIT VIA ESP32 ↵`** (not `LOOP BEACON`). |
| **`http://192.168.4.1` times out on mobile** | Phone's cellular data is overriding the offline ESP32 Wi-Fi. | **Turn OFF Mobile Data (4G/5G)** on your phone, reconnect to `OPTIX-Optical-Transmitter`, and tap **Stay Connected**. |
| **`http://192.168.4.1` works on phone, but `http://192.168.4.2:3000` times out** | Windows Defender Firewall blocking Node.js inbound traffic, or wrong laptop IP. | Check `node server.js` output for the exact `192.168.4.x` IP, and add the Windows Firewall rules in [Section 5](#windows-firewall-setup-if-mobile-cannot-reach-3000-or-3443). |
| **`PING ESP32` fails when using `https://...:3443` on phone** | Browser blocks Mixed Content (`https://` → `http://192.168.4.1`). | Open **`04. Hardware`** and turn **ON** **`CORS Relay Proxy`**, then tap **`PING ESP32`** again. |
| **Web Serial (`CONNECT USB SERIAL`) fails or port busy** | Arduino IDE Serial Monitor is still open, or unsupported browser. | Close Arduino IDE Serial Monitor completely. Use desktop **Chrome** or **Edge** (Firefox/Safari lack Web Serial). |
| **Voice Dictation gives a network error on SoftAP Wi-Fi** | Browser Web Speech API requires internet on most phones/PCs. | Switch to **Method B (Laptop USB Web Serial)** or **Method E (Shared Router STA Mode)** so the browser retains internet access while controlling the ESP32. |
| **ESP32 won't connect to home Wi-Fi in STA Mode** | Router is 5 GHz-only or typo in `STA_SSID` / `STA_PASS`. | ESP32 only supports **2.4 GHz Wi-Fi**. Wait 10s — firmware automatically falls back to SoftAP (`OPTIX-Optical-Transmitter`). |
| **Arduino IDE stuck on `Connecting......` during upload** | Board auto-reset circuit didn't enter bootloader mode. | Press and **hold** the **`BOOT`** button when `Connecting......` appears; release once upload progress `%` begins. |

---

## 10. Pre-Demo Verification Checklist

- [ ] **Wiring check:** `D4` → `220 Ω` resistor → LED Long Leg (`+`), LED Short Leg (`-`) → `GND`.
- [ ] **POST check:** Plug in USB (or press `EN`/`RST`) → confirm **both** blue onboard LED (`D2`) and breadboard LED (`D4`) flash **3 times**.
- [ ] **Wi-Fi check:** `OPTIX-Optical-Transmitter` appears in Wi-Fi list (or Station IP prints in Serial Monitor if using STA Mode).
- [ ] **Mobile check (if demoing on phone):** Mobile Data **OFF**, Wi-Fi joined with **Stay Connected**, firewall ports `3000`/`3443` allowed.
- [ ] **Console check:** **`04. Hardware`** set to **`Wi-Fi HTTP REST`** (or **`Web Serial (USB)`**), **`CORS Relay Proxy`** ON if using HTTPS, **`PING ESP32`** reports `ONLINE`.
- [ ] **Live optical check:** Send **`SOS`** (`... --- ...`) via **`TRANSMIT VIA ESP32 ↵`** and confirm crisp synchronized blinking on `D2` and `D4` — test **`Esc` / ABORT** to verify instant hardware cutoff.
