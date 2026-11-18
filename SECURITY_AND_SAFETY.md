# Security & Optical Safety Guide — OPTIX

OPTIX drives high-contrast visual strobes, mobile camera flash LEDs, and external high-power ESP32 optical emitters. This document outlines the safety interlocks, accessibility compliance gates, and client/server security boundaries enforced by the system.

---

## 1. WCAG 2.3.1 Photosensitive Strobe Safety Gate

Standard Morse keying at `15 WPM` (`80 ms / dot`) flashes at up to **6.25 Hz**, which exceeds the **3 Hz** WCAG 2.3.1 photosensitive seizure threshold. OPTIX enforces a mandatory safety gate before any fullscreen screen strobe can fire:

1. **Explicit Flash-Rate Disclosure**: Opening Fullscreen Strobe calculates and displays the live maximum flash frequency (`Hz`) for the current WPM setting before arming.
2. **Reduced-Motion Protection**: When the OS reports `prefers-reduced-motion: reduce` and the flash rate exceeds `3.0 Hz`, OPTIX automatically defaults to **No Strobe (Safe)** mode (no fullscreen luminance flashing; text/Morse readout and audio remain active).
3. **Color Mode Selection**: Operators explicitly choose among **Night-Vision Amber** (`#d9941e`, default), **High-Luminance White** (`#ffffff`), or **No Strobe (Safe)**.
4. **Cancellable 2-Second Arming Countdown**: Arming requires an explicit confirmation followed by a 2-second countdown that can be aborted at any instant via `Cancel` or `Esc`.
5. **Focus Trap & Stop-on-Exit**: Keyboard focus is trapped inside the fullscreen dialog; exiting via backdrop tap, `Exit & Stop`, `Esc`, or browser fullscreen exit immediately halts screen strobing, camera torch, and CW audio sidetone so emitters never keep running invisibly.

---

## 2. High-Priority Emergency Abort

- **Global `Esc` Shortcut**: Pressing `Esc` anywhere outside the 3D Torch fullscreen mode immediately halts local optical playback, active arming countdowns, CW audio sidetone, and dispatches `POST /api/stop` (Wi-Fi) or `STOP\n` (USB Serial) to the ESP32.
- **Honest Failure Reporting**: If local emitters stop but the external ESP32 `/api/stop` request fails, OPTIX surfaces a persistent high-priority alert instructing the operator to verify the physical LED directly.
- **Manual Key Blur Safety**: If the browser tab or window loses focus while holding the telegraph paddle or optical diode aperture, `blur` and `lostpointercapture` handlers immediately release the key and force optical/audio output LOW to prevent stuck carriers.

---

## 3. Physical Optical & Electrical Safety

- **Current-Limiting Resistor Required**: Never wire a standard 5mm LED directly to ESP32 `GPIO 2` / `GPIO 4` without a `150Ω–330Ω` (`220Ω` recommended) series resistor.
- **High-Power LED / MOSFET Isolation**: High-power emitters (`1W–10W`) must be driven through a logic-level N-Channel MOSFET (`IRLZ44N`) with a shared ground and appropriate thermal heatsinking.
- **Ocular Precaution**: Avoid direct close-range eye exposure to collimated `1W–10W` LEDs or smartphone camera flash strobes during prolonged `∞ LOOP` tests.

---

## 4. Client & Transport Security Boundaries

- **XSS-Safe Telemetry Rendering**: All ESP32 serial/HTTP telemetry log entries (`esp32Service.onLogMessage`), Morse character breakdown tokens, toast notifications, and error banners are constructed exclusively via `document.createElement` and `textContent` — never raw unescaped `innerHTML`. Semantic compression diff banners pass all dynamic strings through `escapeHtml()`.
- **Local TLS for Mobile Microphone Dictation**: Browsers restrict `SpeechRecognition` and `getUserMedia` (camera torch) to secure contexts (`https://` or `http://localhost`). `server.js` supports local self-signed HTTPS (`:3443` via `cert.pem`/`key.pem`). Private key files (`*.pem`, `*.key`, `*.crt`) are strictly excluded from version control via `.gitignore`.
- **Input Bounds & Port Clamping**: WPM (`5–40`), sidetone frequency (`300–1500 Hz`), and HTTP port (`1–65535`) are validated and clamped client-side before persistence or hardware dispatch.
- **Local-Only Bridge Scope**: `server.js` and its `/proxy/esp32` CORS relay are intended strictly for trusted local LAN / ESP32 SoftAP subnets (`192.168.4.x` / `localhost`) and must not be exposed directly to the public internet.
