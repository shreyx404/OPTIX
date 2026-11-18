# Changelog — OPTIX

All notable changes to the **OPTIX Adaptive Semantic Optical Morse Communication System** are documented in this file.

---

## [4.0.2] — 2026-11-18

### Redesigned — Quiet Minimal / Swiss Purism Visual System
- Replaced the dark amber UI theme across all 6 workspaces (`index.html`, `css/styles.css`, `DESIGN.md`) with a **Quiet Minimal / Swiss Purism (Kenya Hara Insp.)** light-mode optical instrument aesthetic (`#f7f7f7` alabaster ground, `#ffffff` framed zones, `1px solid #e5e5e5` hairlines, `#111111` jet ink, `#0d7a55` link emerald, `#d92d20` 650nm emitter/danger red).
- Introduced unified sticky single-row header (`OPTIX`, live `SYS.SIMULATED / HH:MM:SS UTC` status, numbered navigation `01. Transmit`–`06. 3D Torch`, and bordered `● ABORT` button) and bottom calibration footer (`OPTIX v4.0.2 / ARCH: QUIET MINIMAL`, live `DIODE CURRENT: 24.2 mA` / `180.0 mA`, and live viewport calibration readout).
- Added interactive **Optical Diode D1** circular aperture dial (`N 0° 00'`, `100mW`, `λ 650nm`, `F/1.4`) on `01. Transmit` with live transmission pulsing and press-and-hold manual optical testing.
- Rebuilt **Symbol Stream Representation** with Swiss stacked letter-over-Morse notation (`S / O / S`), inline unit/duration/WPM metrics, collapsible live TTL trace toggle, and `TRANSMIT VIA ESP32 ↵` + `LOOP BEACON` action bar.
- Added live `SIGNAL ROUTING PATH` schematic (`HOST [WEB] ────> BRIDGE [UART] ────> ESP32 (GPIO 2) ────> EMITTER`) synced to active hardware mode and link status.
- Re-engineered the canvas oscilloscope in `js/opticalTransmitter.js` for crisp light-mode rendering (`#ffffff` ground, hairline graticule, `#111111` TTL square wave, `#d92d20` playhead, solid ink hover inspector).
- Adopted **JetBrains Mono** + **Public Sans** typography and resolved all mechanical design/contrast checks (`impeccable detect --json http://localhost:3000` → `0` warnings).

### Added — Mobile-First Touch Adaptation
- Added sticky thumb-zone `TRANSMIT VIA ESP32 ↵` / `LOOP BEACON` bottom bar on mobile (`<= 640px`) with frosted alabaster backdrop.
- Added full notch and home-indicator safe-area support (`env(safe-area-inset-top/bottom/left/right)`).
- Enforced `>= 44px` touch targets, `22px` coarse-pointer slider thumbs, `touch-action: manipulation`, and `>= 16px` mobile input/select font size to prevent iOS Safari focus zoom.
- Added horizontal `scroll-snap` header tabs with right-edge fade cue (`<= 1120px`), compact `176px` mobile diode dial, 2-column emergency tokens grid, non-overlapping mobile 3D Torch HUD, and safe toast positioning above the sticky bar.

### Added — Phase 2 (`OPTIX-MK2`) 3D Torch Fullscreen Presentation Mode & Architecture Docs
- Added **Fullscreen Presentation Mode** to `06. 3D Torch` (`FULLSCREEN` header button, HUD corner expand/compress toggle, native Fullscreen API + `.is-fullscreen` fallback, `Esc` exit, and automatic WebGL `ResizeObserver` rescaling) with a floating **Fullscreen Presentation Dock** (live clicked-part spec/BOM callout, synced Assembled/X-Ray/Exploded toggles, synced Explode slider, and `PTT Voice` / `TX Morse` / `SOS` / `Steady Beam` / `Exit` controls).
- Documented the complete Phase 1 Benchtop PoC → Phase 2 **OPTIX-MK2 Self-Contained Tactical Torch** engineering roadmap, Raspberry Pi CM5 (`4GB RAM`, `32GB eMMC`, `55×40mm`) selection rationale, 9-subsystem architecture, GPIO/I2S/I2C/USB-C PD pinout map, battery/thermal safety safeguards, and `~$118` (`~₹9,800`) prototype BOM across [README.md](README.md), [PRODUCT.md](PRODUCT.md), [DESIGN.md](DESIGN.md), [ARCHITECTURE.md](ARCHITECTURE.md), [PROTOCOL.md](PROTOCOL.md), [SECURITY_AND_SAFETY.md](SECURITY_AND_SAFETY.md), and [esp32_firmware/README_FIRMWARE.md](esp32_firmware/README_FIRMWARE.md).

### Added — System Documentation
- Created [ARCHITECTURE.md](ARCHITECTURE.md), [PROTOCOL.md](PROTOCOL.md), [SECURITY_AND_SAFETY.md](SECURITY_AND_SAFETY.md), and [CHANGELOG.md](CHANGELOG.md); updated [README.md](README.md), [PRODUCT.md](PRODUCT.md), [DESIGN.md](DESIGN.md), and [esp32_firmware/README_FIRMWARE.md](esp32_firmware/README_FIRMWARE.md).

---

## [3.0.0] — Beacon Oscilloscope, 3D Torch Digital Twin & Responsive Overhaul
- Rebuilt `Beacon & Waveform` console with live 3.3V TTL oscilloscope, interactive pulse scrubbing/keyboard seek, burst repeat modes (`1x`, `3x`, `5x`, `∞ Loop`), and WCAG 2.3.1 Fullscreen Strobe safety gate.
- Added lazy-loaded offline Three.js **OPTIX-MK2 3D Torch Digital Twin** (`js/torchDigitalTwin.js`) synced live to Morse playback with Assembled / X-Ray / Exploded views and clickable 4-button hardware deck.
- Added opt-in negation-safe semantic compression diff banner and automatic multimodal fallback to local optical beacon on hardware failure.

---

## [2.0.0] — OPTIX Rebrand & Warm Optical Instrument UI
- Rebranded project to **OPTIX** with structured design tokens (`DESIGN.md`), product specification (`PRODUCT.md`), keyboard roving tab navigation, and live UTC telemetry.

---

## [1.0.0] — Initial Proof of Concept (BIOTCP)
- Initial mobile-to-ESP32 visible light Morse communication prototype with voice dictation, manual telegraph paddle, Wi-Fi SoftAP HTTP REST, Web Serial USB, FreeRTOS ESP32 firmware, and Node.js / Python dev servers.
