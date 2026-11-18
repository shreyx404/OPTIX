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
| **3D Torch Digital Twin** | `js/torchDigitalTwin.js` | **Lazy-loaded** (`import('./torchDigitalTwin.js')` only when Tab `06. 3D Torch` opens) offline Three.js WebGL interactive model of the Phase 2 **OPTIX-MK2** torch with Assembled / X-Ray / Exploded views, 4 clickable hardware buttons, and live pulse sync. |

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
   - Lazy-loaded 3D Torch WebGL 10W optical beam (`torchDigitalTwin.setOpticalPulse(isOn)`).

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

## 6. Hardware Roadmap: Phase 1 vs Phase 2

| Dimension | Phase 1 (Live System Today) | Phase 2 (OPTIX-MK2 Digital Twin) |
| :--- | :--- | :--- |
| **Compute** | Host Browser + ESP32-WROOM-32 | Embedded Raspberry Pi CM5 (4GB RAM, 32GB eMMC) |
| **Voice & Compression** | Web Speech API + Rule-Based Semantic Engine | Offline `whisper.cpp` (Whisper-tiny) + Quantized LLM Compressor |
| **Optics** | 5mm LED (GPIO 2/4) or MOSFET Spotlight | 10W Cree XHP50 LED + CNC Heatsink + Parabolic Collimator |
| **Power & Enclosure** | USB 5V Power Bank + Breadboard / DevKit | 2S1P 18650 (25.9Wh) + USB-C PD BMS + IP65 3D-Printed Housing |
| **Network Dependency** | Local SoftAP (`192.168.4.1`) or USB Serial | 100% Autonomous Zero-Network Handheld Torch |
