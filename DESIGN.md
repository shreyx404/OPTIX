---
name: OPTIX Visual System
description: Quiet Minimal / Swiss Purism — Visible Light Communication & Morse Transmitter
colors:
  bg-base: "#f7f7f7"
  bg-surface: "#ffffff"
  bg-subtle: "#fafafa"
  bg-elevated: "#f1f1f1"
  bg-input: "#ffffff"
  border-subtle: "#e5e5e5"
  border-medium: "#d4d4d4"
  border-control: "#c7c7c7"
  border-strong: "#111111"
  text-primary: "#111111"
  text-secondary: "#454545"
  text-muted: "#666666"
  text-caption: "#737373"
  text-inverse: "#ffffff"
  accent-primary: "#111111"
  accent-primary-hover: "#262626"
  accent-primary-subtle: "rgba(17, 17, 17, 0.05)"
  accent-success: "#0d7a55"
  accent-success-subtle: "rgba(13, 122, 85, 0.08)"
  accent-warn: "#9a5b13"
  accent-danger: "#d92d20"
  accent-danger-fill: "#b91c1c"
  accent-danger-fill-hover: "#991b1b"
  accent-danger-subtle: "rgba(217, 45, 32, 0.08)"
  chamber-bg: "#0b0c0e"
  amber-strobe: "#d9941e"
typography:
  brand:
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.9375rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.22em"
    textTransform: "uppercase"
  payload-display:
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "2.85rem"
    fontWeight: 400
    lineHeight: 1.18
    letterSpacing: "0.14em"
  section-title:
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.9375rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.1em"
    textTransform: "uppercase"
  body:
    fontFamily: "'Public Sans', system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
  body-sm:
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
  body-md:
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  buffer-lg:
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: 1.3
  nav-tab:
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.04em"
  micro-label:
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.1em"
    textTransform: "uppercase"
rounded:
  none: "0px"
  xs: "2px"
  sm: "3px"
  md: "4px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent-primary}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.xs}"
    padding: "0 22px"
    boxShadow: "none"
  button-primary-hover:
    backgroundColor: "{colors.accent-primary-hover}"
  button-secondary:
    backgroundColor: "{colors.bg-surface}"
    borderColor: "{colors.border-medium}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xs}"
    padding: "0 22px"
  preset-chip:
    backgroundColor: "{colors.bg-surface}"
    borderColor: "{colors.border-subtle}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xs}"
    padding: "8px 12px"
---

# Design System

## Overview & Philosophy

**Quiet Minimal — Swiss Purism & Kenya Hara Inspired Optical Instrumentation.**

OPTIX translates Visible Light Communication (VLC) Morse transmission into a serene, laboratory-calibrated light-mode optical instrument. Architectural negative space, hairline 1px grid dividers, crisp pure-white optical surfaces on an alabaster gallery ground, and restrained monochromatic typography let the signal, emitter aperture, and hardware routing state command focus without visual noise.

### Core Principles

1. **Architectural Negative Space** — Generous alabaster ground (`#f7f7f7`) and single-pixel dividers (`#e5e5e5`) frame every module without heavy card chrome or drop shadows.
2. **Instrument Precision** — Monospace calibration markings (`JetBrains Mono`, `tabular-nums`), sharp `2px` architectural corners, and exact ITU-R M.1677-1 nomenclature echo Leica/Braun optical instruments.
3. **Functional Micro-Accents Only** — Color is strictly operational: emerald (`#0d7a55`) exclusively for live online links, optical laser red (`#d92d20`) exclusively for the `EMITTER` endpoint, active 650nm diode emission, playhead cursor, and `ABORT` danger state.
4. **WCAG AA/AAA Contrast Discipline** — Every text, label, rail marker, and control outline on alabaster (`#f7f7f7`) and white (`#ffffff`) meets strict WCAG AA/AAA readability standards.

## Colors

### Surfaces (Alabaster & Pure White)

- **Base Ground (`#f7f7f7`)**: Gallery alabaster canvas across the full shell, header, and calibration footer.
- **Surface (`#ffffff`)**: Pure white framed surfaces for the optical diode dial, symbol stream box, emergency token buttons, routing path bar, oscilloscope canvas, inputs, and telemetry terminal.
- **Subtle (`#fafafa`)** & **Elevated (`#f1f1f1`)**: Quiet tonal steps for table headers and hover fills.
- **Optical Chamber (`#0b0c0e`)**: Reserved strictly for the WebGL 3D Torch testbench viewport and the Fullscreen Optical Strobe overlay where physical luminance contrast is required.

### Ink & Hairline Borders

- **Primary Ink (`#111111`)**: High-contrast matte jet black for headlines, payload stream, primary buttons, checked checkboxes, and TTL waveform trace (17.6:1 on base, 18.8:1 on white).
- **Secondary Ink (`#454545`)**: Graphite ink for prose, checkboxes, and secondary readouts (8.9:1 on base).
- **Muted Ink (`#666666`)**: Calibrated metadata labels and inactive navigation items (5.3:1 on base, 5.7:1 on white).
- **Subtle Border (`#e5e5e5`)**: 1px horizontal and vertical architectural dividers, header/footer rules, and framed zone borders.
- **Medium Border (`#d4d4d4`)** & **Strong Border (`#111111`)**: Interactive control outlines and active focus/hover borders.

### Operational Accents

- **Primary Action (`#111111` / Hover `#262626`)**: Matte jet-black primary CTAs (`TRANSMIT VIA ESP32 ↵`), active checkboxes, and active segmented pills.
- **Link Online (`#0d7a55`)**: Technical emerald reserved exclusively for `● LINK ONLINE` and verified online status indicators.
- **Optical Emitter / Danger (`#d92d20` / Solid Fill `#b91c1c`)**: 650nm laser-diode red reserved for the `EMITTER` routing endpoint, active optical diode firing pulse, oscilloscope playhead, and armed `ABORT` / `SOS` controls.

## Typography

- **Primary Instrument Face**: `JetBrains Mono` (`300, 400, 500, 600, 700, 800`) with `font-variant-numeric: tabular-nums` for brand mark, numbered navigation, payload input, emergency tokens, dial markings, symbol stream, buttons, and calibration footer.
- **Supporting Prose Face**: `Public Sans` (`400, 500, 600, 700`) for longer technical descriptions, settings tables, and 3D Torch subsystem specifications.

## Layout & Navigation

- **Unified Header Bar (`60px`)**: Single sticky row on desktop with `OPTIX` wordmark + live `SYS.SIMULATED / HH:MM:SS UTC` telemetry on the left, inline numbered tabs (`01. Transmit` through `06. 3D Torch`) with active bottom ink underline in the center, and bordered `● ABORT` button on the right.
- **2-Column Architectural Split (`01. Transmit`)**: Centered within the viewport between header and calibration footer, divided by a full-height `1px solid #e5e5e5` vertical hairline:
  - **Left Column**: `PAYLOAD / TEXT STREAM` borderless large-scale input + `CLEAR` + voice dictation, square `Adaptive Compression (Huffman-Morse)` checkbox + `ITU-R M.1677-1`, crisp rectangular `STANDARD EMERGENCY TOKENS` (`SOS Distress`, `MED HELP Medical`, `FIRE EVAC Alert`, `NEED WATER Supply`, `ALL SAFE Ack`, +3 expandable), and `SIGNAL ROUTING PATH` with live `● LINK ONLINE` status.
  - **Right Column**: Centered `236px` circular **Optical Diode D1** aperture dial (`N 0° 00'`, `100mW`, `λ 650nm`, `F/1.4`, press-and-hold manual pulse + live transmission glow), `SYMBOL STREAM REPRESENTATION` stacked character breakdown (`S / O / S`) with inline telemetry (`27 units  2.16s  15 WPM`), collapsible live 3.3V TTL oscilloscope trace, and the `TRANSMIT VIA ESP32 ↵` + `LOOP BEACON` action bar.
- **Bottom Calibration Footer (`44px`)**: Displays `OPTIX v4.0.2 / ARCH: QUIET MINIMAL | DIODE CURRENT: 24.2 mA` (live 180.0 mA on high pulse) on the left and `SWISS / PURISM SPEC  KENYA HARA INSP.  <W> × <H> CALIBRATED` on the right.

## Mobile & Touch Adaptation (`<= 1120px`, `<= 960px`, `<= 640px`, `<= 390px`)

- **Safe-Area Awareness**: `env(safe-area-inset-top/bottom/left/right)` applied across the sticky header, workspace, sticky mobile action bar, toast stack, fullscreen beacon HUD, and calibration footer.
- **Sticky Thumb-Zone CTA Bar (`<= 640px`)**: `TRANSMIT VIA ESP32 ↵` and `LOOP BEACON` pin to the bottom viewport edge over frosted alabaster (`rgba(247, 247, 247, 0.96)`) so emergency transmission remains within one-thumb reach at all scroll positions.
- **Touch Ergonomics (`@media (pointer: coarse)`)**: Minimum `44px` height on all interactive buttons, tabs, token chips, checkboxes, and icon controls; `22px` range slider thumbs; `touch-action: manipulation` to remove double-tap delay; and `>= 1rem` (`16px`) font-size on all mobile inputs and selects to prevent iOS Safari focus auto-zoom.
- **Scrollable Header Tabs & Schematics**: Horizontal `scroll-snap` numbered navigation bar with right-edge fade cue (`<= 1120px`), compact `176px` optical diode dial (`<= 640px`), 2-column emergency tokens grid (1-column on `<= 390px`), horizontal-scroll signal routing schematic, and non-overlapping mobile 3D Torch HUD controls.

## Do's and Don'ts

- **DO** preserve generous alabaster whitespace and `1px solid #e5e5e5` architectural dividers.
- **DO** keep corners crisp (`2px`) and surfaces flat (zero drop shadows on layout blocks, zero neon glow on traces).
- **DO** use `tabular-nums` for clocks, diode current, WPM, unit counts, and durations.
- **DON'T** reintroduce dark backgrounds outside the 3D Torch optical chamber and Fullscreen Optical Strobe overlay.
- **DON'T** use emoji characters as UI icons or decorative gradients.
