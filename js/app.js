/**
 * OPTIX - Main Application Controller
 * Adaptive Semantic Morse-Based Optical Communication System
 */

import {
  textToMorse,
  morseToText,
  validateMorse,
  applySemanticCompression,
  calculateMorseUnits,
  wpmToUnitMs,
  unitMsToWpm,
  generateOpticalTimeline,
  SEMANTIC_PRESETS
} from './morseEngine.js';

import { sidetone } from './audioSidetone.js';
import { opticalTransmitter } from './opticalTransmitter.js';
import { speechHandler } from './speechHandler.js';
import { esp32Service } from './esp32Service.js';
import { torchDigitalTwin, TORCH_SUBSYSTEMS } from './torchDigitalTwin.js';

// DOM Element cache
const el = {};

// Application State
const state = {
  currentInputMode: 'text', // 'text' | 'voice' | 'manual'
  rawText: '',
  encodedText: 'SOS',
  morseOutput: '',
  compressionSavings: 0,
  wpm: 15,
  unitMs: 80,
  adaptiveSemanticEnabled: true,
  audioSidetoneEnabled: true,
  repeatCount: 1,
  manualTapper: {
    keyDownTime: 0,
    pauseTimer: null,
    currentLetterMorse: '',
    fullDecodedText: ''
  }
};

function initDOMElements() {
  el.tabBtns = document.querySelectorAll('.nav-tab');
  el.tabPanes = document.querySelectorAll('.tab-pane');

  // Input elements
  el.textInput = document.getElementById('textInput');
  el.micBtn = document.getElementById('micBtn');
  el.micStatus = document.getElementById('micStatus');
  el.clearInputBtn = document.getElementById('clearInputBtn');
  el.presetsContainer = document.getElementById('presetsContainer');
  el.adaptiveToggle = document.getElementById('adaptiveToggle');
  el.semanticInfo = document.getElementById('semanticInfo');

  // Manual Morse Key elements
  el.tapperKey = document.getElementById('tapperKey');
  el.dotBtn = document.getElementById('dotBtn');
  el.dashBtn = document.getElementById('dashBtn');
  el.spaceLetterBtn = document.getElementById('spaceLetterBtn');
  el.spaceWordBtn = document.getElementById('spaceWordBtn');
  el.clearManualBtn = document.getElementById('clearManualBtn');
  el.manualMorseBuffer = document.getElementById('manualMorseBuffer');
  el.manualDecodedText = document.getElementById('manualDecodedText');
  el.applyManualBtn = document.getElementById('applyManualBtn');

  // Output & Metrics
  el.morseDisplay = document.getElementById('morseDisplay');
  el.breakdownContainer = document.getElementById('breakdownContainer');
  el.statUnits = document.getElementById('statUnits');
  el.statDuration = document.getElementById('statDuration');
  el.statChars = document.getElementById('statChars');
  el.statWpm = document.getElementById('statWpm');
  el.copyMorseBtn = document.getElementById('copyMorseBtn');

  // Transmission Controls
  el.transmitEsp32Btn = document.getElementById('transmitEsp32Btn');
  el.playBeaconBtn = document.getElementById('playBeaconBtn');
  el.stopTransmissionBtn = document.getElementById('stopTransmissionBtn');
  el.transmissionProgress = document.getElementById('transmissionProgress');
  el.progressBar = document.getElementById('progressBar');
  el.progressLabel = document.getElementById('progressLabel');

  // Beacon & Waveform
  el.beaconBulb = document.getElementById('beaconBulb');
  el.waveformCanvas = document.getElementById('waveformCanvas');
  el.fullscreenBeacon = document.getElementById('fullscreenBeacon');
  el.fullscreenToggle = document.getElementById('fullscreenToggle');
  el.torchToggle = document.getElementById('torchToggle');
  el.soundToggle = document.getElementById('soundToggle');
  el.beaconTransmitBtn = document.getElementById('beaconTransmitBtn');
  el.beaconQuickInput = document.getElementById('beaconQuickInput');
  el.beaconPayloadTag = document.getElementById('beaconPayloadTag');
  el.beaconSosBtn = document.getElementById('beaconSosBtn');
  el.beaconEsp32Btn = document.getElementById('beaconEsp32Btn');
  el.beaconMorseReadout = document.getElementById('beaconMorseReadout');
  el.beaconStateDot = document.getElementById('beaconStateDot');
  el.beaconStateLabel = document.getElementById('beaconStateLabel');
  el.beaconCycleBadge = document.getElementById('beaconCycleBadge');
  el.beaconTelemSpeed = document.getElementById('beaconTelemSpeed');
  el.beaconTelemElapsed = document.getElementById('beaconTelemElapsed');
  el.beaconTelemDuty = document.getElementById('beaconTelemDuty');
  el.beaconTelemPulses = document.getElementById('beaconTelemPulses');
  el.waveformVoltageBadge = document.getElementById('waveformVoltageBadge');
  el.beaconProgressPct = document.getElementById('beaconProgressPct');
  el.beaconProgressBar = document.getElementById('beaconProgressBar');
  el.beaconWpmSlider = document.getElementById('beaconWpmSlider');
  el.beaconWpmVal = document.getElementById('beaconWpmVal');
  el.beaconRepeatBtns = document.querySelectorAll('.beacon-repeat-btn');
  el.torchSubLabel = document.getElementById('torchSubLabel');
  el.soundSubLabel = document.getElementById('soundSubLabel');
  el.fsBeaconPayload = document.getElementById('fsBeaconPayload');
  el.fsBeaconMorse = document.getElementById('fsBeaconMorse');
  el.fsBeaconControls = document.getElementById('fsBeaconControls');
  el.fsBeaconPlayBtn = document.getElementById('fsBeaconPlayBtn');
  el.fsBeaconLoopBtn = document.getElementById('fsBeaconLoopBtn');
  el.fsBeaconExitBtn = document.getElementById('fsBeaconExitBtn');

  // Settings
  el.wpmSlider = document.getElementById('wpmSlider');
  el.wpmValue = document.getElementById('wpmValue');
  el.unitMsDisplay = document.getElementById('unitMsDisplay');
  el.pitchSlider = document.getElementById('pitchSlider');
  el.pitchValue = document.getElementById('pitchValue');
  el.repeatSelect = document.getElementById('repeatSelect');

  // Hardware panel
  el.hardwareModeSelect = document.getElementById('hardwareModeSelect');
  el.esp32IpInput = document.getElementById('esp32IpInput');
  el.esp32PortInput = document.getElementById('esp32PortInput');
  el.useProxyCheck = document.getElementById('useProxyCheck');
  el.pingEsp32Btn = document.getElementById('pingEsp32Btn');
  el.connectSerialBtn = document.getElementById('connectSerialBtn');
  el.hardwareStatusBadge = document.getElementById('hardwareStatusBadge');
  el.hardwareStatusText = document.getElementById('hardwareStatusText');
  el.activityLog = document.getElementById('activityLog');
  el.clearLogBtn = document.getElementById('clearLogBtn');

  // Enhanced HUD Elements
  el.missionClockDisplay = document.getElementById('missionClockDisplay');
  el.charCounter = document.getElementById('charCounter');

  // 3D Torch Digital Twin Elements
  el.torchStageShell = document.getElementById('torchStageShell');
  el.torchViewport = document.getElementById('torchViewport');
  el.torchTransmitBtn = document.getElementById('torchTransmitBtn');
  el.torchFullscreenBtn = document.getElementById('torchFullscreenBtn');
  el.torchHudFullscreenBtn = document.getElementById('torchHudFullscreenBtn');
  el.torchFsExitBtn = document.getElementById('torchFsExitBtn');
  el.torchHudMode = document.getElementById('torchHudMode');
  el.torchSyncDot = document.getElementById('torchSyncDot');
  el.torchSyncStatus = document.getElementById('torchSyncStatus');
  el.torchCamBtns = document.querySelectorAll('.torch-cam-btn[data-cam]');
  el.torchModeBtns = document.querySelectorAll('.torch-mode-btn');
  el.torchExplodeSlider = document.getElementById('torchExplodeSlider');
  el.torchExplodeVal = document.getElementById('torchExplodeVal');
  el.fsExplodeSlider = document.getElementById('fsExplodeSlider');
  el.fsExplodeVal = document.getElementById('fsExplodeVal');
  el.torchAutoRotateCheck = document.getElementById('torchAutoRotateCheck');
  el.torchHwBtns = document.querySelectorAll('[data-hw-btn]');
  el.torchModeBtnDesc = document.getElementById('torchModeBtnDesc');
  el.fsModeBtn = document.getElementById('fsModeBtn');
  el.torchPartChips = document.querySelectorAll('.torch-part-chip');
  el.inspectorCategory = document.getElementById('inspectorCategory');
  el.inspectorTitle = document.getElementById('inspectorTitle');
  el.inspectorCost = document.getElementById('inspectorCost');
  el.inspectorSummary = document.getElementById('inspectorSummary');
  el.inspectorModel = document.getElementById('inspectorModel');
  el.inspectorInterface = document.getElementById('inspectorInterface');
  el.inspectorPower = document.getElementById('inspectorPower');
  el.fsPartCategory = document.getElementById('fsPartCategory');
  el.fsPartTitle = document.getElementById('fsPartTitle');
  el.fsPartCost = document.getElementById('fsPartCost');
  el.fsPartSpec = document.getElementById('fsPartSpec');

  // Initialize Optical Transmitter with DOM elements + interactive waveform seek
  opticalTransmitter.init({
    beaconEl: el.beaconBulb,
    canvasEl: el.waveformCanvas,
    fullscreenBeaconEl: el.fullscreenBeacon,
    onSeek: (pulseIdx) => {
      if (!state.morseOutput) return;
      startLocalOpticalPlayback({ stayOnCurrentTab: true, startIndex: pulseIdx });
    }
  });

  // Live Optical Sync: mirror every Morse dot/dash pulse onto the Beacon HUD & 3D Torch Twin
  opticalTransmitter.addStateListener((isOn, meta = null) => {
    // 1. Update Beacon Tab Live Telemetry HUD
    if (el.beaconStateDot) {
      el.beaconStateDot.classList.toggle('lit', isOn);
      el.beaconStateDot.classList.toggle('tx-idle', !isOn && opticalTransmitter.isPlaying);
    }

    if (el.beaconStateLabel) {
      el.beaconStateLabel.classList.toggle('lit', isOn);
      if (meta && meta.manual && isOn) {
        el.beaconStateLabel.textContent = 'MANUAL TEST · 3.3V HIGH';
      } else if (isOn) {
        const pulseName = meta && meta.type === 'dash' ? 'DASH (3T)' : 'DOT (1T)';
        el.beaconStateLabel.textContent = `TX HIGH · ${pulseName}`;
      } else if (meta && meta.type === 'cycleGap') {
        el.beaconStateLabel.textContent = 'INTER-CYCLE PAUSE · 0.0V';
      } else if (opticalTransmitter.isPlaying) {
        const gapMap = { wordGap: 'WORD GAP (7T)', charGap: 'CHAR GAP (3T)', gap: 'GAP (1T)' };
        const gapName = (meta && gapMap[meta.type]) || 'GAP';
        el.beaconStateLabel.textContent = `TX LOW · ${gapName}`;
      } else {
        el.beaconStateLabel.textContent = 'STANDBY · 0.0V';
      }
    }

    if (el.waveformVoltageBadge) {
      el.waveformVoltageBadge.classList.toggle('high', isOn);
      el.waveformVoltageBadge.textContent = isOn ? '3.3V HIGH' : '0.0V LOW';
    }

    if (el.beaconCycleBadge && meta && meta.cycle) {
      if (meta.repeatCount >= 999) {
        el.beaconCycleBadge.textContent = `LOOP #${meta.cycle}`;
      } else if (meta.repeatCount > 1) {
        el.beaconCycleBadge.textContent = `CYCLE ${meta.cycle} / ${meta.repeatCount}`;
      } else {
        el.beaconCycleBadge.textContent = 'TX ACTIVE · 1x';
      }
    } else if (el.beaconCycleBadge && !opticalTransmitter.isPlaying) {
      el.beaconCycleBadge.textContent = formatRepeatLabel(state.repeatCount);
    }

    // 2. Mirror onto 3D Torch Twin
    torchDigitalTwin.setOpticalPulse(isOn);
    if (el.torchSyncDot) {
      el.torchSyncDot.classList.toggle('lit', isOn || torchDigitalTwin.steadyBeamOn);
    }
    if (el.torchSyncStatus) {
      if (isOn) {
        el.torchSyncStatus.textContent = `TX HIGH · GPIO 18 · ${state.encodedText || 'MORSE'}`;
      } else if (torchDigitalTwin.steadyBeamOn) {
        el.torchSyncStatus.textContent = 'STEADY BEAM · 10W LED ON';
      } else if (opticalTransmitter.isPlaying) {
        el.torchSyncStatus.textContent = `TX LOW · GAP · ${state.wpm} WPM`;
      } else {
        el.torchSyncStatus.textContent = 'STANDBY · LIVE SYNC READY';
      }
    }
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function initEventListeners() {
  // Navigation Tabs
  el.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabTarget = btn.getAttribute('data-tab');
      switchTab(tabTarget);
    });
  });

  // Text Input
  if (el.textInput) {
    el.textInput.addEventListener('input', () => {
      handleTextInputChange(el.textInput.value);
    });
  }

  if (el.clearInputBtn) {
    el.clearInputBtn.addEventListener('click', () => {
      if (el.textInput) {
        el.textInput.value = '';
        el.textInput.focus();
      }
      handleTextInputChange('');
    });
  }

  // Voice Input
  if (el.micBtn) {
    el.micBtn.addEventListener('click', toggleVoiceRecognition);
  }

  // Adaptive Semantic Toggle
  if (el.adaptiveToggle) {
    el.adaptiveToggle.addEventListener('change', (e) => {
      state.adaptiveSemanticEnabled = e.target.checked;
      handleTextInputChange(el.textInput ? el.textInput.value : state.rawText);
    });
  }

  // Sliders (synced across Settings & Beacon Console)
  if (el.wpmSlider) {
    el.wpmSlider.addEventListener('input', (e) => {
      setWpm(parseInt(e.target.value, 10));
    });
  }

  if (el.pitchSlider) {
    el.pitchSlider.addEventListener('input', (e) => {
      const pitch = parseInt(e.target.value, 10);
      sidetone.setFrequency(pitch);
      if (el.pitchValue) el.pitchValue.textContent = `${pitch} Hz`;
      if (el.soundSubLabel) el.soundSubLabel.textContent = `CW audio tone · ${pitch} Hz`;
    });
  }

  if (el.soundToggle) {
    el.soundToggle.addEventListener('change', (e) => {
      state.audioSidetoneEnabled = e.target.checked;
      sidetone.setEnabled(e.target.checked);
      opticalTransmitter.setLiveOptions({ enableSound: e.target.checked });
    });
  }

  if (el.repeatSelect) {
    el.repeatSelect.addEventListener('change', (e) => {
      setRepeatCount(parseInt(e.target.value, 10));
    });
  }

  // Copy Morse
  if (el.copyMorseBtn) {
    el.copyMorseBtn.addEventListener('click', async () => {
      if (!state.morseOutput) return;
      try {
        await navigator.clipboard.writeText(state.morseOutput);
        showToast('Morse sequence copied to clipboard!');
      } catch (e) {
        showToast('Copied: ' + state.morseOutput);
      }
    });
  }

  // Play Beacon locally on screen/torch (from Transmit tab)
  if (el.playBeaconBtn) {
    el.playBeaconBtn.addEventListener('click', () => startLocalOpticalPlayback());
  }

  // Transmit to ESP32 Hardware
  if (el.transmitEsp32Btn) {
    el.transmitEsp32Btn.addEventListener('click', startHardwareTransmission);
  }

  // Stop button
  if (el.stopTransmissionBtn) {
    el.stopTransmissionBtn.addEventListener('click', stopAllTransmission);
  }

  // Torch & Fullscreen
  if (el.torchToggle) {
    el.torchToggle.addEventListener('change', async (e) => {
      if (e.target.checked) {
        const ok = await opticalTransmitter.initTorch();
        if (!ok) {
          e.target.checked = false;
          if (el.torchSubLabel) el.torchSubLabel.textContent = 'Unavailable on this device/browser';
          showToast('Camera flash torch not supported on this device/browser', true);
        } else {
          opticalTransmitter.setLiveOptions({ enableTorch: true });
          if (el.torchSubLabel) el.torchSubLabel.textContent = 'Armed · Rear LED ready';
          showToast('Camera torch armed for optical transmission');
        }
      } else {
        opticalTransmitter.setLiveOptions({ enableTorch: false });
        await opticalTransmitter.releaseTorch();
        if (el.torchSubLabel) el.torchSubLabel.textContent = 'Physical LED strobe (mobile rear flash)';
      }
    });
  }

  if (el.fullscreenToggle) {
    el.fullscreenToggle.addEventListener('click', toggleFullscreenBeacon);
  }
  if (el.fullscreenBeacon) {
    el.fullscreenBeacon.addEventListener('click', (e) => {
      if (e.target === el.fullscreenBeacon) {
        exitFullscreenBeacon();
      }
    });
  }

  // Hardware configuration
  if (el.hardwareModeSelect) {
    el.hardwareModeSelect.addEventListener('change', (e) => {
      esp32Service.mode = e.target.value;
      esp32Service.saveConfig();
      updateHardwareUI();
      esp32Service.log(`Mode switched to: ${e.target.value.toUpperCase()}`);
    });
  }

  if (el.esp32IpInput) {
    el.esp32IpInput.addEventListener('change', (e) => {
      esp32Service.targetIp = e.target.value.trim();
      esp32Service.saveConfig();
    });
  }

  if (el.esp32PortInput) {
    el.esp32PortInput.addEventListener('change', (e) => {
      esp32Service.targetPort = parseInt(e.target.value, 10) || 80;
      esp32Service.saveConfig();
    });
  }

  if (el.useProxyCheck) {
    el.useProxyCheck.addEventListener('change', (e) => {
      esp32Service.useProxy = e.target.checked;
      esp32Service.saveConfig();
    });
  }

  if (el.pingEsp32Btn) {
    el.pingEsp32Btn.addEventListener('click', async () => {
      el.pingEsp32Btn.disabled = true;
      if (el.hardwareStatusText) el.hardwareStatusText.textContent = 'PING...';
      try {
        await esp32Service.ping();
        showToast('ESP32 Heartbeat ACK Received!');
      } catch (err) {
        showToast(`ESP32 Unreachable: ${err.message}`, true);
      } finally {
        el.pingEsp32Btn.disabled = false;
        updateHardwareUI();
      }
    });
  }

  if (el.connectSerialBtn) {
    el.connectSerialBtn.addEventListener('click', async () => {
      if (esp32Service.serialPort) {
        await esp32Service.disconnectSerial();
        el.connectSerialBtn.textContent = 'Connect USB Serial';
      } else {
        try {
          await esp32Service.connectSerial();
          el.connectSerialBtn.textContent = 'Disconnect USB';
          showToast('USB Serial connected to ESP32!');
        } catch (err) {
          showToast(`Serial error: ${err.message}`, true);
        }
      }
    });
  }

  if (el.clearLogBtn) {
    el.clearLogBtn.addEventListener('click', () => {
      if (el.activityLog) el.activityLog.innerHTML = '';
    });
  }

  // Manual Tapper Key Handlers
  initManualTapper();
  initBeaconConsoleControls();
  initTorchDigitalTwinControls();
  renderPresets();
}

/**
 * Shared Timing / Repeat Sync & Beacon Console Controls
 */
function formatRepeatLabel(count) {
  if (count >= 999) return '∞ LOOP';
  return `${count}x BURST`;
}

function setWpm(wpm) {
  const safeWpm = Math.max(5, Math.min(40, Number(wpm) || 15));
  state.wpm = safeWpm;
  state.unitMs = wpmToUnitMs(safeWpm);

  if (el.wpmSlider) el.wpmSlider.value = String(safeWpm);
  if (el.wpmValue) el.wpmValue.textContent = `${safeWpm} WPM`;
  if (el.unitMsDisplay) el.unitMsDisplay.textContent = `${state.unitMs} ms / dot`;

  if (el.beaconWpmSlider) el.beaconWpmSlider.value = String(safeWpm);
  if (el.beaconWpmVal) el.beaconWpmVal.textContent = `${safeWpm} WPM`;

  updateCalculationsAndWaveform();
}

function setRepeatCount(count) {
  const safeCount = Number(count) || 1;
  state.repeatCount = safeCount;

  if (el.repeatSelect) {
    el.repeatSelect.value = String(safeCount);
  }

  if (el.beaconRepeatBtns) {
    el.beaconRepeatBtns.forEach((btn) => {
      const btnVal = parseInt(btn.getAttribute('data-repeat'), 10);
      btn.classList.toggle('active', btnVal === safeCount);
    });
  }

  if (el.beaconCycleBadge && !opticalTransmitter.isPlaying) {
    el.beaconCycleBadge.textContent = formatRepeatLabel(safeCount);
  }

  if (el.fsBeaconLoopBtn) {
    const isLoop = safeCount >= 999;
    el.fsBeaconLoopBtn.textContent = isLoop ? 'Loop: ON' : 'Loop: OFF';
    el.fsBeaconLoopBtn.classList.toggle('active', isLoop);
  }

  // Allow live update of repeat count even during active playback
  if (opticalTransmitter.isPlaying) {
    opticalTransmitter.repeatCount = safeCount;
  }
}

function initBeaconConsoleControls() {
  // Primary Transmit / Stop toggle button directly in Beacon tab
  if (el.beaconTransmitBtn) {
    el.beaconTransmitBtn.addEventListener('click', () => {
      if (opticalTransmitter.isPlaying) {
        stopAllTransmission();
      } else {
        startLocalOpticalPlayback({ stayOnCurrentTab: true });
      }
    });
  }

  // Inline Payload Input (1:1 synced with Transmit tab)
  if (el.beaconQuickInput) {
    el.beaconQuickInput.addEventListener('input', (e) => {
      if (el.textInput) el.textInput.value = e.target.value;
      handleTextInputChange(e.target.value, 'beacon');
    });

    el.beaconQuickInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        startLocalOpticalPlayback({ stayOnCurrentTab: true });
      }
    });
  }

  // Instant SOS Strobe Button
  if (el.beaconSosBtn) {
    el.beaconSosBtn.addEventListener('click', () => {
      if (el.textInput) el.textInput.value = 'SOS';
      if (el.beaconQuickInput) el.beaconQuickInput.value = 'SOS';
      handleTextInputChange('SOS');
      startLocalOpticalPlayback({ stayOnCurrentTab: true });
      showToast('Emergency SOS optical beacon active');
    });
  }

  // Dispatch directly to ESP32 from Beacon tab
  if (el.beaconEsp32Btn) {
    el.beaconEsp32Btn.addEventListener('click', () => {
      startHardwareTransmission();
    });
  }

  // Quick WPM Speed Slider on Beacon tab
  if (el.beaconWpmSlider) {
    el.beaconWpmSlider.addEventListener('input', (e) => {
      setWpm(parseInt(e.target.value, 10));
    });
  }

  // Repeat / Loop Pills on Beacon tab
  if (el.beaconRepeatBtns) {
    el.beaconRepeatBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.getAttribute('data-repeat'), 10);
        setRepeatCount(val);
      });
    });
  }

  // Interactive Optical Emitter Bulb — press & hold for manual test flash
  if (el.beaconBulb) {
    let manualHolding = false;

    const startManualFlash = (e) => {
      if (e.type === 'keydown' && e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault();
      if (manualHolding) return;
      manualHolding = true;
      opticalTransmitter.setManualPulse(true, {
        enableTorch: Boolean(el.torchToggle && el.torchToggle.checked),
        enableSound: state.audioSidetoneEnabled
      });
    };

    const endManualFlash = () => {
      if (!manualHolding) return;
      manualHolding = false;
      opticalTransmitter.setManualPulse(false);
    };

    el.beaconBulb.addEventListener('mousedown', startManualFlash);
    el.beaconBulb.addEventListener('mouseup', endManualFlash);
    el.beaconBulb.addEventListener('mouseleave', endManualFlash);
    el.beaconBulb.addEventListener('touchstart', startManualFlash, { passive: false });
    el.beaconBulb.addEventListener('touchend', endManualFlash);
    el.beaconBulb.addEventListener('touchcancel', endManualFlash);
    el.beaconBulb.addEventListener('keydown', startManualFlash);
    el.beaconBulb.addEventListener('keyup', endManualFlash);
    el.beaconBulb.addEventListener('blur', endManualFlash);
  }

  // Fullscreen Optical Strobe HUD Controls
  if (el.fsBeaconControls) {
    el.fsBeaconControls.addEventListener('click', (e) => e.stopPropagation());
  }

  if (el.fsBeaconPlayBtn) {
    el.fsBeaconPlayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (opticalTransmitter.isPlaying) {
        stopAllTransmission();
      } else {
        startLocalOpticalPlayback({ stayOnCurrentTab: true, forceFullscreenFlash: true });
      }
    });
  }

  if (el.fsBeaconLoopBtn) {
    el.fsBeaconLoopBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const next = state.repeatCount >= 999 ? 1 : 999;
      setRepeatCount(next);
      showToast(next >= 999 ? 'Infinite optical loop enabled' : 'Single burst mode enabled');
    });
  }

  if (el.fsBeaconExitBtn) {
    el.fsBeaconExitBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      exitFullscreenBeacon();
    });
  }

  // ESC key closes fullscreen strobe cleanly
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && el.fullscreenBeacon && el.fullscreenBeacon.classList.contains('active')) {
      exitFullscreenBeacon();
    }
  });

  // Sync overlay if native fullscreen exited via browser controls
  document.addEventListener('fullscreenchange', () => {
    if (
      el.fullscreenBeacon &&
      el.fullscreenBeacon.classList.contains('active') &&
      !document.fullscreenElement
    ) {
      el.fullscreenBeacon.classList.remove('active', 'active-screen', 'flash-on');
      opticalTransmitter.setFullscreenFlash(false);
    }
  });
}

/**
 * 3D Torch Digital Twin Controller & Live Sync
 */
function ensureTorchTwinInitialized() {
  if (torchDigitalTwin.initialized || !el.torchViewport) return;

  torchDigitalTwin.onExplodeSliderSync = (pct) => {
    if (el.torchExplodeSlider) el.torchExplodeSlider.value = String(pct);
    if (el.torchExplodeVal) el.torchExplodeVal.textContent = `${pct}%`;
    if (el.fsExplodeSlider) el.fsExplodeSlider.value = String(pct);
    if (el.fsExplodeVal) el.fsExplodeVal.textContent = `${pct}%`;
  };

  torchDigitalTwin.init(el.torchViewport, {
    onPartSelected: (subsystem) => {
      renderTorchInspector(subsystem);
    },
    onTorchButtonAction: (btnId) => {
      handleTorchHardwareButton(btnId);
    }
  });

  syncTorchTelemetry();
}

function isTorchFullscreen() {
  return Boolean(
    el.torchStageShell &&
    (document.fullscreenElement === el.torchStageShell || el.torchStageShell.classList.contains('is-fullscreen'))
  );
}

function toggleTorchFullscreen(forceState = null) {
  if (!el.torchStageShell) return;
  const shouldEnter = forceState !== null ? Boolean(forceState) : !isTorchFullscreen();

  if (shouldEnter) {
    el.torchStageShell.classList.add('is-fullscreen');
    document.body.style.overflow = 'hidden';
    if (el.torchStageShell.requestFullscreen) {
      el.torchStageShell.requestFullscreen().catch(() => {
        // Fallback CSS fullscreen already active
      });
    }
  } else {
    el.torchStageShell.classList.remove('is-fullscreen');
    document.body.style.overflow = '';
    if (document.fullscreenElement === el.torchStageShell && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  requestAnimationFrame(() => {
    torchDigitalTwin.resize();
    setTimeout(() => torchDigitalTwin.resize(), 120);
  });
}

function initTorchDigitalTwinControls() {
  // Transmit directly on 3D Torch (without leaving 3D Torch tab)
  if (el.torchTransmitBtn) {
    el.torchTransmitBtn.addEventListener('click', () => {
      startTorchTwinTransmission();
    });
  }

  // Fullscreen Toggle Buttons (Header, HUD Corner, Dock Exit)
  if (el.torchFullscreenBtn) {
    el.torchFullscreenBtn.addEventListener('click', () => toggleTorchFullscreen(true));
  }
  if (el.torchHudFullscreenBtn) {
    el.torchHudFullscreenBtn.addEventListener('click', () => toggleTorchFullscreen());
  }
  if (el.torchFsExitBtn) {
    el.torchFsExitBtn.addEventListener('click', () => toggleTorchFullscreen(false));
  }

  // Keep fallback state & WebGL aspect ratio synced when exiting native fullscreen (e.g., via ESC)
  document.addEventListener('fullscreenchange', () => {
    if (!el.torchStageShell) return;
    const active = document.fullscreenElement === el.torchStageShell;
    if (!active && el.torchStageShell.classList.contains('is-fullscreen')) {
      el.torchStageShell.classList.remove('is-fullscreen');
      document.body.style.overflow = '';
    }
    requestAnimationFrame(() => {
      torchDigitalTwin.resize();
      setTimeout(() => torchDigitalTwin.resize(), 100);
    });
  });

  // ESC key closes CSS-fallback fullscreen as well
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isTorchFullscreen()) {
      toggleTorchFullscreen(false);
    }
  });

  // Camera Presets
  el.torchCamBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-cam');
      el.torchCamBtns.forEach((b) => b.classList.toggle('active', b === btn));
      if (el.torchAutoRotateCheck) el.torchAutoRotateCheck.checked = false;
      torchDigitalTwin.setCameraPreset(preset);
    });
  });

  // Enclosure View Modes (Assembled / X-Ray / Exploded — synced across inline + fullscreen dock)
  const modeLabels = {
    assembled: 'ASSEMBLED SHELL',
    xray: 'X-RAY CUTAWAY',
    exploded: 'EXPLODED ASSEMBLY'
  };

  el.torchModeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      el.torchModeBtns.forEach((b) => b.classList.toggle('active', b.getAttribute('data-view') === view));
      if (el.torchHudMode) el.torchHudMode.textContent = modeLabels[view] || view.toUpperCase();
      torchDigitalTwin.applyViewMode(view, true);
    });
  });

  // Continuous Explode Sliders (inline + fullscreen dock kept in 1:1 sync)
  const handleExplodeInput = (rawVal) => {
    const pct = parseInt(rawVal, 10) || 0;
    if (el.torchExplodeSlider) el.torchExplodeSlider.value = String(pct);
    if (el.torchExplodeVal) el.torchExplodeVal.textContent = `${pct}%`;
    if (el.fsExplodeSlider) el.fsExplodeSlider.value = String(pct);
    if (el.fsExplodeVal) el.fsExplodeVal.textContent = `${pct}%`;
    torchDigitalTwin.setExplodeAmount(pct / 100);
    if (el.torchHudMode) {
      el.torchHudMode.textContent = pct > 5 ? `EXPLODED ${pct}%` : (torchDigitalTwin.viewMode === 'xray' ? 'X-RAY CUTAWAY' : 'ASSEMBLED SHELL');
    }
  };

  if (el.torchExplodeSlider) {
    el.torchExplodeSlider.addEventListener('input', (e) => handleExplodeInput(e.target.value));
  }
  if (el.fsExplodeSlider) {
    el.fsExplodeSlider.addEventListener('input', (e) => handleExplodeInput(e.target.value));
  }

  // Auto-Orbit Toggle
  if (el.torchAutoRotateCheck) {
    el.torchAutoRotateCheck.addEventListener('change', (e) => {
      torchDigitalTwin.setAutoRotate(e.target.checked);
    });
  }

  // 4 Physical Hardware Button Triggers (both inline deck and fullscreen dock)
  el.torchHwBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const hwId = btn.getAttribute('data-hw-btn');
      torchDigitalTwin.triggerButtonPressAnim(hwId);
      handleTorchHardwareButton(hwId);
    });
  });

  // Subsystem Chips
  el.torchPartChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const partId = chip.getAttribute('data-part');
      torchDigitalTwin.selectSubsystem(partId);
      renderTorchInspector(TORCH_SUBSYSTEMS[partId] || TORCH_SUBSYSTEMS.overview);
    });
  });
}

function handleTorchHardwareButton(btnId) {
  if (btnId === 'ptt') {
    toggleVoiceRecognition();
    showToast('BTN 1 (PTT): Voice AI Dictation toggled');
  } else if (btnId === 'tx') {
    startTorchTwinTransmission();
  } else if (btnId === 'sos') {
    if (el.textInput) el.textInput.value = 'SOS';
    handleTextInputChange('SOS');
    torchDigitalTwin.syncTelemetry({ mode: 'SOS OVERRIDE' });
    startTorchTwinTransmission('SOS OVERRIDE');
    showToast('BTN 3 (SOS): Hardware Emergency Distress Beacon Active');
  } else if (btnId === 'mode') {
    const isSteady = torchDigitalTwin.toggleSteadyBeam();
    if (el.torchModeBtnDesc) {
      el.torchModeBtnDesc.textContent = isSteady ? 'Steady Beam: ON' : 'Steady Beam: OFF';
    }
    const modeBtn = document.getElementById('torchHwModeBtn');
    if (modeBtn) modeBtn.classList.toggle('active', isSteady);
    if (el.fsModeBtn) {
      el.fsModeBtn.classList.toggle('active', isSteady);
      el.fsModeBtn.textContent = isSteady ? 'Beam: ON' : 'Steady Beam';
    }
    if (el.torchSyncDot) el.torchSyncDot.classList.toggle('lit', isSteady || opticalTransmitter.isPlaying);
    if (el.torchSyncStatus) {
      el.torchSyncStatus.textContent = isSteady ? 'STEADY BEAM · 10W LED ON' : 'STANDBY · LIVE SYNC READY';
    }
  }
}

function startTorchTwinTransmission(modeOverride = null) {
  if (!state.morseOutput) {
    showToast('Enter or dictate a message first to transmit on the 3D Torch.', true);
    return;
  }

  const timeline = generateOpticalTimeline(state.morseOutput, state.unitMs);
  if (timeline.length === 0) return;

  torchDigitalTwin.syncTelemetry({ mode: modeOverride || 'TX MORSE' });
  setTransmissionUIState(true);

  opticalTransmitter.playSequence(timeline, {
    enableTorch: Boolean(el.torchToggle && el.torchToggle.checked),
    enableSound: state.audioSidetoneEnabled,
    enableFullscreenFlash: false,
    onProgress: ({ currentIndex, totalItems }) => {
      const pct = Math.round((currentIndex / totalItems) * 100);
      if (el.progressBar) el.progressBar.style.transform = `scaleX(${pct / 100})`;
      if (el.progressLabel) el.progressLabel.textContent = `3D Torch Emitting: ${pct}%`;
    },
    onComplete: () => {
      setTransmissionUIState(false);
      torchDigitalTwin.syncTelemetry({ mode: 'STANDBY' });
    }
  });
}

function renderTorchInspector(subsystem) {
  if (!subsystem) return;
  if (el.inspectorCategory) el.inspectorCategory.textContent = subsystem.category;
  if (el.inspectorTitle) el.inspectorTitle.textContent = subsystem.name;
  if (el.inspectorCost) el.inspectorCost.textContent = subsystem.cost;
  if (el.inspectorSummary) el.inspectorSummary.textContent = subsystem.summary;
  if (el.inspectorModel) el.inspectorModel.textContent = subsystem.partModel;
  if (el.inspectorInterface) el.inspectorInterface.textContent = subsystem.interface;
  if (el.inspectorPower) el.inspectorPower.textContent = subsystem.power;

  // Sync floating fullscreen presentation dock callout
  if (el.fsPartCategory) el.fsPartCategory.textContent = subsystem.category;
  if (el.fsPartTitle) el.fsPartTitle.textContent = subsystem.name;
  if (el.fsPartCost) el.fsPartCost.textContent = subsystem.cost;
  if (el.fsPartSpec) el.fsPartSpec.textContent = `${subsystem.partModel} · ${subsystem.interface}`;

  el.torchPartChips.forEach((chip) => {
    chip.classList.toggle('active', chip.getAttribute('data-part') === subsystem.id);
  });
}

function syncTorchTelemetry() {
  torchDigitalTwin.syncTelemetry({
    text: state.encodedText || state.rawText || 'READY',
    morse: state.morseOutput || '',
    wpm: state.wpm,
    compressed: state.compressionSavings > 0,
    savingsPercent: state.compressionSavings
  });
}

/**
 * Tab switching
 */
function switchTab(tabId) {
  el.tabBtns.forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  el.tabPanes.forEach(pane => {
    if (pane.id === `${tabId}Tab`) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });

  if (tabId === 'beacon') {
    setTimeout(() => opticalTransmitter.resizeCanvas(), 50);
  }

  if (tabId === 'torch') {
    requestAnimationFrame(() => {
      ensureTorchTwinInitialized();
      torchDigitalTwin.setVisible(true);
      syncTorchTelemetry();
    });
  } else if (torchDigitalTwin.initialized) {
    torchDigitalTwin.setVisible(false);
  }
}

/**
 * Emergency & Semantic Presets
 */
function renderPresets() {
  if (!el.presetsContainer) return;
  el.presetsContainer.innerHTML = '';

  SEMANTIC_PRESETS.forEach(preset => {
    const chip = document.createElement('button');
    chip.className = `preset-chip ${preset.category}`;
    chip.title = `${preset.desc} — Click to encode`;
    chip.innerHTML = `<span class="preset-code">${preset.code}</span><span class="preset-chip-label">${preset.label}</span>`;
    chip.addEventListener('click', () => {
      if (el.textInput) el.textInput.value = preset.code;
      handleTextInputChange(preset.code);
      switchTab('input');
    });
    el.presetsContainer.appendChild(chip);
  });
}

/**
 * Handle live typing or preset change
 */
function handleTextInputChange(inputText, source = 'main') {
  state.rawText = inputText;
  let textToEncode = inputText;

  if (source !== 'beacon' && el.beaconQuickInput && el.beaconQuickInput.value !== inputText) {
    el.beaconQuickInput.value = inputText;
  }

  if (el.charCounter) {
    el.charCounter.textContent = `${inputText.length} chars`;
  }

  // Semantic Contraction
  state.compressionSavings = 0;
  if (state.adaptiveSemanticEnabled && inputText.trim()) {
    const comp = applySemanticCompression(inputText);
    if (comp.savingsPercent > 0 && comp.compressed !== inputText.toUpperCase()) {
      textToEncode = comp.compressed;
      state.compressionSavings = comp.savingsPercent;
      if (el.semanticInfo) {
        el.semanticInfo.classList.remove('hidden');
        el.semanticInfo.innerHTML = `<span class="badge">Compressed</span> "${escapeHtml(inputText)}" → <strong>${escapeHtml(comp.compressed)}</strong> (−${comp.savingsPercent}% time)`;
      }
    } else if (el.semanticInfo) {
      el.semanticInfo.classList.add('hidden');
    }
  } else if (el.semanticInfo) {
    el.semanticInfo.classList.add('hidden');
  }

  // Convert to Morse
  state.encodedText = textToEncode;
  state.morseOutput = textToMorse(textToEncode);
  renderMorseOutput(state.morseOutput, textToEncode);
  updateCalculationsAndWaveform();
  syncTorchTelemetry();
}

/**
 * Render visual breakdown of Morse tokens
 */
function renderMorseOutput(morse, originalText) {
  if (!morse) {
    if (el.morseDisplay) {
      el.morseDisplay.textContent = 'Morse code will appear here...';
      el.morseDisplay.classList.add('empty');
    }
    if (el.breakdownContainer) {
      el.breakdownContainer.innerHTML = '';
    }
    return;
  }

  if (el.morseDisplay) {
    el.morseDisplay.textContent = morse;
    el.morseDisplay.classList.remove('empty');
  }

  // Breakdown tokens
  if (!el.breakdownContainer) return;
  el.breakdownContainer.innerHTML = '';
  const words = originalText.toUpperCase().split(/\s+/).filter(Boolean);

  words.forEach(word => {
    const wordCard = document.createElement('div');
    wordCard.className = 'breakdown-word';

    for (let char of word) {
      const charMorse = textToMorse(char);
      const token = document.createElement('div');
      token.className = 'breakdown-char';
      token.innerHTML = `<div class="char-symbol">${char}</div><div class="char-morse">${charMorse}</div>`;

      // Tap token to play audio sample
      token.addEventListener('click', () => {
        const miniTimeline = generateOpticalTimeline(charMorse, state.unitMs);
        opticalTransmitter.playSequence(miniTimeline, {
          enableSound: state.audioSidetoneEnabled,
          enableTorch: false
        });
      });

      wordCard.appendChild(token);
    }

    el.breakdownContainer.appendChild(wordCard);
  });
}

/**
 * Recalculate metrics, sync Beacon telemetry, and redraw oscilloscope timeline
 */
function updateCalculationsAndWaveform() {
  const metrics = calculateMorseUnits(state.morseOutput);
  const totalSec = ((metrics.totalUnits * state.unitMs) / 1000).toFixed(2);

  if (el.statUnits) el.statUnits.textContent = metrics.totalUnits;
  if (el.statDuration) el.statDuration.textContent = `${totalSec}s`;
  if (el.statChars) el.statChars.textContent = metrics.charCount;
  if (el.statWpm) el.statWpm.textContent = state.wpm;

  // Render optical timeline canvas & compute oscilloscope stats
  const timeline = generateOpticalTimeline(state.morseOutput, state.unitMs);
  const stats = opticalTransmitter.getTimelineStats(timeline);
  opticalTransmitter.drawTimeline(timeline, -1);

  // Sync Beacon Tab Morse Readout & Fullscreen HUD
  if (el.beaconMorseReadout) {
    if (state.morseOutput) {
      el.beaconMorseReadout.textContent = state.morseOutput;
      el.beaconMorseReadout.classList.remove('empty');
    } else {
      el.beaconMorseReadout.textContent = 'Enter a message above to modulate optical pulses...';
      el.beaconMorseReadout.classList.add('empty');
    }
  }

  if (el.fsBeaconPayload) {
    el.fsBeaconPayload.textContent = state.encodedText || 'OPTICAL BEACON';
  }
  if (el.fsBeaconMorse) {
    el.fsBeaconMorse.textContent = state.morseOutput || 'STANDBY';
  }

  // Sync Beacon Telemetry Strip
  if (el.beaconTelemSpeed) {
    el.beaconTelemSpeed.textContent = `${state.wpm} WPM · ${state.unitMs}ms`;
  }
  if (el.beaconTelemElapsed && !opticalTransmitter.isPlaying) {
    el.beaconTelemElapsed.textContent = `0.00s / ${totalSec}s`;
  }
  if (el.beaconTelemDuty) {
    el.beaconTelemDuty.textContent = `${stats.dutyCyclePct.toFixed(1)}% ON`;
  }
  if (el.beaconTelemPulses) {
    el.beaconTelemPulses.textContent = `${stats.dotCount} · / ${stats.dashCount} —`;
  }

  syncTorchTelemetry();
}

/**
 * Voice Input using Web Speech API
 */
function toggleVoiceRecognition() {
  const pttHwBtn = document.getElementById('torchHwPttBtn');
  if (speechHandler.isListening) {
    speechHandler.stop();
    if (el.micBtn) el.micBtn.classList.remove('listening');
    if (el.micStatus) el.micStatus.textContent = '';
    if (pttHwBtn) pttHwBtn.classList.remove('active');
    torchDigitalTwin.setVoiceListening(false);
  } else {
    const started = speechHandler.start({
      onStatus: ({ listening }) => {
        torchDigitalTwin.setVoiceListening(listening);
        if (pttHwBtn) pttHwBtn.classList.toggle('active', listening);
        if (listening) {
          if (el.micBtn) el.micBtn.classList.add('listening');
          if (el.micStatus) el.micStatus.textContent = 'Listening...';
        } else {
          if (el.micBtn) el.micBtn.classList.remove('listening');
          if (el.micStatus) el.micStatus.textContent = '';
        }
      },
      onResult: ({ final, interim }) => {
        const combined = (final || interim).trim();
        if (combined) {
          if (el.textInput) el.textInput.value = combined;
          handleTextInputChange(combined);
        }
      },
      onError: ({ message }) => {
        showToast(message, true);
        if (el.micBtn) el.micBtn.classList.remove('listening');
        if (el.micStatus) el.micStatus.textContent = '';
        if (pttHwBtn) pttHwBtn.classList.remove('active');
        torchDigitalTwin.setVoiceListening(false);
      }
    });

    if (!started && !speechHandler.supported) {
      showToast('Speech recognition not supported in this browser. Please use text input or Chrome/Edge.', true);
    }
  }
}

/**
 * Manual Morse Tapper Key Logic
 */
function initManualTapper() {
  let touchActive = false;

  const startTap = (e) => {
    e.preventDefault();
    if (touchActive) return;
    touchActive = true;
    sidetone.startTone();
    state.manualTapper.keyDownTime = Date.now();
    if (el.tapperKey) el.tapperKey.classList.add('pressed');
    opticalTransmitter.setOpticalState(true);

    if (state.manualTapper.pauseTimer) {
      clearTimeout(state.manualTapper.pauseTimer);
      state.manualTapper.pauseTimer = null;
    }
  };

  const endTap = (e) => {
    e.preventDefault();
    if (!touchActive) return;
    touchActive = false;
    sidetone.stopTone();
    if (el.tapperKey) el.tapperKey.classList.remove('pressed');
    opticalTransmitter.setOpticalState(false);

    const pressDuration = Date.now() - state.manualTapper.keyDownTime;
    // Dot vs Dash threshold: 1.8 * unitMs
    const threshold = state.unitMs * 1.8;
    const symbol = pressDuration < threshold ? '.' : '-';

    appendManualMorseSymbol(symbol);

    // After letter-gap pause (3 * unitMs), decode the letter
    state.manualTapper.pauseTimer = setTimeout(() => {
      completeManualLetter();
    }, state.unitMs * 3.5);
  };

  if (el.tapperKey) {
    el.tapperKey.addEventListener('mousedown', startTap);
    el.tapperKey.addEventListener('mouseup', endTap);
    el.tapperKey.addEventListener('mouseleave', endTap);

    el.tapperKey.addEventListener('touchstart', startTap, { passive: false });
    el.tapperKey.addEventListener('touchend', endTap, { passive: false });
    el.tapperKey.addEventListener('touchcancel', endTap, { passive: false });
  }

  // Discrete manual buttons
  if (el.dotBtn) {
    el.dotBtn.addEventListener('click', () => {
      sidetone.playPulse(state.unitMs);
      appendManualMorseSymbol('.');
    });
  }

  if (el.dashBtn) {
    el.dashBtn.addEventListener('click', () => {
      sidetone.playPulse(state.unitMs * 3);
      appendManualMorseSymbol('-');
    });
  }

  if (el.spaceLetterBtn) {
    el.spaceLetterBtn.addEventListener('click', () => {
      completeManualLetter();
    });
  }

  if (el.spaceWordBtn) {
    el.spaceWordBtn.addEventListener('click', () => {
      completeManualWord();
    });
  }

  if (el.clearManualBtn) {
    el.clearManualBtn.addEventListener('click', () => {
      state.manualTapper.currentLetterMorse = '';
      state.manualTapper.fullDecodedText = '';
      if (el.manualMorseBuffer) el.manualMorseBuffer.textContent = '';
      if (el.manualDecodedText) el.manualDecodedText.textContent = '';
    });
  }

  if (el.applyManualBtn) {
    el.applyManualBtn.addEventListener('click', () => {
      completeManualLetter();
      if (state.manualTapper.fullDecodedText) {
        if (el.textInput) el.textInput.value = state.manualTapper.fullDecodedText;
        handleTextInputChange(state.manualTapper.fullDecodedText);
        switchTab('input');
        showToast('Manual Morse imported to Transmit!');
      }
    });
  }
}

function appendManualMorseSymbol(sym) {
  state.manualTapper.currentLetterMorse += sym;
  if (el.manualMorseBuffer) {
    el.manualMorseBuffer.textContent = (el.manualMorseBuffer.textContent + sym).trim();
  }
}

function completeManualLetter() {
  if (!state.manualTapper.currentLetterMorse) return;
  const letter = morseToText(state.manualTapper.currentLetterMorse);
  state.manualTapper.fullDecodedText += letter;
  if (el.manualDecodedText) {
    el.manualDecodedText.textContent = state.manualTapper.fullDecodedText;
  }

  state.manualTapper.currentLetterMorse = '';
  if (el.manualMorseBuffer) {
    el.manualMorseBuffer.textContent = el.manualMorseBuffer.textContent + ' ';
  }
}

function completeManualWord() {
  completeManualLetter();
  state.manualTapper.fullDecodedText += ' ';
  if (el.manualDecodedText) {
    el.manualDecodedText.textContent = state.manualTapper.fullDecodedText;
  }
  if (el.manualMorseBuffer) {
    el.manualMorseBuffer.textContent = el.manualMorseBuffer.textContent + ' / ';
  }
}

/**
 * Local Optical Beacon Playback (Screen + Mobile Camera Flash + Audio + Repeat/Loop)
 */
function startLocalOpticalPlayback(options = {}) {
  if (!state.morseOutput) {
    showToast('Please enter text or Morse code first!', true);
    return;
  }

  const timeline = generateOpticalTimeline(state.morseOutput, state.unitMs);
  if (timeline.length === 0) return;

  if (!options.stayOnCurrentTab) {
    switchTab('beacon');
  }
  setTransmissionUIState(true);

  const isFullscreenOpen = Boolean(
    options.forceFullscreenFlash ||
    (el.fullscreenBeacon && el.fullscreenBeacon.classList.contains('active-screen'))
  );

  opticalTransmitter.playSequence(timeline, {
    startIndex: Number(options.startIndex) || 0,
    repeatCount: state.repeatCount,
    interCycleGapMs: Math.max(420, state.unitMs * 7),
    enableTorch: Boolean(el.torchToggle && el.torchToggle.checked),
    enableSound: state.audioSidetoneEnabled,
    enableFullscreenFlash: isFullscreenOpen,
    onFrame: ({ elapsedMs, totalDurationMs, progress, cycle, repeatCount }) => {
      const pct = Math.min(100, Math.max(0, Math.round(progress * 100)));
      if (el.progressBar) el.progressBar.style.transform = `scaleX(${progress})`;
      if (el.beaconProgressBar) el.beaconProgressBar.style.transform = `scaleX(${progress})`;
      if (el.beaconProgressPct) el.beaconProgressPct.textContent = `${pct}%`;

      const elapsedSec = (elapsedMs / 1000).toFixed(2);
      const totalSec = (totalDurationMs / 1000).toFixed(2);
      if (el.beaconTelemElapsed) {
        el.beaconTelemElapsed.textContent = `${elapsedSec}s / ${totalSec}s`;
      }

      if (el.progressLabel) {
        const cycleSuffix = repeatCount >= 999
          ? ` · Loop #${cycle}`
          : (repeatCount > 1 ? ` · ${cycle}/${repeatCount}` : '');
        el.progressLabel.textContent = `Emitting Optical Signal: ${pct}%${cycleSuffix}`;
      }
    },
    onComplete: () => {
      setTransmissionUIState(false);
      showToast('Optical transmission complete!');
    }
  });
}

/**
 * Hardware Transmission to ESP32 (Wi-Fi REST / Web Serial / Simulation)
 */
async function startHardwareTransmission() {
  if (!state.morseOutput) {
    showToast('Please enter text or Morse code to transmit!', true);
    return;
  }

  setTransmissionUIState(true);
  if (el.progressLabel) el.progressLabel.textContent = 'Dispatching to ESP32 Hardware...';

  try {
    await esp32Service.transmitMorse(
      state.morseOutput,
      state.rawText,
      state.unitMs,
      state.repeatCount
    );

    showToast(`Transmission dispatched to ESP32 (${esp32Service.mode.toUpperCase()})!`);

    // Also run parallel on-screen optical visualization
    const timeline = generateOpticalTimeline(state.morseOutput, state.unitMs);
    opticalTransmitter.playSequence(timeline, {
      repeatCount: state.repeatCount,
      interCycleGapMs: Math.max(420, state.unitMs * 7),
      enableTorch: Boolean(el.torchToggle && el.torchToggle.checked),
      enableSound: state.audioSidetoneEnabled,
      enableFullscreenFlash: Boolean(el.fullscreenBeacon && el.fullscreenBeacon.classList.contains('active-screen')),
      onFrame: ({ elapsedMs, totalDurationMs, progress }) => {
        const pct = Math.min(100, Math.max(0, Math.round(progress * 100)));
        if (el.progressBar) el.progressBar.style.transform = `scaleX(${progress})`;
        if (el.beaconProgressBar) el.beaconProgressBar.style.transform = `scaleX(${progress})`;
        if (el.beaconProgressPct) el.beaconProgressPct.textContent = `${pct}%`;
        if (el.beaconTelemElapsed) {
          el.beaconTelemElapsed.textContent = `${(elapsedMs / 1000).toFixed(2)}s / ${(totalDurationMs / 1000).toFixed(2)}s`;
        }
        if (el.progressLabel) el.progressLabel.textContent = `ESP32 Transmitting: ${pct}%`;
      },
      onComplete: () => {
        setTransmissionUIState(false);
      }
    });

  } catch (err) {
    setTransmissionUIState(false);
    showToast(`Hardware Transmission Failed: ${err.message}`, true);
  }
}

/**
 * Emergency Stop
 */
async function stopAllTransmission() {
  opticalTransmitter.stopSequence();
  setTransmissionUIState(false);
  try {
    await esp32Service.stopTransmission();
  } catch (e) {}
  showToast('Transmission Aborted');
}

function setTransmissionUIState(isTransmitting) {
  if (isTransmitting) {
    if (el.transmissionProgress) el.transmissionProgress.classList.remove('hidden');
    if (el.stopTransmissionBtn) el.stopTransmissionBtn.disabled = false;
    if (el.playBeaconBtn) el.playBeaconBtn.disabled = true;
    if (el.transmitEsp32Btn) el.transmitEsp32Btn.disabled = true;
    if (el.beaconEsp32Btn) el.beaconEsp32Btn.disabled = true;

    if (el.beaconTransmitBtn) {
      el.beaconTransmitBtn.textContent = 'Stop Beacon';
      el.beaconTransmitBtn.classList.remove('btn-primary');
      el.beaconTransmitBtn.classList.add('btn-danger');
    }
    if (el.beaconPayloadTag) {
      el.beaconPayloadTag.textContent = 'TX LIVE';
      el.beaconPayloadTag.classList.add('tx-live');
    }
    if (el.fsBeaconPlayBtn) {
      el.fsBeaconPlayBtn.textContent = 'Stop';
    }
  } else {
    if (el.transmissionProgress) el.transmissionProgress.classList.add('hidden');
    if (el.stopTransmissionBtn) el.stopTransmissionBtn.disabled = true;
    if (el.playBeaconBtn) el.playBeaconBtn.disabled = false;
    if (el.transmitEsp32Btn) el.transmitEsp32Btn.disabled = false;
    if (el.beaconEsp32Btn) el.beaconEsp32Btn.disabled = false;

    if (el.progressBar) el.progressBar.style.transform = 'scaleX(0)';
    if (el.beaconProgressBar) el.beaconProgressBar.style.transform = 'scaleX(0)';
    if (el.beaconProgressPct) el.beaconProgressPct.textContent = '0%';

    if (el.beaconTransmitBtn) {
      el.beaconTransmitBtn.textContent = 'Transmit Beacon';
      el.beaconTransmitBtn.classList.remove('btn-danger');
      el.beaconTransmitBtn.classList.add('btn-primary');
    }
    if (el.beaconPayloadTag) {
      el.beaconPayloadTag.textContent = 'PAYLOAD';
      el.beaconPayloadTag.classList.remove('tx-live');
    }
    if (el.beaconCycleBadge) {
      el.beaconCycleBadge.textContent = formatRepeatLabel(state.repeatCount);
    }
    if (el.fsBeaconPlayBtn) {
      el.fsBeaconPlayBtn.textContent = 'Transmit';
    }

    const metrics = calculateMorseUnits(state.morseOutput);
    const totalSec = ((metrics.totalUnits * state.unitMs) / 1000).toFixed(2);
    if (el.beaconTelemElapsed) {
      el.beaconTelemElapsed.textContent = `0.00s / ${totalSec}s`;
    }
  }
}

/**
 * Fullscreen Optical Strobe Beacon (auto-starts transmission & flashes dynamically)
 */
function toggleFullscreenBeacon() {
  if (!el.fullscreenBeacon) return;
  if (!state.morseOutput) {
    showToast('Enter a message first to launch Fullscreen Strobe.', true);
    return;
  }

  el.fullscreenBeacon.classList.add('active', 'active-screen');
  opticalTransmitter.setFullscreenFlash(true);

  if (el.fsBeaconPayload) el.fsBeaconPayload.textContent = state.encodedText || 'OPTICAL BEACON';
  if (el.fsBeaconMorse) el.fsBeaconMorse.textContent = state.morseOutput;

  el.fullscreenBeacon.requestFullscreen?.().catch(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
  });

  // Immediately begin transmitting if idle so fullscreen strobe works out of the box
  if (!opticalTransmitter.isPlaying) {
    startLocalOpticalPlayback({ stayOnCurrentTab: true, forceFullscreenFlash: true });
  }
}

function exitFullscreenBeacon() {
  if (!el.fullscreenBeacon) return;
  el.fullscreenBeacon.classList.remove('active', 'active-screen', 'flash-on');
  opticalTransmitter.setFullscreenFlash(false);
  if (document.fullscreenElement) {
    document.exitFullscreen?.().catch(() => {});
  }
}

/**
 * Hardware UI updates
 */
function updateHardwareUI() {
  if (el.hardwareModeSelect) el.hardwareModeSelect.value = esp32Service.mode;
  if (el.esp32IpInput) el.esp32IpInput.value = esp32Service.targetIp;
  if (el.esp32PortInput) el.esp32PortInput.value = esp32Service.targetPort;
  if (el.useProxyCheck) el.useProxyCheck.checked = esp32Service.useProxy;

  const isSerial = esp32Service.mode === 'serial';
  if (el.connectSerialBtn) {
    el.connectSerialBtn.classList.toggle('hidden', !isSerial);
  }

  if (el.hardwareStatusBadge && el.hardwareStatusText) {
    if (esp32Service.mode === 'simulation') {
      el.hardwareStatusBadge.className = 'status-badge sim';
      el.hardwareStatusText.textContent = 'SIM';
    } else if (esp32Service.isConnected) {
      el.hardwareStatusBadge.className = 'status-badge online';
      el.hardwareStatusText.textContent = 'ONLINE';
    } else {
      el.hardwareStatusBadge.className = 'status-badge offline';
      el.hardwareStatusText.textContent = 'STANDBY';
    }
  }
}

function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'error' : 'success'}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 20);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3200);
}

// Log listener from ESP32 service
esp32Service.onLogMessage = (entry) => {
  if (!el.activityLog) return;
  const row = document.createElement('div');
  row.className = `log-row ${entry.type}`;
  row.innerHTML = `<span class="log-time">[${entry.timestamp}]</span> <span class="log-text">${entry.text}</span>`;
  el.activityLog.appendChild(row);
  el.activityLog.scrollTop = el.activityLog.scrollHeight;
};

esp32Service.onStatusChange = () => {
  updateHardwareUI();
};

// Live UTC Mission Clock
function updateMissionClock() {
  if (!el.missionClockDisplay) return;
  const now = new Date();
  const utcHours = String(now.getUTCHours()).padStart(2, '0');
  const utcMins = String(now.getUTCMinutes()).padStart(2, '0');
  const utcSecs = String(now.getUTCSeconds()).padStart(2, '0');
  el.missionClockDisplay.textContent = `${utcHours}:${utcMins}:${utcSecs}`;
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initDOMElements();
  initEventListeners();

  // Sync state with DOM control states (in case browser restored them on reload)
  if (el.adaptiveToggle) {
    state.adaptiveSemanticEnabled = el.adaptiveToggle.checked;
  }
  if (el.soundToggle) {
    state.audioSidetoneEnabled = el.soundToggle.checked;
    sidetone.setEnabled(state.audioSidetoneEnabled);
  }
  if (el.pitchSlider && el.soundSubLabel) {
    const pitch = parseInt(el.pitchSlider.value, 10) || 750;
    sidetone.setFrequency(pitch);
    el.soundSubLabel.textContent = `CW audio tone · ${pitch} Hz`;
  }
  setWpm(el.wpmSlider ? parseInt(el.wpmSlider.value, 10) : state.wpm);
  setRepeatCount(el.repeatSelect ? parseInt(el.repeatSelect.value, 10) : state.repeatCount);

  esp32Service.init();
  updateHardwareUI();

  // Start live mission clock
  updateMissionClock();
  setInterval(updateMissionClock, 1000);

  // Preserve restored input or initialize with default
  const initialText = (el.textInput && el.textInput.value && el.textInput.value.trim()) ? el.textInput.value : 'SOS';
  if (el.textInput) {
    el.textInput.value = initialText;
  }
  handleTextInputChange(initialText);

  // Keep oscilloscope canvas and 3D Torch WebGL viewport synced on mobile/tablet rotation
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      opticalTransmitter.resizeCanvas();
      if (torchDigitalTwin.initialized) {
        torchDigitalTwin.resize();
      }
    }, 180);
  });

  // Sidetone unlock on first user gesture
  const unlockAudio = () => {
    sidetone.init();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('touchstart', unlockAudio);
});
