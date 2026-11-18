# Signal & Hardware Protocol Specification — OPTIX

This specification defines the optical modulation standard, adaptive semantic contraction rules, HTTP REST contract, and USB Web Serial wire protocol implemented across the OPTIX web console and ESP32 firmware.

---

## 1. Optical Modulation Standard (ITU-R M.1677-1)

OPTIX modulates all signals strictly according to **ITU-R M.1677-1** International Morse Code using the **PARIS** timing standard.

### Base Unit Formula

$$\text{unitMs} = \operatorname{round}\!\left(\frac{1200}{\text{WPM}}\right)$$

- Supported speed range in UI: **5 WPM** (`240 ms / dot`) to **40 WPM** (`30 ms / dot`).
- Default calibrated speed: **15 WPM** (`80 ms / dot`).
- Maximum square-wave optical flash frequency at a given WPM:

$$f_{\max} = \frac{1000}{2 \times \text{unitMs}} \text{ Hz}$$

### Element Timing Ratios

| Signal Element | Optical State | Duration | Default @ 15 WPM |
| :--- | :---: | :---: | :---: |
| **Dot (Dit)** | HIGH (`3.3V`) | `1T` | `80 ms` |
| **Dash (Dah)** | HIGH (`3.3V`) | `3T` | `240 ms` |
| **Intra-element gap** | LOW (`0.0V`) | `1T` | `80 ms` |
| **Inter-character gap** | LOW (`0.0V`) | `3T` | `240 ms` |
| **Inter-word gap** | LOW (`0.0V`) | `7T` | `560 ms` |
| **Inter-cycle repeat gap** | LOW (`0.0V`) | `max(420 ms, 7T)` | `560 ms` |

### Text-to-Morse Encoding Format

- Letters within a word are separated by a single space (` `).
- Words are separated by ` / `.
- Example: `SOS` → `... --- ...` (`27` units = `2.16s` at `15 WPM`, `55.6%` duty cycle).
- Unsupported Unicode characters outside the ITU table are explicitly reported via `#unsupportedCharsWarn` and omitted from the transmitted pulse stream.

### Manual Key Duration Detection

- Press duration `< 1.8 × unitMs` → **Dot (`.`)**
- Press duration `>= 1.8 × unitMs` → **Dash (`-`)**
- Inactivity pause `>= 3.5 × unitMs` → Automatic inter-character commit and decode.

---

## 2. Adaptive Semantic Compression (Opt-In)

Adaptive Compression (`applySemanticCompression` in `js/morseEngine.js`) is **opt-in by default** to guarantee verbatim fidelity on critical messages unless explicitly enabled by the operator.

### Safety Invariants

1. **Negation Preservation**: Messages matching `\b(no|not|never|without|none|cannot|can't|dont|don't)\b` never strip negation words and never rewrite phrases into `SAFE` (e.g., *"Not all clear"* will never invert to `SAFE`).
2. **Subject & Possession Retention**: Words such as `WE`, `HAVE`, and `NEED` are preserved; only non-semantic articles and prepositions (`the`, `a`, `an`, `is`, `are`, `our`, `in`, `at`, `to`) are elided.
3. **Transparent Diff & 1-Tap Override**: Whenever compression produces unit savings, the console displays the exact before/after diff (`Original → Compressed (−X% time)`) with a 1-tap `Apply` / `Send Raw` toggle.

### Standard Emergency Tokens

| Token Code | Category | Short Tag | Operational Meaning |
| :--- | :--- | :--- | :--- |
| `SOS` | `critical` | Distress | General Distress / Immediate Danger |
| `MED HELP` | `critical` | Medical | Injured Person / Medic Required |
| `FIRE EVAC` | `hazard` | Alert | Fire Reported / Evacuate Now |
| `NEED WATER` | `supplies` | Supply | Drinking Water Critical Shortage |
| `ALL SAFE` | `status` | Ack | Team is Safe / Situation Contained |
| `TRAPPED SOS` | `critical` | Rescue | Trapped in Location / Urgent Rescue |
| `NEED FOOD` | `supplies` | Rations | Emergency Food Supplies Required |
| `ACK RCV` | `status` | Confirm | Message Received & Understood |

---

## 3. ESP32 HTTP REST API Contract

- **Default SoftAP Endpoint**: `http://192.168.4.1:80` (SSID: `OPTIX-Optical-Transmitter`, Password: `12345678`)
- **CORS**: All endpoints return `Access-Control-Allow-Origin: *`.
- **Optional Mixed-Content Relay**: When `CORS Relay Proxy` is enabled in `04. Hardware`, requests route through `GET/POST /proxy/esp32?url=<encoded_target>`.

### `GET /api/ping`

Heartbeat verification (timeout: `2500 ms`).

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

### `GET /api/status`

Polled every `15 s` while in active Wi-Fi mode to detect silent board resets or link loss.

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

### `POST /api/transmit`

Dispatches an optical Morse burst to the ESP32 FreeRTOS task (timeout: `5000 ms`).

**Request Body:**
```json
{
  "morse": "... --- ...",
  "text": "SOS",
  "unit_ms": 80,
  "repeat": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Optical transmission queued",
  "sequence": "... --- ...",
  "unit_ms": 80,
  "repeat": 1
}
```

### `POST /api/stop`

Immediately halts active optical transmission and forces GPIO LOW (timeout: `3000 ms`).

**Request Body:**
```json
{
  "stop": true
}
```

---

## 4. USB Web Serial Protocol (115200 Baud)

- **Parameters**: `115200` baud, 8N1, UTF-8 line-delimited (`\n`).
- **Browser Support**: Chromium-based browsers (Chrome, Edge) via `navigator.serial`.

| Command | Direction | Format / Description |
| :--- | :---: | :--- |
| `TX` | Host → ESP32 | `TX <morse> <unitMs> <repeat>\n` — Example: `TX ... --- ... 80 1\n` |
| `STOP` | Host → ESP32 | `STOP\n` — Immediate optical abort, forces GPIO LOW |
| `PING` | Host → ESP32 | `PING\n` — Returns device uptime and free heap |
| `STATUS` | Host → ESP32 | `STATUS\n` — Returns active sequence and pulse telemetry |

---

## 5. Phase 2 (`OPTIX-MK2`) Onboard Embedded Bus & GPIO Pinout Map

In the self-contained Phase 2 **OPTIX-MK2** torch (modeled in `06. 3D Torch`), all peripheral signaling executes directly over the **Raspberry Pi CM5** custom carrier PCB without Wi-Fi or host-phone transport:

| Peripheral / Subsystem | Bus / Signal | CM5 GPIO Pinout | Electrical & Functional Spec |
| :--- | :--- | :--- | :--- |
| **MOSFET Optical Keying Driver** | Hardware PWM / Digital TX | `GPIO 18` | `3.3V` TTL pulse train driving `IRLZ44N` gate for microsecond ITU-R M.1677-1 keying (`10W` Cree XHP50 LED) |
| **INMP441 Digital MEMS Mic** | 24-Bit I2S Digital Audio | `GPIO 19` (LRCLK), `GPIO 20` (DIN), `GPIO 21` (BCLK) | `3.3V` digital audio bus feeding offline `whisper.cpp` STT; immune to high-current LED PWM switching noise |
| **1.3" SH1106 Telemetry OLED** | I2C (`400 kHz`) | `GPIO 2` (SDA), `GPIO 3` (SCL) | Displays active mode, compressed payload, Morse stream, AI time savings %, WPM, and `7.4V` fuel-gauge battery % |
| **BTN 1 · PTT (Voice AI)** | GPIO Active-Low Interrupt | `GPIO 5` | Triggers onboard microphone capture → `whisper.cpp` STT → quantized LLM semantic compression |
| **BTN 2 · TX (Morse / Key)** | GPIO Active-Low Interrupt | `GPIO 6` | Dispatches encoded payload to `GPIO 18` optical emitter or operates as direct manual telegraph paddle |
| **BTN 3 · SOS (Distress)** | GPIO Active-Low Interrupt | `GPIO 13` | Recessed crimson hardware override — forces immediate high-priority `SOS` (`... --- ...`) distress burst |
| **BTN 4 · MODE (Beam)** | GPIO Active-Low Interrupt | `GPIO 26` | Cycles operating modes (`VOICE AI`, `PRESET`, `MORSE BEACON`, and `STEADY 10W FLASHLIGHT`) |
| **USB-C PD BMS & Debug Port** | USB Type-C (`5V–15V` PD) | Dedicated 2S BMS + UART | `18W` fast charging for 2S1P 18650 pack (`7.4V / 25.9Wh`), regulated `5V/3A` CM5 rail, and service UART |
