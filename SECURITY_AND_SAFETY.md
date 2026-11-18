# Security & Optical Safety Guide — OPTIX

OPTIX drives high-contrast visual strobes, mobile camera flash LEDs, and external high-power ESP32 optical emitters. This document outlines the safety interlocks, accessibility compliance gates, and client/server security boundaries enforced by the system.

> **Related Documentation:** [README.md](README.md) · [Project_OPTIX_Report.docx](Project_OPTIX_Report.docx) · [Project_OPTIX_DCN_Report.docx](Project_OPTIX_DCN_Report.docx) · [HARDWARE_SETUP.md](HARDWARE_SETUP.md) · [OPTIX_Presentation.pptx](OPTIX_Presentation.pptx) · [ARCHITECTURE.md](ARCHITECTURE.md) · [PROTOCOL.md](PROTOCOL.md) · [PRODUCT.md](PRODUCT.md) · [DESIGN.md](DESIGN.md)

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
- **Phase 2 (`OPTIX-MK2`) Battery, Thermal & Mechanical Safeguards**:
  - **2S1P 18650 Balance & Protection**: The planned `7.4V` (`3500mAh / 25.9Wh`) pack requires a dedicated 2S balance-charging BMS with `18W` USB-C PD input protection, overcharge/over-discharge cutoff, overcurrent protection, and an NTC thermistor probe directly monitoring cell temperature.
  - **10W Thermal Path**: The Cree XHP50 star MCPCB bonds thermally to a CNC aluminum heatsink slug conducting heat into the finned front bezel; driver thermal sensing throttles steady-beam duty if internal enclosure temperature exceeds safe CF-PETG/PA12 thresholds.
  - **Physical Master Lockout**: A mechanical tailcap switch physically disconnects the battery bus during transport to prevent accidental 10W optical discharge or parasitic CM5 drain, paired with a recessed crimson guard bezel around `BTN 3 · SOS` to prevent inadvertent distress activation.

---

## 4. Client & Transport Security Boundaries

- **XSS-Safe Telemetry Rendering**: All ESP32 serial/HTTP telemetry log entries (`esp32Service.onLogMessage`), Morse character breakdown tokens, toast notifications, and error banners are constructed exclusively via `document.createElement` and `textContent` — never raw unescaped `innerHTML`. Semantic compression diff banners pass all dynamic strings through `escapeHtml()`.
- **Local TLS for Mobile Microphone Dictation**: Browsers restrict `SpeechRecognition` and `getUserMedia` (camera torch) to secure contexts (`https://` or `http://localhost`). `server.js` supports local self-signed HTTPS (`:3443` via `cert.pem`/`key.pem`). Private key files (`*.pem`, `*.key`, `*.crt`) are strictly excluded from version control via `.gitignore`.
- **Input Bounds & Port Clamping**: WPM (`5–40`), sidetone frequency (`300–1500 Hz`), and HTTP port (`1–65535`) are validated and clamped client-side before persistence or hardware dispatch.
- **Web Serial Lifecycle Safety**: `esp32Service.disconnectSerial()` explicitly cancels the locked `serialReader` and awaits `readableStreamClosed` before calling `serialPort.close()`, preventing Chrome `InvalidStateError` locks; a `navigator.serial` `disconnect` event listener automatically detects unexpected USB cable removal and resets link state.
- **Local-Only Bridge Scope**: `server.js` and its `/proxy/esp32` CORS relay are intended strictly for trusted local LAN / ESP32 SoftAP subnets (`192.168.4.x` / `localhost`) and must not be exposed directly to the public internet.

---

## 5. Accessibility, Keyboard Parity & Multi-Skill UI Audit Verification

Hardened and verified across `impeccable`, `ui-ux-pro-max`, `design-system`, `ui-styling`, and `brand` UI quality gates:

- **Landmarks & WAI-ARIA Structure**: Includes a keyboard `.skip-link` to `#mainWorkspace`, a single `<main>` landmark wrapping six `role="tabpanel"` views, `role="tablist"` / `role="tab"` navigation with `aria-selected` and roving `tabindex` (`ArrowLeft`/`ArrowRight`/`Home`/`End`), live `aria-valuenow` updates on `#transmissionProgress`, and `aria-pressed` on toggle controls.
- **Complete Keyboard Operability**:
  - `Ctrl+Enter` / `Cmd+Enter` (IME-safe) dispatches transmission from the payload stream.
  - `Esc` aborts active transmission globally or exits and stops Fullscreen Beacon / 3D Torch fullscreen.
  - `Space` / `Enter` keys the Manual Telegraph Paddle (`#tapperKey`, ignoring key auto-repeat) and tests the Optical Diode D1 aperture.
  - `ArrowLeft` / `ArrowRight` / `Home` / `End` inspect individual oscilloscope pulses and `Enter` / `Space` seeks playback; symbol breakdown tiles and the `A–Z · 0–9` reference chart are native `<button>` elements.
- **Screen-Reader Feedback & Contrast**: Stacked notifications mount inside `#toastRegion` using `role="alert"` (dismissible error alerts) and `role="status"` (confirmations) with selectable text; dynamic buffers and status badges declare `aria-live="polite"`; all operational surfaces maintain WCAG AA/AAA text contrast (`>= 4.5:1`), visible `:focus-visible` outlines across buttons, sliders, and inputs, and state-preserving `prefers-reduced-motion` handling.
