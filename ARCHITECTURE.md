# System Architecture — OPTIX

This document details the runtime architecture, client ES module graph, optical timing state machine, hardware transport layers, and Phase 1 → Phase 2 hardware evolution of **OPTIX**.

---

## 1. End-to-End Topology

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ CLIENT CONSOLE (index.html + Vanilla ES Modules + Zero Build Step)         │
│                                                                            │
│  [Text / Tokens] ─┐                               ┌─> Optical Diode D1 UI  │
│  [Web Speech API] ├─> morseEngine.js ─> Timeline ─┼─> 3.3V TTL Canvas (x2) │
│  [Manual Paddle] ─┘   (ITU-R M.1677-1)            ├─> Camera Torch / Screen│
│                                                   ├─> audioSidetone.js     │
│                                                   ├─> torchDigitalTwin.js  │
│                                                   └─> esp32Service.js      │
└──────────────────────────────────────────────────────────────┬─────────────┘
                                                               │
                 ┌─────────────────────────────────────────────┼───────────────────────┐
                 │                                             │                       │
                 ▼                                             ▼                       ▼
     [Mode: simulation]                             [Mode: wifi (HTTP)]      [Mode: serial (USB)]
     Built-in local virtual                         Direct ESP32 SoftAP      Web Serial API
     ESP32 state machine                            (192.168.4.1:80) or      (115200 baud UART)
     (zero server needed)                           server.js CORS Proxy             │
                                                               │                     │
                                                               └──────────┬──────────┘
                                                                          ▼
                                                        ┌────────────────────────────────┐
                                                        │ ESP32-WROOM-32 (FreeRTOS C++)  │
                                                        │  · Wi-Fi SoftAP + HTTP Server  │
                                                        │  · Non-blocking optical task   │
                                                        │  · GPIO 2 (onboard) / GPIO 4   │
                                                        └─────────────────┬──────────────┘
                                                                          ▼
                                                        ┌────────────────────────────────┐
                                                        │ VISIBLE LIGHT EMITTER (LED)    │
                                                        └────────────────────────────────┘
```

---

## 2. Frontend ES Module Graph

All application logic ships as native browser ES modules (`type="module"`) with zero external bundler or CDN runtime dependencies (Three.js is self-hosted under `js/vendor/`).

| Module | Path | Responsibility |
| :--- | :--- | :--- |
| **App Coordinator** | `js/app.js` | Application state, DOM caching, WAI-ARIA tab switching, event bindings, preset rendering, live UTC clock, calibration footer, and cross-module state synchronization. |
| **Morse & Semantic Engine** | `js/morseEngine.js` | ITU-R M.1677-1 lookup/reverse tables, unsupported character detection, opt-in negation-safe semantic contraction, PARIS WPM unit math, and pulse timeline synthesis. |
| **Optical Transmitter** | `js/opticalTransmitter.js` | Drift-compensated `performance.now()` playback scheduler, multi-canvas light-mode 3.3V TTL oscilloscope renderer (mouse + keyboard scrub/seek), screen/fullscreen strobe controller, rear camera torch (`MediaStreamTrack` torch constraint), and pub/sub `stateListeners`. |
| **Acoustic Sidetone** | `js/audioSidetone.js` | Web Audio API harmonic CW oscillator (`300–1500 Hz`, default `750 Hz`) with click-free attack/release envelopes. |
| **Speech Handler** | `js/speechHandler.js` | Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) continuous dictation wrapper with online/offline status feedback. |
| **ESP32 Hardware Service** | `js/esp32Service.js` | Hardware abstraction across `simulation` (in-browser virtual ESP32), `wifi` (`GET /api/ping`, `GET /api/status`, `POST /api/transmit`, `POST /api/stop` with optional CORS relay proxy), and `serial` (Web Serial 115200 baud reader/writer), plus persisted `localStorage` config and UTC telemetry log emitter. |
| **3D Torch Digital Twin** | `js/torchDigitalTwin.js` | **Lazy-loaded** (`import('./torchDigitalTwin.js')` only when Tab `06. 3D Torch` opens) offline Three.js WebGL interactive model of the Phase 2 **OPTIX-MK2** torch with Assembled / X-Ray / Exploded (0–100%) views, 5 camera presets, raycast subsystem picking, 4 clickable hardware buttons, dynamic 3D OLED `CanvasTexture`, `GPIO 18` signal-wire pulse glow, and **Fullscreen Presentation Mode** with floating dock. |

---

## 3. Optical Playback & Synchronization Architecture

1. **Deterministic Timeline Compilation**: `generateOpticalTimeline(morse, unitMs)` compiles any encoded Morse string into an array of discrete segments:
   `{ state: boolean, durationMs: number, type: 'dot' | 'dash' | 'gap' | 'charGap' | 'wordGap', symbol?: '.' | '-' }`.
2. **Drift-Compensated Scheduling**: `OpticalTransmitter.stepTimeline()` schedules each transition relative to a monotonic cycle anchor (`_cycleAnchorTime + stepElapsedBeforeCurrent + durationMs`), preventing `setTimeout` drift over long bursts or infinite loops.
3. **Unified State Fan-Out**: Every optical transition invokes `setOpticalState(isOn, meta)`, simultaneously driving:
   - Tab `01. Transmit` **Optical Diode D1** aperture dial (`STATE: EMITTING`, footer current `180.0 mA`).
   - Tab `03. Beacon` emitter dial, live state indicator (`TX HIGH · DOT (1T)` / `DASH (3T)`), and voltage badge (`3.3V HIGH`).
   - Both synchronized oscilloscope canvases (`#waveformCanvas` and `#transmitWaveformCanvas`) via a single `requestAnimationFrame` loop.
   - Rear mobile camera flashlight (`applyConstraints({ advanced: [{ torch: active }] })`) when armed.
   - Fullscreen optical strobe overlay (`flash-amber` or `flash-on` unless in safe non-strobe mode).
   - Acoustic CW sidetone (`sidetone.startTone()` / `stopTone()`).
   - Lazy-loaded 3D Torch WebGL 10W optical beam (`torchDigitalTwin.setOpticalPulse(isOn)`), live `GPIO 18` signal wire glow, LED drive wire glow, and live 1.3" 3D OLED `CanvasTexture` telemetry.

---

## 4. Resilient Multimodal Fallback Chain

To guarantee field signaling reliability when external hardware is unreachable:

```text
1. Physical ESP32 (Wi-Fi HTTP REST or USB Web Serial)
       │ (on timeout / network error / disconnect)
       ▼
2. Automatic Fallback Notification + Telemetry Log Warning
       │
       ▼
3. Local Mobile Camera Torch (if armed) + Local Screen Optical Beacon + CW Sidetone
```

---

## 5. Local Development & Bridge Servers

- **`server.js` (Node.js)**:
  - Serves static workspace files over HTTP (`:3000`) and optional HTTPS (`:3443`, when `cert.pem` and `key.pem` exist, enabling Web Speech API microphone access on LAN mobile devices).
  - Provides `/proxy/esp32?url=...` CORS relay for mixed-content environments.
  - Exposes `/mock-esp32/api/*` endpoints for server-side hardware simulation testing.
- **`server.py` (Python 3)**:
  - Zero-dependency fallback HTTP server for environments without Node.js.

---

## 6. Hardware Roadmap: Phase 1 vs. Phase 2 (`OPTIX-MK2`)

| Dimension | Phase 1 (Benchtop Proof-of-Concept Today) | Phase 2 (`OPTIX-MK2` Self-Contained Torch — Future Scope) |
| :--- | :--- | :--- |
| **Compute** | Host Browser + ESP32-WROOM-32 | Embedded **Raspberry Pi Compute Module 5 (CM5, 4GB RAM, 32GB eMMC)** |
| **Voice & Compression** | Web Speech API + Rule-Based Semantic Engine | Offline `whisper.cpp` (Whisper-tiny STT) + Quantized LLM Compressor (`SmolLM2` / `Qwen2.5-0.5B`) |
| **Optics** | 5mm LED (GPIO 2/4) or MOSFET Spotlight | 10W Cree XHP50 LED + CNC Heatsink + Parabolic Reflector + Borosilicate Collimator (`1.5–3 km` night LOS) |
| **Operator UI** | Mobile/Desktop Web Console | 1.3" SH1106 I2C OLED + 4× IP67 Hardware Buttons (`PTT`, `TX`, `SOS`, `MODE`) + Piezo CW Sidetone |
| **Power & Charging** | USB 5V Power Bank + Breadboard / DevKit | 2S1P 18650 Li-Ion Pack (`7.4V 3500mAh / 25.9Wh`) + **18W USB-C PD** 2S Balance BMS & `5V/3A` Buck |
| **Enclosure** | Breadboard Benchtop Prototype | Custom 3D-Printed Modular CF-PETG / SLS PA12 Nylon Rugged Shell (IP65 target, `52 mm` barrel) |
| **Network Dependency** | Local SoftAP (`192.168.4.1`) or USB Serial | **100% Autonomous Zero-Network Handheld Torch** (Military, Hikers, SAR, Disaster Response) |

### 6.1 Compute Selection Rationale: Why Raspberry Pi CM5?

- **Why not Raspberry Pi Zero 2 W?** Its `512 MB` LPDDR2 RAM cannot reliably host both an offline Speech-to-Text engine (`whisper.cpp`) and a quantized AI semantic compression model concurrently without OOM thrashing.
- **Why not a standard Raspberry Pi 5?** At `85 × 56 mm` with stacked full-size USB/Ethernet/HDMI ports, it is too wide and bulky to integrate cleanly inside a rugged handheld flashlight barrel.
- **Why Raspberry Pi CM5 (`4GB RAM`, `32GB eMMC`, Quad Cortex-A76 @ `2.4 GHz`)?** Measuring only **`55 × 40 × 4.7 mm`**, the CM5 mounts onto a compact custom carrier PCB inside a `52 mm` barrel while delivering full desktop-class ARM inference for real-time offline `whisper.cpp` STT + quantized LLM semantic compression.

### 6.2 OPTIX-MK2 Subsystem Breakdown & Estimated Prototype BOM (`~$118 / ~₹9,800`)

| # | Subsystem | Part / Specification | Bus / Interface | Power / Thermal Profile | Est. Cost |
| :-: | :--- | :--- | :--- | :--- | :---: |
| 1 | **Compute Core** | Raspberry Pi CM5 (4GB RAM, 32GB eMMC) + Custom Carrier PCB | `GPIO 18`, `I2S`, `I2C`, `4× GPIO` | `5.0V / 3.0A` rail (Avg `2.5W`, AI Peak `5.5W`) | `~$55` |
| 2 | **Optical Emitter** | 10W Cree XHP50 LED Star + CNC Heatsink + Parabolic Reflector + AR Lens | High-side Constant Current (`1.5A–2.5A`) | Up to `10W` peak (`-50%` duty via semantic compression) | `~$16` |
| 3 | **MOSFET Driver** | IRLZ44N Logic-Level N-MOSFET + Constant-Current Buck Driver PCB | `GPIO 18` (`3.3V` Hardware PWM) | `92%` efficiency · microsecond optical edges | `~$6` |
| 4 | **Control Deck** | 1.3" SH1106 I2C OLED + 4× IP67 Tactile Switches + Piezo Sidetone | `I2C (GPIO 2/3)` + `GPIO 5/6/13/26` | `0.15W` OLED active (auto-dim night mode) | `~$11` |
| 5 | **Voice Front-End** | INMP441 Omnidirectional Digital I2S MEMS Mic + Wind-Guard Mesh | `I2S (GPIO 19/20/21)` 24-bit digital | `3.3V / 1.4mA` (`< 5mW`) · immune to PWM noise | `~$4` |
| 6 | **Energy Store** | 2S1P 18650 Li-Ion Pack (2× Samsung 35E, `7.4V 3500mAh / 25.9Wh`) | Nickel-welded 2S bus + NTC probe | `6–10 hrs` mixed field ops · `24+ hrs` SOS beacon | `~$12` |
| 7 | **Charging & BMS** | 18W USB-C PD 2S Balance Charger + `5V/3A` Synchronous Buck | Recessed external USB-C (`5V–15V PD`) | `0–80%` in ~`75 min` · overcurrent/temp cutoff | `~$8` |
| 8 | **Enclosure** | Custom 3D-Printed Split Clamshell + Finned Strike Bezel + Tailcap | Internal rails, O-ring grooves, lockout | Passive thermal finning (CF-PETG / PA12 Nylon) | `~$6` |
| — | **Total Assembly** | **OPTIX-MK2 Self-Contained Tactical Torch** | **Zero-Network Autonomous** | **Idle `1.8W` · Voice AI `5.5W` · Peak TX `12W`** | **`~$118` (`~₹9,800`)** |

### 6.3 3D Digital Twin & Fullscreen Presentation Architecture (`js/torchDigitalTwin.js`)

- **100% Offline WebGL**: Loads Three.js locally from `js/vendor/three.module.min.js` (zero CDN dependency, safe when connected to the offline ESP32 SoftAP).
- **Procedural CAD-Style Geometry**: Axial split clamshell (`±Y` separation on Explode), crenellated strike bezel (`+X`), knurled tailcap (`-X`), etched CM5 BCM2712 heatspreader, 18650 wrapped cells, recessed metallic USB-C port, color-coded `TubeGeometry` internal wiring harness, and live `256×128` OLED `CanvasTexture`.
- **Interactive Controls & Picking**: Custom damped spherical orbit/zoom controller, 5 camera presets (`3/4`, `Optics`, `Controls`, `RPi CM5`, `USB-C`), raycast selection of all 9 subsystems (prioritizing internal modules beneath the translucent shell in X-Ray mode), and clickable 3D hardware buttons with spring press animation.
- **Fullscreen Presentation Mode**: Expands `#torchStageShell` via the native browser Fullscreen API (`requestFullscreen()`) with an automatic CSS fixed-viewport fallback (`.is-fullscreen`), `Esc` exit handler, automatic WebGL `ResizeObserver` aspect-ratio rescaling, and a floating **Fullscreen Presentation Dock** keeping view modes, Explode slider, 4 hardware triggers, and live selected-part BOM callouts accessible without exiting fullscreen.
