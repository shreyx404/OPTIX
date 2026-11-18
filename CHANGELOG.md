# Changelog — OPTIX

All notable changes to the **OPTIX Adaptive Semantic Optical Morse Communication System** are documented in this file.

---

## [4.0.4] — 2026-11-19

### Added — Formal DCN Course Project Report Deliverable (VIT Savitribai Phule Pune University Format)
- **New Institutional DCN Report Created**: Generated [Project_OPTIX_DCN_Report.docx](Project_OPTIX_DCN_Report.docx) (and [DCN report.docx](DCN%20report.docx)) adhering strictly to the formal Vishwakarma Institute of Technology (VIT Pune) Data Communication and Networking (DCN) course project report template:
  - **Academic Front Matter**: Implements formal cover page, bonafide Certificate (Internal Guide: Prof. Priyanka Lahu Gaikwad; HOD: Dr. Priya Shelke), Project Synopsis with member tracking table, Acknowledgement, Abstract with standardized DCN keywords, and complete Table of Contents with synchronized page numbers.
  - **Student Information Left Blank**: Student names, Roll Numbers, PRN numbers, Contact numbers, Email addresses, and signatures are formatted as clean blank lines/cells for manual student entry.
  - **Comprehensive DCN Chapter Alignment (Chapters 1–8)**:
    - *Chapter 1 (Introduction)*: Overview, Need of the Network, 8 concrete DCN objectives, and project scope.
    - *Chapter 2 (Literature Review and Research Gap)*: Analysis of OWC/VLC, IEEE 802.15.7, ITU-R M.1677-1, RFC 1918 private networking, and 6 articulated research gaps.
    - *Chapter 3 (System Requirements Specification)*: Hardware, software, 10 functional requirements (FR1–FR10), and 5 non-functional engineering standards.
    - *Chapter 4 (Methodology and Network Architecture)*: 5-stage signal pipeline, 6-subsystem device inventory (Table 4.1), comprehensive addressing plan across IP/UART/timing (Table 4.2), ITU-R PARIS benchmark parameters across 5–40 WPM (Table 4.3), REST/UART services, and end-to-end workflow.
    - *Chapter 5 (Implementation)*: Toolchain, hardware breadboard wiring and IRLZ44N MOSFET stage (Table 5.1 & Figure 5.1), embedded FreeRTOS firmware listing (Listing 5.1), and 6 operational workspaces.
    - *Chapter 6 (Experiments and Results)*: Experimental benchtop setup, module evaluation, 9-test verification matrix with 100% Pass rate (Table 6.1), quantitative evaluation metrics, and 9 high-resolution empirical screenshots (Figures 6.1–6.9).
    - *Chapter 7 (Discussion, Conclusion and Future Scope)*: Strengths, physical/atmospheric limitations, conclusion, 7 key outcomes, and Phase 2 OPTIX-MK2 tactical torch roadmap.
    - *Chapter 8 (References)*: 15 formal academic citations formatted in IEEE/RFC citation standard.
- **Template PDF Cleaned**: Removed temporary template `DCN report.pdf` after successfully generating and verifying the final Word document.
- **System Documentation**: Synchronized document headers and cross-references across all system markdown files.

---

## [4.0.3] — 2026-11-19

### Aligned — BIOT (Internet of Things) Subject Syllabus Mapping & Deck Refinement
- **Presentation Renamed & Standardized**: Renamed `Copy of Presentation.pptx` to [OPTIX_Presentation.pptx](OPTIX_Presentation.pptx), establishing clean, uniform academic deliverable naming alongside [Project_OPTIX_Report.docx](Project_OPTIX_Report.docx).
- **Curriculum Mapping (Slide 4)**: Aligned Slide 4 directly with the formal **BIOT (Internet of Things)** syllabus across all four units:
  - **Unit I (Introduction to IoT)**: IoT definitions & characteristics (dynamic/self-adapting optical "Thing", unique MAC/IP addressing), 4-tier IoT Architecture (Perception, Network, Middleware, Application), physical & logical design (things, functional blocks, Request-Response model), and IoT vs M2M paradigm (point-to-point M2M serial/SoftAP telemetry vs scalable IP network integration).
  - **Unit II (Microprocessor & Microcontroller)**: Microcontroller selection criteria for IoT applications (32-bit dual-core Xtensa ESP32 selected over legacy MCS-51 8051 for deterministic microsecond FreeRTOS keying, on-chip Wi-Fi & low power), 240 MHz Harvard SoC architecture, GPIO 2/4 digital port configuration & 220Ω protection, logic-level IRLZ44N MOSFET power switching, Harvard IRAM/DRAM execution, and external 4MB SPI Flash memory interfacing.
  - **Unit III (IP-Based Protocols for IoT)**: RESTful IoT protocol (stateless HTTP/1.1 REST endpoints `/api/ping`, `/status`, `/transmit`, `/stop` with JSON schemas), protocol comparison (REST vs CoAP, MQTT, and AMQP for constrained links), IPv4 SoftAP (`192.168.4.1/24`) and IPv6-ready stack, WPA2-PSK SoftAP authentication, and CORS origin access control.
  - **Unit IV (IoT Security and Privacy)**: Security challenges & threat surface (mitigating RF jamming/eavesdropping via optical PHY; input boundary validation), zero-cloud offline data privacy, local TLS encryption, and fail-safe GPIO emergency stop logic.
- **Beyond Syllabus (Slide 5)**: Structured Slide 5 to showcase 6 advanced engineering accomplishments exceeding standard bachelor's coursework:
  1. Visible Light Communication (VLC) physical layer & ITU-R M.1677-1 Morse standards (PARIS timing).
  2. FreeRTOS preemptive dual-core multitasking on ESP32 Core 1 with microsecond-accurate timers (`vTaskDelayUntil`).
  3. Adaptive Semantic Compression (NLP engine) with Huffman-Morse tokenization and strict negation preservation.
  4. Advanced browser hardware APIs: driverless Web Serial (`navigator.serial` 115200 baud) and Web Speech/Audio APIs.
  5. Monotonic drift-compensated timing engine (`performance.now()`) with real-time 60 FPS HTML5 Canvas oscilloscope.
  6. Phase 2 OPTIX-MK2 tactical torch hardware architecture and Three.js WebGL interactive 3D CAD digital twin.
- **Institutional Alignment**: Updated Slide 1 with `Course / Subject: BIOT (Internet of Things)`, refined Slide 2 Abstract & Slide 6 Final Outputs with edge IoT node classifications, and updated [Project_OPTIX_Report.docx](Project_OPTIX_Report.docx) cover page with the formal course title.
- **System Documentation**: Synchronized all markdown documentation indexes across `README.md`, `PRODUCT.md`, `DESIGN.md`, `ARCHITECTURE.md`, `PROTOCOL.md`, `SECURITY_AND_SAFETY.md`, `HARDWARE_SETUP.md`, and `esp32_firmware/README_FIRMWARE.md`.

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

### Hardened — Multi-Skill UI Audit, Safety, Accessibility & Performance
- Audited across `impeccable`, `ui-ux-pro-max`, `design-system`, `ui-styling`, and `brand` guidelines; remediated all P0–P3 findings across operational workspaces (`0` warnings on live desktop `1280×800` and mobile `390×844` `impeccable detect` scans).
- **Safety & Reliability**: Built in-browser Virtual ESP32 simulation (zero `/mock-esp32` server dependency), automatic ESP32 → Camera Torch / Screen Beacon fallback, honest `/api/stop` failure alerts, WCAG 2.3.1 fullscreen strobe safety gate (live Hz disclosure, Night-Vision Amber / White / No-Strobe modes, 2s arming countdown, focus trap, stop-on-exit), Pointer Events capture + `window.blur` carrier-release safety on `#tapperKey`, clean Web Serial `serialReader.cancel()` disconnect + USB unplug listener, and 15-second Wi-Fi `GET /api/status` heartbeat polling.
- **Security & Data Fidelity**: Eliminated DOM `innerHTML` XSS sinks in `#activityLog` and `.breakdown-char` via pure `.textContent` node creation; switched Adaptive Compression to opt-in with negation preservation (`no`/`not`/`never`/`without`), live diff + 1-tap `Apply` / `Send Raw`, and inline `#unsupportedCharsWarn` alerts; dispatched `state.encodedText` (matching compressed Morse) to ESP32; preserved typed input during voice dictation (`initialText`).
- **Accessibility & Ergonomics**: Added `.skip-link`, consolidated into a single `<main>` landmark with WAI-ARIA `tablist`/`tab`/`tabpanel` + arrow-key navigation, restored `:focus-visible` rings on range sliders/inputs/selects, added `Space`/`Enter` keying on `#tapperKey`, `Ctrl/Cmd+Enter` IME-safe transmit, global `Esc` abort, keyboard oscilloscope pulse scrubbing, stacked accessible `#toastRegion` (`role="alert"`/`role="status"`), Manual Key `Backspace` + clickable `A–Z · 0–9` Morse reference chart, `localStorage` persistence of calibrated operator settings (`optix_wpm`, `optix_pitch`, `optix_repeat`, `optix_sound`), and `navigator.onLine` voice status.
- **Performance**: Replaced static `torchDigitalTwin.js` import with lazy dynamic `import()` (`-711 KB` initial startup savings), cached oscilloscope dimensions via `ResizeObserver` + hoisted pulse gradients (eliminating 60fps `getBoundingClientRect()` layout thrashing), and switched pulse scheduling to `performance.now()` drift-compensated monotonic timing.

### Added — System Documentation, Hardware Manual & Institutional Project Deliverables
- Created [Project_OPTIX_Report.docx](Project_OPTIX_Report.docx): Complete 20-page institutional project report structured with cover page, Table of Contents (Pages 1–16+), abstract, 7 concrete objectives, tools, 5-stage architecture pipeline, Table 1 system addressing/parameter specifications (18 rows), embedded FreeRTOS technologies, 9 implementation phases, Table 2 empirical test results (9 tests, 100% Pass), 11 high-resolution figures/captions, challenges & troubleshooting, and Phase 2 OPTIX-MK2 roadmap.
- Created [HARDWARE_SETUP.md](HARDWARE_SETUP.md): Comprehensive operational manual covering ESP32 & breadboard wiring (standard 5mm LED and IRLZ44N MOSFET high-power stage), power-on self-test (POST), Arduino IDE flashing, Windows Firewall rules, all 6 connection methods (Laptop SoftAP/USB, Mobile Full Console/Standalone 192.168.4.1, Shared Router STA, Virtual Sim), REST/Serial API references, and pre-demo verification checklist.
- Completed the 8-slide institutional project presentation deck ([OPTIX_Presentation.pptx](OPTIX_Presentation.pptx)) with OPTIX Abstract & KPIs, an editable native-vector Flow of Program pipeline diagram, Syllabus vs. Out-of-Syllabus technical breakdowns, live captured console outputs (`01. Transmit`, `03. Beacon`, `06. 3D Torch` X-Ray Digital Twin), and Phase 1 → Phase 2 (`OPTIX-MK2`) Conclusion roadmap, leaving student roster and guide fields blank for manual entry.
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
