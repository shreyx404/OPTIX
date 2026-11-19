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
| [HARDWARE_SETUP.md](HARDWARE_SETUP.md) | Complete ESP32 & breadboard wiring, flashing, firewall, and laptop/mobile/USB/STA setup guide |
| [esp32_firmware/README_FIRMWARE.md](esp32_firmware/README_FIRMWARE.md) | ESP32 wiring schematics, MOSFET driver circuit, flashing, and standalone SoftAP operation |
| [Project_OPTIX_Report.docx](Project_OPTIX_Report.docx) | Complete 20-page institutional project report (cover page, abstract, objectives, network architecture, addressing, FreeRTOS firmware, 9 empirical tests, 11 figures, challenges, and Phase 2 roadmap; student details blank) |
| [Project_OPTIX_BIOT_Report.docx](Project_OPTIX_BIOT_Report.docx) | Comprehensive 32-page formal Basics of IoT (BIOT) course project report formatted to official university guidelines (Cover page, Certificate, Synopsis, Acknowledgement, Abstract, Table of Contents, Chapters 1–8, References, and all 11 empirical figures; student info blank) |
| [OPTIX_Presentation.pptx](OPTIX_Presentation.pptx) | 8-slide project presentation deck (abstract, program flow, BIOT syllabus Units I–IV mapping, beyond-syllabus topics, live UI outputs, and Phase 2 roadmap; student info blank) |

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
  - `06. 3D Torch` — Lazy-loaded offline Three.js interactive digital twin of the Phase 2 **OPTIX-MK2** self-contained tactical torch (**Raspberry Pi CM5** + **10W Cree XHP50 collimated LED** + **IRLZ44N MOSFET driver** + **INMP441 I2S MEMS mic** + **live 1.3" OLED** + **4 clickable hardware buttons** + **2S 18650 pack** + **USB-C PD BMS** + **custom 3D-printed housing**). Supports **Assembled / X-Ray / Exploded (0–100%)** views, 5 camera presets, clickable 9-subsystem BOM inspector, **Fullscreen Presentation Mode** with floating dock, and real-time sync to the OPTIX Morse engine (beam, `GPIO 18` wire glow, and live 3D OLED).
- **Mobile-First Field Ergonomics**: Sticky thumb-zone action bar on mobile (`<= 640px`), iOS/Android notch safe-area insets (`env(safe-area-inset-*)`), `>= 44px` coarse-pointer touch targets, `>= 16px` mobile input floor to prevent iOS focus zoom, and horizontal snap-scrolling tab bar.
- **Resilient Multimodal Fallback**: If an external ESP32 endpoint is unreachable, OPTIX logs the fault and automatically cascades transmission to the local Mobile Camera Torch / Screen Beacon so emergency signaling never fails silently.

---

## Phase 1 Proof-of-Concept vs. Phase 2 Future Scope (OPTIX-MK2)

OPTIX follows a two-phase hardware development roadmap designed for **RF-denied, zero-network environments** (military operations, backcountry hikers, search & rescue, and disaster zones):

- **Phase 1 — Benchtop Proof-of-Concept (Live Hardware Demo)**: Validates the complete optical communication pipeline end-to-end using an **ESP32 + breadboard + OPTIX web console** — proving voice/text ingestion, opt-in adaptive semantic compression (up to 50% shorter optical bursts), ITU-R M.1677-1 timing, and non-blocking FreeRTOS LED keying.
- **Phase 2 — Self-Contained Tactical Torch (`OPTIX-MK2`, Future Scope + Live 3D Digital Twin)**: Consolidates all processing into a single rugged 3D-printed handheld torch with zero phone or network dependency:
  - **Onboard AI Compute**: **Raspberry Pi Compute Module 5 (CM5, 4GB RAM, 32GB eMMC, `55 × 40 mm`)** — chosen over Pi Zero 2 W (`512 MB RAM` cannot run local AI compression alongside STT) and standard Pi 5 (`85 × 56 mm` too bulky for a `52 mm` barrel) to run offline `whisper.cpp` (Speech-to-Text) + quantized `SmolLM2` / `Qwen2.5-0.5B` semantic compression locally.
  - **Field Controls & Power**: 4 IP67 hardware buttons (`PTT Voice AI`, `TX Morse`, recessed crimson `SOS`, `MODE / Steady Beam`), live 1.3" OLED, `INMP441` I2S MEMS mic, 10W collimated LED (`1.5–3 km` night LOS), `2S1P 18650` battery pack (`25.9 Wh`), and **18W USB-C PD** fast charging.
  - **Estimated Prototype BOM**: `~$118` (`~₹9,800`). Full subsystem architecture, pinout map, and BOM breakdown are documented in [ARCHITECTURE.md](ARCHITECTURE.md) and inspectable interactively in **`06. 3D Torch`** (including **Fullscreen Presentation Mode**).

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
├── CHANGELOG.md                      # Version history
├── HARDWARE_SETUP.md                 # Complete ESP32 & breadboard wiring, flashing, firewall & access guide
├── Project_OPTIX_Report.docx         # Complete 20-page institutional project report (student details blank)
├── Project_OPTIX_BIOT_Report.docx    # Comprehensive 32-page formal BIOT course project report (VIT Pune format; student info blank)
└── OPTIX_Presentation.pptx          # 8-slide OPTIX project presentation deck (mapped to BIOT Units I–IV)
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

## Keyboard Shortcuts & Accessibility

| Shortcut | Context | Action |
| :--- | :--- | :--- |
| `Ctrl+Enter` / `Cmd+Enter` | Payload textarea (`01. Transmit`) | Dispatch optical transmission (IME-safe) |
| `Esc` | Global / Fullscreen Beacon | Emergency `ABORT` active transmission or stop & exit fullscreen |
| `ArrowLeft` / `ArrowRight` / `Home` / `End` | Navigation tabs | Move roving focus between workspaces `01`–`06` |
| `Space` / `Enter` | Manual Key (`#tapperKey`) & Optical Diode D1 | Key Morse dit/dah (or hold to test optical aperture) |
| `ArrowLeft` / `ArrowRight` / `Enter` | TTL Oscilloscope canvas | Inspect individual pulses and seek playback |

- **WCAG AA/AAA & 2.3.1 Hardening**: Single `<main>` landmark, keyboard skip link, visible `:focus-visible` outlines on every control (including range sliders), accessible `#toastRegion` (`role="alert"`/`role="status"`), XSS-safe DOM rendering, Pointer Events capture + blur release on the telegraph paddle, and a mandatory WCAG 2.3.1 photosensitive strobe safety gate on Fullscreen Beacon.

---

## Verification & Quality Gates

- Zero external build step or runtime bundler required — runs directly from static ES modules with lazy dynamic loading of `js/torchDigitalTwin.js` (`-711 KB` initial startup payload).
- Multi-skill UI audit & remediation verified across `impeccable`, `ui-ux-pro-max`, `design-system`, `ui-styling`, and `brand` — live desktop (`1280×800`) and mobile (`390×844`) scans via `impeccable detect --json http://localhost:3000` return **`[]` (`0` warnings / `0` anti-patterns)**.
- Syntax verification (`node --check`) and DOM ID integrity verified across all JavaScript modules (`0` syntax errors, `0` broken IDs).
- See [esp32_firmware/README_FIRMWARE.md](esp32_firmware/README_FIRMWARE.md) for wiring diagrams, pinout safety, and hardware troubleshooting.
