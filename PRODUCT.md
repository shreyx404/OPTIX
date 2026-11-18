# Product

<!-- impeccable:product-schema 1 -->

> **Related Documentation:** [README.md](README.md) · [Project_OPTIX_Report.docx](Project_OPTIX_Report.docx) · [Project_OPTIX_DCN_Report.docx](Project_OPTIX_DCN_Report.docx) · [HARDWARE_SETUP.md](HARDWARE_SETUP.md) · [OPTIX_Presentation.pptx](OPTIX_Presentation.pptx) · [ARCHITECTURE.md](ARCHITECTURE.md) · [PROTOCOL.md](PROTOCOL.md) · [DESIGN.md](DESIGN.md) · [SECURITY_AND_SAFETY.md](SECURITY_AND_SAFETY.md)

## Platform

web

## Stack

Vanilla HTML5, Modern CSS (3-layer design tokens, mobile-first safe areas), ES Modules JavaScript, Web Audio API, Web Speech API, Web Serial API, Three.js (bundled offline), Node.js / Python 3 local bridge servers, and FreeRTOS ESP32 C++ Firmware.

## Users

Field operators, military personnel, backcountry hikers, emergency response & search-and-rescue (SAR) teams, and embedded systems engineers operating in RF-denied, off-grid, infrastructure-compromised, or electronic-warfare environments where cellular, Wi-Fi, and satellite links are jammed or unavailable.

## Product Purpose

OPTIX provides a reliable, direct Visible Light Communication (VLC) telecommunications interface. In **Phase 1 (Benchtop Proof-of-Concept)**, it accepts voice dictation, typed plain text, emergency token presets, or manual telegraph keying, computes opt-in semantic contractions to minimize optical beacon exposure, modulates the signal to standard ITU-R M.1677-1 Morse code, and drives optical emitters (ESP32 LEDs, mobile camera torches, and calibrated screen beacons). In **Phase 2 (OPTIX-MK2 Self-Contained Tactical Torch — Future Scope & Interactive 3D Digital Twin)**, all speech-to-text (`whisper.cpp`), quantized AI semantic compression (`SmolLM2`/`Qwen2.5-0.5B`), and 10W collimated LED keying execute autonomously onboard a **Raspberry Pi CM5** inside a custom 3D-printed rugged torch with zero phone or network dependency.

## Positioning

Adaptive Semantic Optical Telecommunications: Unlike conventional bulk optical modems, OPTIX pairs an opt-in adaptive semantic tokenization engine (saving up to 50% optical air time while strictly preserving negations) with a laboratory-calibrated Swiss Purism interface that remains legible on desktops, tablets, and field smartphones — and bridges directly from an ESP32 benchtop prototype to a full self-contained tactical torch digital twin.

## Operating Context

- **Environment**: Off-grid backcountry/mountain trails, military tactical patrols, disaster shelters, maritime optical signaling, outdoor daylight or indoor testbenches, and embedded hardware prototyping stations.
- **Phase 1 Hardware Integration**: ESP32 microcontrollers over Wi-Fi HTTP SoftAP (`192.168.4.1`) or USB Web Serial (`115200` baud), driving LEDs via GPIO 2/4 with non-blocking FreeRTOS hardware timing; plus a client-side virtual simulator for zero-hardware offline validation.
- **Phase 2 Self-Contained Target (`OPTIX-MK2`)**: Custom 3D-printed CF-PETG/PA12 torch housing integrating a Raspberry Pi CM5 (4GB RAM, 32GB eMMC), INMP441 I2S MEMS mic, live 1.3" SH1106 OLED, 4 IP67 hardware buttons (`PTT Voice AI`, `TX Morse`, recessed crimson `SOS`, `MODE / Steady Beam`), IRLZ44N MOSFET driver, 10W Cree XHP50 collimated LED, 2S1P 18650 Li-Ion pack (25.9Wh), and 18W USB-C PD 2S BMS (~$118 / ~₹9,800 estimated BOM).
- **Physical Affordances**: Screen luminescence beacon with WCAG 2.3.1 safety gate, high-speed rear camera torch strobe, 300–1500 Hz harmonic CW acoustic sidetone, press-and-hold optical diode manual test aperture, and interactive fullscreen 3D Torch Digital Twin.

## Capabilities and Constraints

- **Input Modalities**: Voice dictation (Web Speech API over HTTPS/localhost with `initialText` preservation and `navigator.onLine` offline status awareness), borderless text stream input (`Ctrl/Cmd+Enter` transmit), standard emergency token bank (`SOS`, `MED HELP`, `FIRE EVAC`, `NEED WATER`, `ALL SAFE`, plus extended tokens), manual Morse telegraph paddle with automatic dot/dash duration detection (`1.8T` threshold), `Backspace` editing, clickable `A–Z · 0–9` Morse reference chart, and clickable 3D Torch hardware button triggers (`PTT`, `TX`, `SOS`, `MODE`).
- **Modulation & Timing**: ITU-R M.1677-1 Morse standard (`1T` dot, `3T` dash, `1T` intra-element gap, `3T` inter-character gap, `7T` inter-word gap), drift-compensated monotonic `performance.now()` scheduling, adjustable speed (`5–40 WPM`), adjustable audio sidetone frequency (`300–1500 Hz`), burst repeat counts (`1x`, `3x`, `5x`, `∞ LOOP`), and `localStorage` persistence of calibrated operator settings.
- **Telemetry & Monitoring**: Live UTC mission clock, interactive 3.3V TTL pulse oscilloscope with mouse/keyboard scrubbing, character/unit/duration counters, unsupported-character inline alerts, live optical diode current readout (`24.2 mA` standby / `180.0 mA` emitting), signal routing path indicator, 15-second Wi-Fi ESP32 heartbeat monitoring, live 3D Torch OLED telemetry texture, and continuous XSS-safe UTC hardware telemetry log.
- **Workspaces**: Six numbered modules (`01. Transmit`, `02. Manual Key`, `03. Beacon`, `04. Hardware`, `05. Parameters`, `06. 3D Torch` lazy-loaded with Fullscreen Presentation Mode).
- **Safety & Accessibility**: Dedicated high-priority `ABORT` button (`Esc` global shortcut) with honest hardware `/api/stop` failure alerts, WCAG 2.3.1 photosensitive strobe safety gate with live Hz disclosure, 2-second arming countdown, reduced-motion non-strobe default, automatic stop-on-exit, full keyboard-only operability, and WAI-ARIA landmark/tablist/live-region compliance.

## Brand Commitments

- **Name**: OPTIX (Adaptive Semantic Optical Telecommunications)
- **Visual Identity**: Quiet Minimal / Swiss Purism (Kenya Hara inspired) — alabaster gallery ground (`#f7f7f7`), pure white framed instrument surfaces (`#ffffff`), 1px hairlines (`#e5e5e5`), matte jet ink (`#111111`), and strictly operational emerald/crimson accents.
- **Tone**: Laboratory-calibrated optical instrumentation and precision engineering specifications. No cartoonish gamification, no neon sci-fi clichés, no decorative clutter, zero emoji glyphs in UI controls.

## Product Principles

1. **Mission-Critical Precision**: Every status, voltage rail, diode current, baud rate, and timing metric must be authentic, calibrated, and instantly legible at a glance.
2. **Frictionless Tactical Speed**: An operator under stress must be able to arm, encode, and transmit critical emergency payloads in fewer than two taps — with thumb-zone primary controls on mobile.
3. **Quiet Minimal Clarity**: Pure signal, architectural negative space, razor hairlines, and WCAG AA/AAA contrast on every surface.
4. **Resilient Multimodal Fallback**: Graceful automatic fallback from physical ESP32 (Wi-Fi/Serial) to Camera Torch, Screen Beacon, and Virtual Simulation.
