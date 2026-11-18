---
name: BIOTCP Visual System
description: Aerospace Optical Telemetry & Visible Light Communication Console
colors:
  bg-base: "#06090e"
  bg-surface: "#0c1018"
  bg-elevated: "#131924"
  bg-overlay: "#1a2232"
  bg-input: "#090d14"
  black: "#000000"
  border-subtle: "rgba(255, 255, 255, 0.08)"
  border-medium: "rgba(255, 255, 255, 0.14)"
  border-focus: "rgba(0, 229, 153, 0.5)"
  text-primary: "#f8fafc"
  text-secondary: "#cbd5e1"
  text-muted: "#8fa0b5"
  amber-banner-text: "#fed7aa"
  accent-emerald: "#00e599"
  accent-emerald-hover: "#10f0a5"
  accent-cyan: "#00b4d8"
  accent-amber: "#f59e0b"
  accent-danger: "#ef4444"
  toast-error-bg: "#1a1012"
  toast-success-bg: "#0a1713"
typography:
  display:
    fontFamily: "'Sora', system-ui, -apple-system, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "'Sora', system-ui, -apple-system, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  subheading:
    fontFamily: "'Sora', system-ui, -apple-system, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Sora', system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
  label:
    fontFamily: "'Sora', system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.02em"
  small:
    fontFamily: "'Sora', system-ui, -apple-system, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 500
    lineHeight: 1.3
  caption:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.02em"
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
  lg: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent-emerald}"
    textColor: "#05080d"
    rounded: "{rounded.md}"
    padding: "9px 18px"
  button-primary-hover:
    backgroundColor: "{colors.accent-emerald-hover}"
  button-ghost:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
---

# Design System

## Overview

BIOTCP is an aerospace-grade telecommunications and Visible Light Communication (VLC) operational console. It transforms natural language and manual keying into ITU-R M.1677-1 Morse code light pulses. The visual world is calibrated to the realities of a mission operator: pitch-black emergency shelters, field testbenches, and maritime night operations. Visual hierarchy is crystal clear, distraction-free, and grounded in authentic physical instrumentation rather than sci-fi decoration.

## Colors

- **Ground (Base Obsidian)**: `#06090e` — Deep tactical neutral ground providing maximum contrast for optical emitters.
- **Surface (Carbon Elevation 1)**: `#0c1018` — Foundation for primary panels and workspace cards.
- **Elevated (Carbon Elevation 2)**: `#131924` — Input areas, active tab panels, hover states.
- **Overlay (Carbon Elevation 3)**: `#1a2232` — Popovers, tooltips, modal dialogs.
- **Input Ground**: `#090d14` — High-contrast recessed input and terminal ground.
- **Signal Emerald (`#00e599`)**: Primary affirmative action, transmission in flight, online hardware state, and verified signal reception.
- **Telemetry Cyan (`#00b4d8`)**: Channel information, frequency metrics, and TTL logic rails.
- **Warning Amber (`#f59e0b`)**: Semantic compression indicators, buffer warnings, standby states.
- **Emergency Crimson (`#ef4444`)**: Emergency abort, hardware disconnect, critical errors.

## Typography

- **UI Headings & Labels**: `Sora` — Distinct geometric sans-serif engineered for digital displays with exceptional clarity, confident structure, and zero generic aesthetic tropes.
- **Data & Telemetry**: `JetBrains Mono` — Monospaced type with `font-variant-numeric: tabular-nums` for rock-solid stability during real-time millisecond countdowns, WPM counters, and hex dumps.
- **Hierarchy**:
  - Console Header: 1.25rem, Weight 700, -0.02em tracking.
  - Section Titles: 0.9375rem, Weight 600, -0.01em tracking.
  - Body & Instructions: 0.875rem, Weight 400, sentence case.
  - Technical Badges: 0.6875rem, Weight 600, JetBrains Mono, uppercase, +0.02em tracking.

## Layout

- **Viewport Utilization**: Expansive, calibrated multi-column grid across wide desktop monitors (1440px to 1920px+), gracefully collapsing to single-column stacking on mobile devices.
- **Cockpit Architecture**:
  1. Top Utility Header: System Telemetry status, live UTC Mission Clock, Hardware Link status, Emergency Abort.
  2. Segmented Navigation Bar: Dedicated 5-way switcher with custom SVG iconography and step badges.
  3. Active Workspace Area: Dedicated fluid grid tailored to each operational mode.
- **Rhythm & Spacing**: Strict 4px/8px modular spacing system. Generous separation between functional groups, tight internal component coupling.

## Elevation & Depth

- Elevation is expressed via subtle tonal steps and calibrated 1px precision hairline borders (`rgba(255, 255, 255, 0.08)`).
- Zero-offset neon halos and garish colored box shadows are strictly avoided. Depth is conveyed through subtle ambient occlusion (`box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.5)`).

## Shapes

- Corner Radii: Clean 8px for standard panels, 6px for interactive buttons/inputs, 4px for telemetry tags, 9999px for pill status badges and toggles.
- Tactile Buttons: Clear hover, active (:active transform), and keyboard focus rings with 2px offset.

## Components

- **Navigation Dock**: Segmented control with active indicator, crisp 16px SVG glyphs, and tab indicators.
- **Telemetry Pills**: High-density numeric cards with label-first hierarchy, tabular numerals, and metric units.
- **Morse Code Terminal**: High-contrast display window featuring formatted dot/dash sequences with symbol breakdown chips.
- **Tactile Telegraph Key**: Multi-ring concentric milled virtual paddle with tactile press feedback and visual luminescence.
- **Oscilloscope Logic Analyzer**: Canvas-rendered TTL 3.3V pulse train with graticule grid and real-time active playhead.
- **Hardware Pipeline Map**: End-to-end signal flow showing Client, Bridge, ESP32 RTOS, and Optical VLC LED.

## Do's and Don'ts

- **DO** use bespoke inline SVG icons with consistent 1.5px/1.75px stroke width.
- **DO** use `tabular-nums` for all dynamic numerical values to prevent layout shift.
- **DO** maintain strict WCAG AAA / AA contrast ratios (≥4.5:1 for body text, ≥3:1 for large text).
- **DON'T** use emoji characters as UI icons.
- **DON'T** apply gradient text or thick colored side-stripes to cards.
- **DON'T** use bouncy or elastic easing functions (`cubic-bezier(0.34, 1.56...)`); use clean exponential easing.
- **DON'T** animate layout properties like width or height directly; use transforms and opacity.
