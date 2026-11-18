---
name: OPTIX Visual System
description: Warm Optical Instrument — Visible Light Communication & Morse Transmitter
colors:
  bg-base: "#08090c"
  bg-surface: "#0f1114"
  bg-elevated: "#16181d"
  bg-overlay: "#1e2028"
  bg-input: "#0b0c10"
  border-subtle: "rgba(255, 255, 255, 0.06)"
  border-medium: "rgba(255, 255, 255, 0.12)"
  border-focus: "rgba(230, 180, 80, 0.5)"
  text-primary: "#f0ece4"
  text-secondary: "#a8a29e"
  text-muted: "#78716c"
  accent-primary: "#e5a93b"
  accent-primary-subtle: "rgba(229, 169, 59, 0.10)"
  accent-primary-hover: "#f0bc52"
  accent-signal: "#d4c9a8"
  accent-signal-subtle: "rgba(212, 201, 168, 0.08)"
  accent-danger: "#d4453a"
  accent-danger-subtle: "rgba(212, 69, 58, 0.10)"
  accent-success: "#5cb85c"
  accent-success-subtle: "rgba(92, 184, 92, 0.08)"
typography:
  brand:
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "0.15em"
    textTransform: "uppercase"
  morse-hero:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.8
    letterSpacing: "0.15em"
  section-title:
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0"
  body:
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
  nav-tab:
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.3
  metric-label:
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.1em"
    textTransform: "uppercase"
  mono:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0"
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
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
    textColor: "{colors.bg-base}"
    rounded: "{rounded.sm}"
    padding: "9.6px 20px"
    boxShadow: "none"
  button-primary-hover:
    backgroundColor: "{colors.accent-primary-hover}"
  button-ghost:
    backgroundColor: "transparent"
    borderColor: "{colors.border-subtle}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
  preset-chip:
    backgroundColor: "transparent"
    borderColor: "{colors.border-subtle}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.full}"
    padding: "4.8px 10.4px"
---

# Design System

## Overview & Philosophy

**Strip the theater. Amplify the signal.**

OPTIX is a Visible Light Communication (VLC) Morse code transmitter engineered for real low-light field operation. Its aesthetic is grounded in authentic optical instrumentation — warm amber signal lamps, phosphor oscilloscopes, and dark anodized metal enclosures — rather than generic sci-fi dashboards.

### Core Principles

1. **Silence is louder than noise** — Remove redundant chrome, icon pods, and decorative labels so the active Morse signal commands full attention.
2. **Morse is the aesthetic** — High contrast, binary rhythm, and deliberate negative space echo dots, dashes, and inter-symbol gaps.
3. **Earned complexity** — The primary Transmit screen stays spare and focused; dense technical controls live only where needed in Hardware and Settings.
4. **Warmth in the dark** — Warm amber and parchment cream reduce ocular fatigue in dark environments and replace cold neon clichés.

## Colors

### Surfaces (Anodized Dark Neutrals)

- **Base Ground (`#08090c`)**: Deep warm-shifted obsidian canvas.
- **Surface (`#0f1114`)**: Subtle tonal step reserved for genuinely contained surfaces (terminal logs, buffers, reference tables).
- **Elevated (`#16181d`)**: Active states, tactile keys, and secondary controls.
- **Overlay (`#1e2028`)**: Popovers, hover highlights, and elevated overlays.
- **Input Ground (`#0b0c10`)**: Recessed text input and oscilloscope canvas background.

### Typography & Hairline Borders

- **Primary Text (`#f0ece4`)**: Warm cream/parchment white for crisp low-glare readability.
- **Secondary Text (`#a8a29e`)**: Warm stone gray for descriptions, inactive chips, and labels.
- **Muted Text (`#78716c`)**: Quiet metadata, inline separators, and placeholders.
- **Subtle Border (`rgba(255, 255, 255, 0.06)`)**: Quiet structural hairlines and dividers.
- **Medium Border (`rgba(255, 255, 255, 0.12)`)**: Interactive borders and form outlines.
- **Focus Border (`rgba(230, 180, 80, 0.5)`)**: Warm amber focus indicator.

### Signal & Functional Accents

- **Primary Amber (`#e5a93b`)** / **Hover (`#f0bc52`)**: Signal lamp accent for hero Morse output, active tab underline, primary CTA buttons, and oscilloscope waveform trace.
- **Phosphor Signal (`#d4c9a8`)**: Secondary warm phosphor tint for oscilloscope voltage rail markers and subtle instrumentation readouts.
- **Success (`#5cb85c`)**: Muted instrument green for verified online hardware links and positive confirmations.
- **Danger (`#d4453a`)**: Muted crimson for emergency `ABORT`, hardware faults, and the oscilloscope active playhead cursor.

## Typography

- **UI Interface**: `Inter` (`400, 500, 600, 700, 800`) — Engineered for high screen legibility across small controls and clean editorial structure.
- **Data, Morse & Telemetry**: `JetBrains Mono` (`400, 500, 600, 700`) with `font-variant-numeric: tabular-nums` for rock-solid alignment on live UTC clocks, WPM readouts, durations, and pulse buffers.

### Typographic Hierarchy

- **Brand Wordmark (`OPTIX`)**: `1.5rem`, Weight `800`, uppercase, `+0.15em` tracking — monumental standalone mark with no icon pod or version badge.
- **Morse Output Hero**: `1.75rem`, Weight `700`, `JetBrains Mono`, warm amber `#e5a93b`, `+0.15em` tracking, centered, line-height `1.8`.
- **Section Titles**: `0.8125rem`, Weight `600`, plain language (`Morse Output`, `Manual Key`, `Beacon & Waveform`, `ESP32 Connection`, `Timing & Audio`).
- **Body & Inputs**: `0.875rem`, Weight `400`, sentence case.
- **Metric Labels**: `0.625rem`, Weight `600`, uppercase, `+0.1em` tracking, modeled on instrument dial legends.

## Layout & Navigation

- **Single-Column Discipline**: Centered single-column workspace (`max-width: 720px`) across desktop, tablet, and mobile. Generous vertical rhythm replaces multi-column dashboard sprawl.
  - **Desktop (`1024px+`)**: `720px` centered column with generous vertical breathing room.
  - **Tablet (`768px–1023px`)**: Same `720px` single-column flow with tightened padding.
  - **Mobile (`< 768px`)**: Full-width with `0.75rem` horizontal padding and stacked action buttons.
- **Flattened Header**: Single-line top bar with a bottom hairline border and no enclosing card:
  - Left: Monumental `OPTIX` wordmark only.
  - Right: Minimal hardware status dot + concise state (`SIM`, `ONLINE`, `STANDBY`), plain monospaced UTC clock (`HH:MM:SS`), and prominent `ABORT` button.
- **Underline Navigation**: Five plain text tabs (`Transmit`, `Key`, `Beacon`, `Hardware`, `Settings`) over a `1px` hairline divider with a `2px` `#e5a93b` active bottom underline. No tab icons, no numbered badges, no segmented pill tray.
- **Borderless Hierarchy**: `.surface-panel` is transparent and borderless — sections separate via whitespace and subtle horizontal rules. `.surface-card` (`#0f1114` + `1px solid rgba(255, 255, 255, 0.06)`) is reserved strictly for genuinely contained artifacts such as the terminal console, buffer readouts, and reference table.

## Component Specifications

### Transmit Workspace
- **Textarea-First Entry**: Direct message textarea with `"Type your message..."` placeholder, inline toolbar with subtle icon-only voice dictation button, character counter, and inline Adaptive Compression toggle.
- **Hero Morse Output**: Borderless, centered warm-amber Morse sequence with a quiet copy icon and clickable inline character breakdown directly beneath.
- **Inline Telemetry Metrics**: Single centered monospaced line (`18 units · 1.44s · 15 WPM`) replacing multi-card metric grids.
- **Action Triggers**: Flat warm-amber primary button (`Send to ESP32`) and restrained secondary trigger (`Start Beacon`) with zero drop shadows.
- **Compact Preset Chips**: Neutral hairline pill chips (`SOS`, `HELP`, `MAYDAY`, etc.) showing monospace code and short label, with warm amber hover state and no noisy category color coding.

### Manual Key
- **Tactile Telegraph Paddle**: Large circular tap key with immediate optical/acoustic press feedback, paired with discrete mechanical buttons (`DOT`, `DASH`, `Letter Gap`, `Word Gap`) and streamlined Morse/decoded plaintext buffer rows.

### Optical Beacon & Waveform Oscilloscope
- **Optical Emitter Aperture**: Oversized `160px+` circular beacon bulb as the focal centerpiece of the Beacon view, plus Fullscreen Beacon toggle.
- **Oscilloscope Canvas (`opticalTransmitter.js`)**: Warm amber TTL `3.3V` pulse timeline rendered on `#0b0c10`:
  - Graticule grid: dashed `rgba(229, 169, 59, 0.06)`
  - Voltage rails: `HIGH 3.3V` (`rgba(212, 201, 168, 0.5)`) and `LOW 0V` (`rgba(240, 236, 228, 0.25)`)
  - Reference baseline: `rgba(240, 236, 228, 0.1)`
  - Standby message: `STANDBY — NO SIGNAL` (`rgba(240, 236, 228, 0.3)`)
  - Pulse fill gradients: active `rgba(240, 188, 82, 0.45) → rgba(229, 169, 59, 0.08)`; inactive `rgba(229, 169, 59, 0.22) → rgba(229, 169, 59, 0.03)`
  - Waveform stroke: `#e5a93b`, `2px` width, restrained glow (`rgba(229, 169, 59, 0.35)`, `4px` blur)
  - Active playhead: crisp `2px` `#d4453a` vertical cursor with `#f0ece4` marker dot on the `HIGH` rail
- **Hardware Toggles**: Clean inline switch rows for Camera Torch and Acoustic Sidetone without boxed card wrappers.

### Hardware Bridge & Settings
- **Hardware Pipeline**: Simplified signal flow (`CLIENT → BRIDGE → ESP32 → LED`), mode selector, IP/Port inputs, USB Serial trigger, and monospace terminal activity log.
- **Settings**: Borderless WPM and sidetone frequency sliders, repeat selector, and the ITU-R M.1677-1 timing ratio reference table.

## Do's and Don'ts

- **DO** separate sections with whitespace, typography scale, and subtle hairlines instead of wrapping every block in a bordered card.
- **DO** use `tabular-nums` for clocks, WPM, durations, and numeric telemetry.
- **DO** keep labels plain, concise, and operational (`Transmit`, `Send to ESP32`, `SIM`, `ONLINE`, `STANDBY`).
- **DO** maintain WCAG AA/AAA contrast on all cream-on-obsidian text and amber accents.
- **DON'T** reintroduce neon cyan (`#00f0ff`), neon emerald (`#00e599`), or hot magenta (`#ff0055`) glows or gradients.
- **DON'T** decorate tabs or panels with numbered step badges, icon pods, or sci-fi subtitles.
- **DON'T** use emoji characters as UI icons or elastic/bouncy easing functions; stick to clean exponential deceleration (`cubic-bezier(0.16, 1, 0.3, 1)`).
