# OPTIX — Adaptive Semantic Optical Morse Communication System

**Version 4.0.2 · Quiet Minimal / Swiss Purism Optical Instrument**

> Visible Light Communication (VLC) transmitter and telemetry workstation for encoding voice dictation, plain text, emergency tokens, and manual telegraph keying into ITU-R M.1677-1 Morse optical bursts — driving ESP32 LEDs, mobile camera torches, and calibrated screen beacons.

---

## Documentation Index

| Document | Scope |
| :--- | :--- |
| [README.md](README.md) | Project overview, quick start, workspaces, and field deployment |
| [PRODUCT.md](PRODUCT.md) | Product truth, target operators, capabilities, and brand commitments |
| [DESIGN.md](DESIGN.md) | Quiet Minimal / Swiss Purism visual system, tokens, typography, and mobile rules |
| [ARCHITECTURE.md](ARCHITECTURE.md) | End-to-end system architecture, ES module graph, timing engine, and Phase 2 digital twin |
| [PROTOCOL.md](PROTOCOL.md) | ITU-R M.1677-1 timing math, semantic compression invariants, REST API, and UART protocol |
| [SECURITY_AND_SAFETY.md](SECURITY_AND_SAFETY.md) | WCAG 2.3.1 strobe safety gate, optical safety, HTTPS mic policy, and XSS/CORS boundaries |
| [CHANGELOG.md](CHANGELOG.md) | Release history from v1.0 POC through v4.0.2 Quiet Minimal redesign |
| [esp32_firmware/README_FIRMWARE.md](esp32_firmware/README_FIRMWARE.md) | ESP32 wiring schematics, MOSFET driver circuit, flashing, and standalone SoftAP operation |

---

## System Pipeline

```text
HOST [WEB / MOBILE] ────> BRIDGE [HTTP REST / USB UART / SIM] ────> ESP32 (GPIO 2 / 4) ────> OPTICAL EMITTER
  · Voice Dictation          · Wi-Fi SoftAP (192.168.4.1)             · FreeRTOS Keying        · High-Power LED
  · Text & Emergency Tokens  · Web Serial (115200 baud)               · Microsecond Timing     · Camera Torch
  · Manual Telegraph Key     · Offline Virtual Simulator              · Hardware Abort         · Screen Beacon
```

---

## Key Capabilities

- **Six Operational Workspaces**:
  - `01. Transmit` — Borderless payload stream, opt-in Adaptive Compression (Huffman-Morse semantic contraction preserving negations), Standard Emergency Tokens (`SOS`, `MED HELP`, `FIRE EVAC`, `NEED WATER`, `ALL SAFE`, +3 extended), live `SIGNAL ROUTING PATH`, interactive **Optical Diode D1** aperture dial (`N 0° 00'`, `100mW`, `λ 650nm`, `F/1.4`), stacked `S / O / S` symbol stream with click-to-audition tones, collapsible 3.3V TTL signal trace, and `TRANSMIT VIA ESP32 ↵` / `LOOP BEACON` triggers.
  - `02. Manual Key` — Tactile circular telegraph paddle with automatic dit/dah duration detection (`1.8T` threshold), keyboard spacebar support, discrete dot/dash/gap keys, live Morse and decoded text buffers, and clickable ITU-R M.1677-1 character reference matrix (`A–Z · 0–9`).
  - `03. Beacon` — Synchronized local optical emitter stage, calibrated light-mode 3.3V TTL oscilloscope with mouse/keyboard pulse inspection and click-to-seek, speed slider (`5–40 WPM`), burst loop controls (`1x`, `3x`, `5x`, `∞ LOOP`), Mobile Camera Torch strobe, Acoustic CW Sidetone, and WCAG 2.3.1 gated Fullscreen Strobe.
  - `04. Hardware` — ESP32 connection pipeline diagram, mode selector (`Simulated ESP32`, `Wi-Fi HTTP REST`, `Web Serial USB`), SoftAP host/port configuration, CORS proxy switch, live heartbeat ping, and XSS-safe UTC telemetry log.
  - `05. Parameters` — Transmission speed (`5–40 WPM` with live `ms / dot` calculation), sidetone frequency (`300–1500 Hz`), burst repeat selector, and ITU-R M.1677-1 timing ratio specification table.
  - `06. 3D Torch` — Lazy-loaded offline Three.js interactive digital twin of the Phase 2 **OPTIX-MK2** self-contained torch (Raspberry Pi CM5 + 10W collimated LED + 4 hardware buttons + Assembled/X-Ray/Exploded inspection), live-synced to the optical keying engine.
- **Mobile-First Field Ergonomics**: Sticky thumb-zone action bar on mobile (`<= 640px`), iOS/Android notch safe-area insets (`env(safe-area-inset-*)`), `>= 44px` coarse-pointer touch targets, `>= 16px` mobile input floor to prevent iOS focus zoom, and horizontal snap-scrolling tab bar.
- **Resilient Multimodal Fallback**: If an external ESP32 endpoint is unreachable, OPTIX logs the fault and automatically cascades transmission to the local Mobile Camera Torch / Screen Beacon so emergency signaling never fails silently.

---

## Directory Structure

```text
OPTIX/
├── index.html                        # Unified Quiet Minimal web console (6 workspaces)
├── css/
│   └── styles.css                    # 3-layer Swiss Purism light-mode design tokens & responsive layout
├── js/
│   ├── app.js                        # Main state coordinator, DOM bindings & live telemetry sync
│   ├── morseEngine.js                # ITU-R M.1677-1 encoder/decoder, semantic compressor & timeline builder
│   ├── opticalTransmitter.js         # Light-mode TTL oscilloscope, screen beacon, torch & playback scheduler
│   ├── audioSidetone.js              # Web Audio API harmonic CW acoustic sidetone (300–1500 Hz)
│   ├── speechHandler.js              # Web Speech API voice dictation controller
│   ├── esp32Service.js               # Wi-Fi HTTP REST, CORS proxy, Web Serial (115200) & virtual simulator
│   ├── torchDigitalTwin.js           # Lazy-loaded Three.js Phase 2 OPTIX-MK2 3D hardware simulator
│   └── vendor/
│       └── three.module.min.js       # Bundled offline Three.js ES module (zero CDN dependency)
├── esp32_firmware/
│   ├── esp32_firmware.ino            # ESP32 C++ FreeRTOS optical timing firmware & standalone portal
│   └── README_FIRMWARE.md            # Hardware BOM, wiring schematics, flashing & field access guide
├── server.js                         # Node.js HTTP/HTTPS dev server, CORS relay proxy & mock ESP32 API
├── server.py                         # Zero-dependency Python 3 server alternative
├── package.json                      # Package metadata & npm scripts
├── PRODUCT.md                        # Product definition & operational principles
├── DESIGN.md                         # Visual design system specification
├── ARCHITECTURE.md                   # System & software architecture reference
├── PROTOCOL.md                       # Optical timing, compression & hardware wire protocol spec
├── SECURITY_AND_SAFETY.md            # Photosensitive strobe safety, optical & transport security
└── CHANGELOG.md                      # Version history
```

---

## Quick Start

### Option A: Node.js (Recommended — HTTP + Mobile HTTPS)

```bash
npm start
# or: node server.js
```

### Option B: Python 3 (Zero-Dependency Fallback)

```bash
python server.py
```

### Access Endpoints

- **Desktop**: `http://localhost:3000`
- **Local HTTPS (Required for Mobile Microphone Dictation)**: `https://localhost:3443` or `https://<LAN_IP>:3443`
- **Mobile Field Console via ESP32 SoftAP**: Connect phone to Wi-Fi `OPTIX-Optical-Transmitter` (password: `12345678`), disable Mobile Data, and open `http://<HOST_IP>:3000`.
- **Standalone Offline ESP32 Portal (Zero Laptop Required)**: Power the flashed ESP32 from any 5V USB power bank, join `OPTIX-Optical-Transmitter`, and open `http://192.168.4.1`.

---

## Verification & Quality Gates

- Zero external build step or runtime bundler required — runs directly from static ES modules.
- Automated UI audit verified via `impeccable detect --json http://localhost:3000` (`0` warnings / `0` anti-patterns).
- Syntax verification across all JavaScript modules via `node --check`.
- See [esp32_firmware/README_FIRMWARE.md](esp32_firmware/README_FIRMWARE.md) for wiring diagrams, pinout safety, and hardware troubleshooting.
