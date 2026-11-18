# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vanilla HTML5, Modern CSS, ES Modules JavaScript, Web Audio API, Web Speech API, Web Serial API, FreeRTOS ESP32 C++ Firmware.

## Users

Field operators, emergency response personnel, search & rescue teams, and embedded systems engineers operating in RF-denied, infrastructure-compromised, or electronic-warfare environments where cellular, Wi-Fi, and satellite links are jammed or unavailable.

## Product Purpose

OPTIX provides a reliable, direct Visible Light Communication (VLC) telecommunications interface. It accepts voice dictation, typed plain text, or manual telegraph keying, computes semantic contractions to minimize optical beacon exposure, modulates the signal to standard ITU-R M.1677-1 Morse code, and drives optical emitters (ESP32 High-Power LEDs, mobile camera torches, and high-luminance screen beacons).

## Positioning

Adaptive Semantic Optical Telecommunications: Unlike conventional bulk optical modems, OPTIX incorporates an adaptive semantic tokenization engine that reduces optical burst duration by up to 50% without losing message intelligibility, cutting battery consumption and drastically minimizing optical interception risk.

## Operating Context

- **Environment**: Low-light emergency shelters, maritime optical signaling, tactical field stations, or embedded hardware engineering testbenches.
- **Hardware Integration**: ESP32 microcontrollers over Wi-Fi HTTP SoftAP (192.168.4.1) or USB Web Serial, driving high-intensity LEDs via GPIO 2 with microsecond FreeRTOS hardware timing.
- **Physical Affordances**: Screen luminescence beacon, high-speed camera torch strobe, and 750Hz harmonic CW acoustic sidetone.

## Capabilities and Constraints

- **Input Modalities**: Voice dictation (Web Speech API), raw text payload entry, tactical preset bank, and manual Morse telegraph paddle with automatic dot/dash duration detection.
- **Modulation & Timing**: ITU-R M.1677-1 Morse standard (1T dot, 3T dash, 1T intra-character space, 3T letter space, 7T word space), adjustable speed (5–40 WPM), adjustable audio sidetone frequency (300–1500 Hz).
- **Telemetry & Monitoring**: Live UTC mission clock, real-time TTL 3.3V logic pulse oscilloscope waveform, character/unit counters, optical burst duration estimator, and continuous hardware telemetry log.
- **Safety**: Dedicated high-priority emergency transmission abort.

## Brand Commitments

- **Name**: OPTIX (Adaptive Semantic Optical Telecommunications)
- **Tone**: Aerospace mission telemetry, tactical command precision, high-legibility telemetry displays, laboratory-grade instrumentation. No cartoonish gamification, no decorative clutter, zero emoji glyphs.

## Product Principles

1. **Mission-Critical Precision**: Every status, voltage rail, baud rate, and timing metric must be authentic, calibrated, and instantly legible at a glance.
2. **Frictionless Tactical Speed**: An operator under extreme stress must be able to arm, encode, and transmit critical emergency payloads in fewer than two taps.
3. **Zero Visual Noise**: Pure signal, zero aesthetic fluff. High contrast, dedicated elevation surfaces, and crisp telemetry typography.
4. **Resilient Multimodal Fallback**: Graceful automatic fallback from physical ESP32 to Web Serial, Camera Torch, Screen Beacon, and Virtual Simulation.
