/**
 * OPTIX - Main Application Controller
 * Adaptive Semantic Morse-Based Optical Communication System
 */

import {
  MORSE_TABLE,
  textToMorse,
  morseToText,
  applySemanticCompression,
  getUnsupportedChars,
  calculateMorseUnits,
  wpmToUnitMs,
  generateOpticalTimeline,
  SEMANTIC_PRESETS
} from './morseEngine.js';

import { sidetone } from './audioSidetone.js';
import { opticalTransmitter } from './opticalTransmitter.js';
import { speechHandler } from './speechHandler.js';
import { esp32Service } from './esp32Service.js';

// Lazy-loaded 3D Torch Digital Twin (avoids loading 711 KB Three.js bundle until Tab 4 opens)
let _torchReal = null;
let TORCH_SUBSYSTEMS = {};
let _torchLoadPromise = null;

function loadTorchModule() {
  if (_torchReal) return Promise.resolve(_torchReal);
  if (!_torchLoadPromise) {
    _torchLoadPromise = import('./torchDigitalTwin.js').then((mod) => {
      _torchReal = mod.torchDigitalTwin;
      TORCH_SUBSYSTEMS = mod.TORCH_SUBSYSTEMS || {};
      return _torchReal;
    });
  }
  return _torchLoadPromise;
}

const torchDigitalTwin = {
  get initialized() { return Boolean(_torchReal && _torchReal.initialized); },
  get steadyBeamOn() { return Boolean(_torchReal && _torchReal.steadyBeamOn); },
  get viewMode() { return _torchReal ? _torchReal.viewMode : 'assembled'; },
  set onExplodeSliderSync(fn) { if (_torchReal) _torchReal.onExplodeSliderSync = fn; },
  init(...args) { return _torchReal?.init(...args); },
  setVisible(...args) { return _torchReal?.setVisible(...args); },
  resize(...args) { return _torchReal?.resize(...args); },
  setOpticalPulse(...args) { return _torchReal?.setOpticalPulse(...args); },
  setVoiceListening(...args) { return _torchReal?.setVoiceListening(...args); },
  syncTelemetry(...args) { return _torchReal?.syncTelemetry(...args); },
  setCameraPreset(...args) { return _torchReal?.setCameraPreset(...args); },
  applyViewMode(...args) { return _torchReal?.applyViewMode(...args); },
  setExplodeAmount(...args) { return _torchReal?.setExplodeAmount(...args); },
  setAutoRotate(...args) { return _torchReal?.setAutoRotate(...args); },
  triggerButtonPressAnim(...args) { return _torchReal?.triggerButtonPressAnim(...args); },
  selectSubsystem(...args) { return _torchReal?.selectSubsystem(...args); },
  toggleSteadyBeam(...args) { return Boolean(_torchReal?.toggleSteadyBeam(...args)); }
};

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
  adaptiveSemanticEnabled: false, // Opt-in by default to protect emergency payload fidelity
  audioSidetoneEnabled: true,
  repeatCount: 1,
  hardwareTxActive: false,
  fullscreenStrobeMode: 'amber', // 'amber' | 'white' | 'none'
  fsArmingTimer: null,
  fsLastFocused: null,
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
  el.unsupportedCharsWarn = document.getElementById('unsupportedCharsWarn');
  el.toastRegion = document.getElementById('toastRegion');

  // Manual Morse Key elements
  el.tapperKey = document.getElementById('tapperKey');
  el.dotBtn = document.getElementById('dotBtn');
  el.dashBtn = document.getElementById('dashBtn');
  el.spaceLetterBtn = document.getElementById('spaceLetterBtn');
  el.spaceWordBtn = document.getElementById('spaceWordBtn');
  el.backspaceManualBtn = document.getElementById('backspaceManualBtn');
  el.clearManualBtn = document.getElementById('clearManualBtn');
  el.manualMorseBuffer = document.getElementById('manualMorseBuffer');
  el.manualDecodedText = document.getElementById('manualDecodedText');
  el.applyManualBtn = document.getElementById('applyManualBtn');
  el.morseAlphaGrid = document.getElementById('morseAlphaGrid');

  // Output & Metrics
  el.morseDisplay = document.getElementById('morseDisplay');
  el.breakdownContainer = document.getElementById('breakdownContainer');
  el.statUnits = document.getElementById('statUnits');
  el.statDuration = document.getElementById('statDuration');
  el.statChars = document.getElementById('statChars');
  el.statWpm = document.getElementById('statWpm');
  el.copyMorseBtn = document.getElementById('copyMorseBtn');
  el.transmitSosBtn = document.getElementById('transmitSosBtn');

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
  el.transmitWaveformCanvas = document.getElementById('transmitWaveformCanvas');
  el.transmitVoltageBadge = document.getElementById('transmitVoltageBadge');
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
  el.fsBeaconColorBtn = document.getElementById('fsBeaconColorBtn');
  el.fsBeaconLoopBtn = document.getElementById('fsBeaconLoopBtn');
  el.fsBeaconExitBtn = document.getElementById('fsBeaconExitBtn');
  el.fsSafetyGate = document.getElementById('fsSafetyGate');
  el.fsSafetyDesc = document.getElementById('fsSafetyDesc');
  el.fsReducedMotionNote = document.getElementById('fsReducedMotionNote');
  el.fsArmStrobeBtn = document.getElementById('fsArmStrobeBtn');
  el.fsCancelGateBtn = document.getElementById('fsCancelGateBtn');
  el.fsColorModeBtns = document.querySelectorAll('[data-fs-color]');

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

  // Enhanced HUD & Quiet Minimal Instrument Elements
  el.missionClockDisplay = document.getElementById('missionClockDisplay');
  el.charCounter = document.getElementById('charCounter');
  el.transmitEmitterDial = document.getElementById('transmitEmitterDial');
  el.transmitEmitterState = document.getElementById('transmitEmitterState');
  el.routingLinkStatus = document.getElementById('routingLinkStatus');
  el.routingLinkText = document.getElementById('routingLinkText');
  el.routingBridgeLabel = document.getElementById('routingBridgeLabel');
  el.routingEmitterNode = document.getElementById('routingEmitterNode');
  el.toggleAllTokensBtn = document.getElementById('toggleAllTokensBtn');
  el.toggleTransmitTraceBtn = document.getElementById('toggleTransmitTraceBtn');
  el.transmitWaveformBlock = document.getElementById('transmitWaveformBlock');
  el.footerDiodeCurrent = document.getElementById('footerDiodeCurrent');
  el.footerViewportSpec = document.getElementById('footerViewportSpec');

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

  // Initialize Optical Transmitter with both Beacon & Transmit workstation canvases + seek
  opticalTransmitter.init({
    beaconEl: el.beaconBulb,
    canvasEl: el.waveformCanvas,
    previewCanvasEl: el.transmitWaveformCanvas,
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
    if (el.transmitVoltageBadge) {
      el.transmitVoltageBadge.classList.toggle('high', isOn);
      el.transmitVoltageBadge.textContent = isOn ? '3.3V HIGH' : '0.0V LOW';
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

    // 1b. Mirror onto Transmit Optical Diode Dial, Routing Emitter & Calibration Footer
    if (el.transmitEmitterDial) {
      el.transmitEmitterDial.classList.toggle('active', isOn);
    }
    if (el.transmitEmitterState) {
      el.transmitEmitterState.classList.toggle('emitting', isOn);
      if (meta && meta.manual && isOn) {
        el.transmitEmitterState.textContent = 'MANUAL PULSE';
      } else if (isOn) {
        el.transmitEmitterState.textContent = 'EMITTING';
      } else if (opticalTransmitter.isPlaying) {
        el.transmitEmitterState.textContent = 'KEYING';
      } else {
        el.transmitEmitterState.textContent = 'READY';
      }
    }
    if (el.routingEmitterNode) {
      el.routingEmitterNode.classList.toggle('emitting', isOn);
    }
    if (el.footerDiodeCurrent) {
      el.footerDiodeCurrent.textContent = isOn ? '180.0 mA' : '24.2 mA';
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
  // Navigation Tabs (click + WAI-ARIA roving arrow-key navigation)
  const tabArray = Array.from(el.tabBtns);
  tabArray.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      const tabTarget = btn.getAttribute('data-tab');
      switchTab(tabTarget);
    });

    btn.addEventListener('keydown', (e) => {
      let nextIdx = -1;
      if (e.key === 'ArrowRight') nextIdx = (idx + 1) % tabArray.length;
      else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + tabArray.length) % tabArray.length;
      else if (e.key === 'Home') nextIdx = 0;
      else if (e.key === 'End') nextIdx = tabArray.length - 1;
      if (nextIdx >= 0) {
        e.preventDefault();
        const nextBtn = tabArray[nextIdx];
        switchTab(nextBtn.getAttribute('data-tab'));
        nextBtn.focus();
      }
    });
  });

  // Text Input
  if (el.textInput) {
    el.textInput.addEventListener('input', () => {
      handleTextInputChange(el.textInput.value);
    });

    el.textInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (e.isComposing || e.keyCode === 229) return;
        startHardwareTransmission();
      }
    });
  }

  // Semantic Compression 1-tap Apply / Send Raw actions
  if (el.semanticInfo) {
    el.semanticInfo.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('[data-semantic-action]');
      if (!actionBtn) return;
      const action = actionBtn.getAttribute('data-semantic-action');
      const enable = action === 'apply';
      state.adaptiveSemanticEnabled = enable;
      if (el.adaptiveToggle) el.adaptiveToggle.checked = enable;
      handleTextInputChange(el.textInput ? el.textInput.value : state.rawText);
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
      try { localStorage.setItem('optix_pitch', String(pitch)); } catch (err) { }
      if (el.pitchValue) el.pitchValue.textContent = `${pitch} Hz`;
      if (el.soundSubLabel) el.soundSubLabel.textContent = `CW audio tone · ${pitch} Hz`;
    });
  }

  if (el.soundToggle) {
    el.soundToggle.addEventListener('change', (e) => {
      state.audioSidetoneEnabled = e.target.checked;
      try { localStorage.setItem('optix_sound', String(e.target.checked)); } catch (err) { }
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
      if (!state.morseOutput) {
        showToast('No Morse sequence to copy.', true);
        return;
      }
      try {
        await navigator.clipboard.writeText(state.morseOutput);
        showToast('Morse sequence copied to clipboard.');
      } catch (e) {
        showToast('Copied: ' + state.morseOutput);
      }
    });
  }

  // 1-Tap Emergency SOS directly from Transmit tab
  if (el.transmitSosBtn) {
    el.transmitSosBtn.addEventListener('click', () => {
      if (opticalTransmitter.isPlaying) {
        opticalTransmitter.stopSequence();
      }
      if (el.textInput) el.textInput.value = 'SOS';
      if (el.beaconQuickInput) el.beaconQuickInput.value = 'SOS';
      handleTextInputChange('SOS');
      startLocalOpticalPlayback({ stayOnCurrentTab: true });
      showToast('Emergency SOS optical beacon active.');
    });
  }

  // Play Beacon locally on screen/torch (from Transmit tab)
  if (el.playBeaconBtn) {
    el.playBeaconBtn.addEventListener('click', () => startLocalOpticalPlayback());
  }

  // Toggle inline TTL Oscilloscope Trace on Transmit tab
  if (el.toggleTransmitTraceBtn && el.transmitWaveformBlock) {
    el.toggleTransmitTraceBtn.addEventListener('click', () => {
      const willShow = el.transmitWaveformBlock.classList.contains('hidden');
      el.transmitWaveformBlock.classList.toggle('hidden', !willShow);
      el.toggleTransmitTraceBtn.setAttribute('aria-expanded', String(willShow));
      if (willShow) {
        requestAnimationFrame(() => opticalTransmitter.resizeCanvas());
      }
    });
  }

  // Toggle extended emergency tokens (+3 MORE)
  if (el.toggleAllTokensBtn) {
    el.toggleAllTokensBtn.addEventListener('click', () => {
      const expanded = el.toggleAllTokensBtn.getAttribute('aria-expanded') === 'true';
      const next = !expanded;
      el.toggleAllTokensBtn.setAttribute('aria-expanded', String(next));
      el.toggleAllTokensBtn.textContent = next ? 'LESS' : '+3 MORE';
      if (el.presetsContainer) {
        el.presetsContainer.querySelectorAll('.preset-chip.extra-token').forEach((chip) => {
          chip.classList.toggle('collapsed', !next);
        });
      }
    });
  }

  // Hero Optical Diode Dial on Transmit tab — press & hold for manual test pulse
  if (el.transmitEmitterDial) {
    let dialHolding = false;
    const startDialFlash = (e) => {
      if (e.type === 'keydown' && e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault();
      if (dialHolding) return;
      dialHolding = true;
      opticalTransmitter.setManualPulse(true, {
        enableTorch: Boolean(el.torchToggle && el.torchToggle.checked),
        enableSound: state.audioSidetoneEnabled
      });
    };
    const endDialFlash = () => {
      if (!dialHolding) return;
      dialHolding = false;
      opticalTransmitter.setManualPulse(false);
    };
    el.transmitEmitterDial.addEventListener('mousedown', startDialFlash);
    el.transmitEmitterDial.addEventListener('mouseup', endDialFlash);
    el.transmitEmitterDial.addEventListener('mouseleave', endDialFlash);
    el.transmitEmitterDial.addEventListener('touchstart', startDialFlash, { passive: false });
    el.transmitEmitterDial.addEventListener('touchend', endDialFlash);
    el.transmitEmitterDial.addEventListener('touchcancel', endDialFlash);
    el.transmitEmitterDial.addEventListener('keydown', startDialFlash);
    el.transmitEmitterDial.addEventListener('keyup', endDialFlash);
    el.transmitEmitterDial.addEventListener('blur', endDialFlash);
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
      const parsed = parseInt(e.target.value, 10);
      const clamped = Number.isFinite(parsed) ? Math.max(1, Math.min(65535, parsed)) : 80;
      e.target.value = String(clamped);
      esp32Service.targetPort = clamped;
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
      if (el.hardwareStatusText) el.hardwareStatusText.textContent = 'SYS.PING...';
      try {
        await esp32Service.ping();
        showToast('ESP32 heartbeat ACK received.');
      } catch (err) {
        if (el.hardwareStatusBadge && el.hardwareStatusText) {
          el.hardwareStatusBadge.className = 'status-badge offline';
          el.hardwareStatusText.textContent = 'SYS.FAULT';
        }
        if (el.routingLinkStatus && el.routingLinkText) {
          el.routingLinkStatus.className = 'routing-link-status offline';
          el.routingLinkText.textContent = 'LINK FAULT';
        }
        showToast(`ESP32 unreachable: ${err.message}`, true);
      } finally {
        el.pingEsp32Btn.disabled = false;
        if (esp32Service.isConnected || esp32Service.mode === 'simulation') {
          updateHardwareUI();
        }
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
          showToast('USB Serial connected to ESP32.');
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
  renderMorseReferenceChart();
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
  try { localStorage.setItem('optix_wpm', String(safeWpm)); } catch (err) { }

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
  try { localStorage.setItem('optix_repeat', String(safeCount)); } catch (err) { }

  if (el.repeatSelect) {
    el.repeatSelect.value = String(safeCount);
  }

  if (el.beaconRepeatBtns) {
    el.beaconRepeatBtns.forEach((btn) => {
      const btnVal = parseInt(btn.getAttribute('data-repeat'), 10);
      const isSelected = btnVal === safeCount;
      btn.classList.toggle('active', isSelected);
      btn.setAttribute('aria-pressed', String(isSelected));
    });
  }

  if (el.beaconCycleBadge && !opticalTransmitter.isPlaying) {
    el.beaconCycleBadge.textContent = formatRepeatLabel(safeCount);
  }

  if (el.fsBeaconLoopBtn) {
    const isLoop = safeCount >= 999;
    el.fsBeaconLoopBtn.textContent = isLoop ? 'Loop: ON' : 'Loop: OFF';
    el.fsBeaconLoopBtn.classList.toggle('active', isLoop);
    el.fsBeaconLoopBtn.setAttribute('aria-pressed', String(isLoop));
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

  // Instant SOS Strobe Button (safely interrupts any running playback)
  if (el.beaconSosBtn) {
    el.beaconSosBtn.addEventListener('click', () => {
      if (opticalTransmitter.isPlaying) {
        opticalTransmitter.stopSequence();
      }
      if (el.textInput) el.textInput.value = 'SOS';
      if (el.beaconQuickInput) el.beaconQuickInput.value = 'SOS';
      handleTextInputChange('SOS');
      startLocalOpticalPlayback({ stayOnCurrentTab: true });
      showToast('Emergency SOS optical beacon active.');
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

  // Fullscreen Optical Strobe HUD & Safety Gate Controls
  if (el.fsBeaconControls) {
    el.fsBeaconControls.addEventListener('click', (e) => e.stopPropagation());
  }
  if (el.fsSafetyGate) {
    el.fsSafetyGate.addEventListener('click', (e) => e.stopPropagation());
  }

  if (el.fsColorModeBtns) {
    el.fsColorModeBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const mode = btn.getAttribute('data-fs-color') || 'amber';
        setFullscreenStrobeMode(mode);
      });
    });
  }

  if (el.fsArmStrobeBtn) {
    el.fsArmStrobeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      beginFullscreenArmingCountdown();
    });
  }

  if (el.fsCancelGateBtn) {
    el.fsCancelGateBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      exitFullscreenBeacon();
    });
  }

  if (el.fsBeaconColorBtn) {
    el.fsBeaconColorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const order = ['amber', 'white', 'none'];
      const next = order[(order.indexOf(state.fullscreenStrobeMode) + 1) % order.length];
      setFullscreenStrobeMode(next);
    });
  }

  if (el.fsBeaconPlayBtn) {
    el.fsBeaconPlayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (opticalTransmitter.isPlaying) {
        stopAllTransmission();
      } else {
        if (el.fsSafetyGate && !el.fsSafetyGate.classList.contains('hidden')) {
          beginFullscreenArmingCountdown();
        } else {
          startLocalOpticalPlayback({ stayOnCurrentTab: true, forceFullscreenFlash: true });
        }
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

  // Global ESC & Fullscreen Modal Focus Trap
  document.addEventListener('keydown', (e) => {
    const fsOpen = Boolean(el.fullscreenBeacon && el.fullscreenBeacon.classList.contains('active'));

    if (fsOpen && e.key === 'Tab') {
      const focusables = Array.from(
        el.fullscreenBeacon.querySelectorAll('button:not([disabled]), [tabindex]:not([tabindex="-1"])')
      ).filter((node) => node.offsetParent !== null);
      if (focusables.length > 0) {
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && (document.activeElement === first || !el.fullscreenBeacon.contains(document.activeElement))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (document.activeElement === last || !el.fullscreenBeacon.contains(document.activeElement))) {
          e.preventDefault();
          first.focus();
        }
      }
      return;
    }

    if (e.key === 'Escape') {
      if (fsOpen) {
        e.preventDefault();
        exitFullscreenBeacon();
      } else if (!isTorchFullscreen() && (opticalTransmitter.isPlaying || state.hardwareTxActive || state.fsArmingTimer)) {
        e.preventDefault();
        stopAllTransmission();
      }
    }
  });

  // Sync overlay & stop playback if native fullscreen exited via browser controls
  document.addEventListener('fullscreenchange', () => {
    if (
      el.fullscreenBeacon &&
      el.fullscreenBeacon.classList.contains('active') &&
      !document.fullscreenElement
    ) {
      exitFullscreenBeacon();
    }
  });
}

/**
 * 3D Torch Digital Twin Controller & Live Sync
 */
async function ensureTorchTwinInitialized() {
  if (!el.torchViewport) return;
  await loadTorchModule();
  if (torchDigitalTwin.initialized) return;

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
      document.exitFullscreen().catch(() => { });
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
    const isActive = btn.getAttribute('data-tab') === tabId;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
    btn.setAttribute('tabindex', isActive ? '0' : '-1');
  });

  el.tabPanes.forEach(pane => {
    const isActive = pane.id === `${tabId}Tab`;
    pane.classList.toggle('active', isActive);
  });

  if (tabId === 'beacon' || tabId === 'input') {
    setTimeout(() => opticalTransmitter.resizeCanvas(), 50);
  }

  if (tabId === 'torch') {
    requestAnimationFrame(async () => {
      await ensureTorchTwinInitialized();
      torchDigitalTwin.setVisible(true);
      syncTorchTelemetry();
    });
  } else if (torchDigitalTwin.initialized) {
    torchDigitalTwin.setVisible(false);
  }
}

/**
 * Standard Emergency Tokens (Quiet Minimal Swiss rectangular buttons)
 * Primary 5 visible by default matching calibrated layout; +3 extra expandable
 */
const TOKEN_SHORT_LABELS = {
  sos: 'Distress',
  med: 'Medical',
  fire: 'Alert',
  water: 'Supply',
  safe: 'Ack',
  trap: 'Rescue',
  food: 'Rations',
  ack: 'Confirm'
};

const PRIMARY_TOKEN_IDS = ['sos', 'med', 'fire', 'water', 'safe'];

function renderPresets() {
  if (!el.presetsContainer) return;
  el.presetsContainer.innerHTML = '';

  const primaryItems = PRIMARY_TOKEN_IDS
    .map((id) => SEMANTIC_PRESETS.find((p) => p.id === id))
    .filter(Boolean);
  const extraItems = SEMANTIC_PRESETS.filter((p) => !PRIMARY_TOKEN_IDS.includes(p.id));
  const ordered = [...primaryItems, ...extraItems];

  const isExpanded = el.toggleAllTokensBtn && el.toggleAllTokensBtn.getAttribute('aria-expanded') === 'true';

  ordered.forEach((preset) => {
    const isExtra = !PRIMARY_TOKEN_IDS.includes(preset.id);
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `preset-chip ${preset.category}${isExtra ? ' extra-token' : ''}${isExtra && !isExpanded ? ' collapsed' : ''}`;
    chip.dataset.tokenCode = preset.code;
    chip.title = `${preset.desc} — Click to encode`;

    const codeSpan = document.createElement('span');
    codeSpan.className = 'preset-code';
    codeSpan.textContent = preset.code;

    const labelSpan = document.createElement('span');
    labelSpan.className = 'preset-chip-label';
    labelSpan.textContent = TOKEN_SHORT_LABELS[preset.id] || preset.label;

    chip.appendChild(codeSpan);
    chip.appendChild(labelSpan);
    chip.addEventListener('click', () => {
      if (el.textInput) el.textInput.value = preset.code;
      handleTextInputChange(preset.code);
      switchTab('input');
    });
    el.presetsContainer.appendChild(chip);
  });

  if (el.toggleAllTokensBtn) {
    el.toggleAllTokensBtn.classList.toggle('hidden', extraItems.length === 0);
  }
}

function autoResizePayloadInput() {
  if (!el.textInput) return;
  el.textInput.style.height = 'auto';
  el.textInput.style.height = `${Math.min(180, Math.max(52, el.textInput.scrollHeight))}px`;
}

function syncActiveTokenHighlight(currentText) {
  if (!el.presetsContainer) return;
  const normalized = (currentText || '').trim().toUpperCase();
  el.presetsContainer.querySelectorAll('.preset-chip').forEach((chip) => {
    chip.classList.toggle('active-token', chip.dataset.tokenCode === normalized);
  });
}

/**
 * Collapsible ITU-R M.1677-1 Morse Alphabet Reference (A–Z, 0–9) on Manual Key tab
 */
function renderMorseReferenceChart() {
  if (!el.morseAlphaGrid) return;
  el.morseAlphaGrid.innerHTML = '';

  const keys = [
    ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
    ...'0123456789'.split('')
  ];

  keys.forEach((ch) => {
    const code = MORSE_TABLE[ch];
    if (!code) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'morse-alpha-item';
    btn.setAttribute('aria-label', `Character ${ch}, Morse ${code}. Click to preview tone.`);
    btn.title = `Preview ${ch} (${code})`;

    const sym = document.createElement('span');
    sym.className = 'morse-alpha-char';
    sym.textContent = ch;

    const morse = document.createElement('span');
    morse.className = 'morse-alpha-code';
    morse.textContent = code;

    btn.appendChild(sym);
    btn.appendChild(morse);
    btn.addEventListener('click', () => {
      const miniTimeline = generateOpticalTimeline(code, state.unitMs);
      opticalTransmitter.playSequence(miniTimeline, {
        enableSound: state.audioSidetoneEnabled,
        enableTorch: false
      });
    });

    el.morseAlphaGrid.appendChild(btn);
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
    el.charCounter.textContent = `${inputText.length} ${inputText.length === 1 ? 'Char' : 'Chars'}`;
  }
  autoResizePayloadInput();
  syncActiveTokenHighlight(inputText);

  // Opt-in Semantic Contraction with live before/after diff and 1-tap Apply / Send Raw override
  state.compressionSavings = 0;
  const trimmedInput = inputText.trim();
  if (trimmedInput) {
    const comp = applySemanticCompression(inputText);
    if (comp.changed) {
      if (state.adaptiveSemanticEnabled) {
        textToEncode = comp.compressed;
        state.compressionSavings = comp.savingsPercent;
        if (el.semanticInfo) {
          el.semanticInfo.classList.remove('hidden');
          el.semanticInfo.classList.remove('suggestion');
          el.semanticInfo.innerHTML =
            `<span class="badge">Compressed</span> ` +
            `<span class="semantic-diff">"${escapeHtml(comp.original)}" → <strong>${escapeHtml(comp.compressed)}</strong> (−${comp.savingsPercent}% time)</span> ` +
            `<button type="button" class="semantic-action-btn" data-semantic-action="raw">Send Raw</button>`;
        }
      } else if (el.semanticInfo) {
        el.semanticInfo.classList.remove('hidden');
        el.semanticInfo.classList.add('suggestion');
        el.semanticInfo.innerHTML =
          `<span class="badge">Optional</span> ` +
          `<span class="semantic-diff">Shorten to <strong>${escapeHtml(comp.compressed)}</strong> (−${comp.savingsPercent}% air time)</span> ` +
          `<button type="button" class="semantic-action-btn" data-semantic-action="apply">Apply</button>`;
      }
    } else if (el.semanticInfo) {
      el.semanticInfo.classList.add('hidden');
    }
  } else if (el.semanticInfo) {
    el.semanticInfo.classList.add('hidden');
  }

  // Warn operator explicitly if unsupported characters will be omitted from Morse encoding
  const unsupported = getUnsupportedChars(textToEncode);
  if (el.unsupportedCharsWarn) {
    if (unsupported.length > 0) {
      el.unsupportedCharsWarn.classList.remove('hidden');
      el.unsupportedCharsWarn.textContent = `Unsupported in ITU Morse (omitted): ${unsupported.join(' ')}`;
    } else {
      el.unsupportedCharsWarn.classList.add('hidden');
      el.unsupportedCharsWarn.textContent = '';
    }
  }

  // Convert to Morse
  state.encodedText = textToEncode;
  state.morseOutput = textToMorse(textToEncode);
  renderMorseOutput(state.morseOutput, textToEncode);
  updateCalculationsAndWaveform();
  syncTorchTelemetry();
}

/**
 * Render visual breakdown of Morse tokens in Swiss Quiet Minimal notation
 * (Stacked letter over spaced dots/dashes, separated by quiet '/' slashes)
 */
function renderMorseOutput(morse, originalText) {
  if (!morse) {
    if (el.morseDisplay) {
      el.morseDisplay.textContent = '';
      el.morseDisplay.classList.add('empty');
    }
    if (el.breakdownContainer) {
      el.breakdownContainer.innerHTML = '<span class="breakdown-empty">AWAITING SIGNAL PAYLOAD</span>';
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

  words.forEach((word, wIdx) => {
    if (wIdx > 0) {
      const wordSep = document.createElement('span');
      wordSep.className = 'breakdown-word-sep';
      wordSep.setAttribute('aria-hidden', 'true');
      wordSep.textContent = '//';
      el.breakdownContainer.appendChild(wordSep);
    }

    const wordCard = document.createElement('div');
    wordCard.className = 'breakdown-word';

    const validChars = Array.from(word).filter((ch) => Boolean(textToMorse(ch)));
    validChars.forEach((char, cIdx) => {
      const charMorse = textToMorse(char);
      if (!charMorse) return;

      if (cIdx > 0) {
        const sep = document.createElement('span');
        sep.className = 'breakdown-char-sep';
        sep.setAttribute('aria-hidden', 'true');
        sep.textContent = '/';
        wordCard.appendChild(sep);
      }

      const token = document.createElement('button');
      token.type = 'button';
      token.className = 'breakdown-char';
      token.setAttribute('aria-label', `Play Morse for ${char}: ${charMorse}`);
      token.title = `Preview ${char} (${charMorse})`;

      const symEl = document.createElement('span');
      symEl.className = 'char-symbol';
      symEl.textContent = char;

      const morseEl = document.createElement('span');
      morseEl.className = 'char-morse';
      morseEl.textContent = charMorse;

      token.appendChild(symEl);
      token.appendChild(morseEl);

      // Click or keyboard Enter/Space previews character audio and highlights active token
      token.addEventListener('click', () => {
        const miniTimeline = generateOpticalTimeline(charMorse, state.unitMs);
        el.breakdownContainer.querySelectorAll('.breakdown-char.playing').forEach((n) => n.classList.remove('playing'));
        token.classList.add('playing');
        if (el.stopTransmissionBtn) el.stopTransmissionBtn.disabled = false;
        opticalTransmitter.playSequence(miniTimeline, {
          enableSound: state.audioSidetoneEnabled,
          enableTorch: false,
          onComplete: () => {
            token.classList.remove('playing');
            if (!state.hardwareTxActive && el.stopTransmissionBtn) {
              el.stopTransmissionBtn.disabled = true;
            }
          }
        });
      });

      wordCard.appendChild(token);
    });

    if (wordCard.children.length > 0) {
      el.breakdownContainer.appendChild(wordCard);
    }
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

  const waveformSrLabel = timeline.length > 0
    ? `TTL 3.3V Morse pulse oscilloscope for ${state.encodedText || 'signal'}: ${stats.dotCount} dots, ${stats.dashCount} dashes, ${totalSec} seconds at ${state.wpm} WPM, ${stats.dutyCyclePct.toFixed(1)}% duty cycle. Use Left and Right arrow keys to inspect pulses and Enter to seek.`
    : 'TTL 3.3V Morse pulse oscilloscope: standby, no signal.';

  if (el.waveformCanvas) el.waveformCanvas.setAttribute('aria-label', waveformSrLabel);
  if (el.transmitWaveformCanvas) el.transmitWaveformCanvas.setAttribute('aria-label', waveformSrLabel);

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
    if (el.micBtn) {
      el.micBtn.classList.remove('listening');
      el.micBtn.setAttribute('aria-pressed', 'false');
    }
    if (el.micStatus) el.micStatus.textContent = '';
    if (pttHwBtn) pttHwBtn.classList.remove('active');
    torchDigitalTwin.setVoiceListening(false);
  } else {
    const existingText = el.textInput ? el.textInput.value.trim() : '';
    const started = speechHandler.start({
      initialText: existingText,
      onStatus: ({ listening }) => {
        torchDigitalTwin.setVoiceListening(listening);
        if (pttHwBtn) pttHwBtn.classList.toggle('active', listening);
        if (el.micBtn) {
          el.micBtn.classList.toggle('listening', listening);
          el.micBtn.setAttribute('aria-pressed', String(listening));
        }
        if (el.micStatus) el.micStatus.textContent = listening ? 'Listening...' : '';
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
        if (el.micBtn) {
          el.micBtn.classList.remove('listening');
          el.micBtn.setAttribute('aria-pressed', 'false');
        }
        if (el.micStatus) el.micStatus.textContent = '';
        if (pttHwBtn) pttHwBtn.classList.remove('active');
        torchDigitalTwin.setVoiceListening(false);
      }
    });

    if (!started && !speechHandler.supported) {
      showToast('Speech recognition not supported in this browser. Use text input or Chrome/Edge.', true);
    }
  }
}

/**
 * Manual Morse Tapper Key Logic (Pointer Events + Keyboard Space/Enter + Blur Safety)
 */
function initManualTapper() {
  let activeInput = null; // null | 'pointer' | 'keyboard'
  let activePointerId = null;

  const startTap = (source, pointerId = null) => {
    if (activeInput) return;
    activeInput = source;
    activePointerId = pointerId;
    sidetone.startTone();
    state.manualTapper.keyDownTime = Date.now();
    if (el.tapperKey) el.tapperKey.classList.add('pressed');
    opticalTransmitter.setOpticalState(true);

    if (state.manualTapper.pauseTimer) {
      clearTimeout(state.manualTapper.pauseTimer);
      state.manualTapper.pauseTimer = null;
    }
  };

  const endTap = (commitSymbol = true) => {
    if (!activeInput) return;
    const pointerToRelease = activePointerId;
    activeInput = null;
    activePointerId = null;

    if (pointerToRelease !== null && el.tapperKey && el.tapperKey.hasPointerCapture?.(pointerToRelease)) {
      try {
        el.tapperKey.releasePointerCapture(pointerToRelease);
      } catch (e) { }
    }

    sidetone.stopTone();
    if (el.tapperKey) el.tapperKey.classList.remove('pressed');
    opticalTransmitter.setOpticalState(false);

    if (!commitSymbol) return;

    const pressDuration = Date.now() - state.manualTapper.keyDownTime;
    // Dot vs Dash threshold: 1.8 * unitMs
    const threshold = state.unitMs * 1.8;
    const symbol = pressDuration < threshold ? '.' : '-';

    appendManualMorseSymbol(symbol);

    // After letter-gap pause (3.5 * unitMs), decode the letter
    state.manualTapper.pauseTimer = setTimeout(() => {
      completeManualLetter();
    }, state.unitMs * 3.5);
  };

  if (el.tapperKey) {
    el.tapperKey.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      e.preventDefault();
      if (activeInput) return;
      try {
        el.tapperKey.setPointerCapture(e.pointerId);
      } catch (err) { }
      startTap('pointer', e.pointerId);
    });

    el.tapperKey.addEventListener('pointerup', (e) => {
      if (activeInput !== 'pointer' || e.pointerId !== activePointerId) return;
      e.preventDefault();
      endTap(true);
    });

    el.tapperKey.addEventListener('pointercancel', (e) => {
      if (activeInput !== 'pointer' || e.pointerId !== activePointerId) return;
      endTap(false);
    });

    el.tapperKey.addEventListener('lostpointercapture', () => {
      if (activeInput === 'pointer') {
        endTap(false);
      }
    });

    el.tapperKey.addEventListener('keydown', (e) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault();
      if (e.repeat) return;
      startTap('keyboard');
    });

    el.tapperKey.addEventListener('keyup', (e) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault();
      if (activeInput === 'keyboard') {
        endTap(true);
      }
    });

    el.tapperKey.addEventListener('blur', () => {
      if (activeInput) endTap(false);
    });
  }

  // Prevent stuck tone/pressed state if window loses focus mid-keying
  window.addEventListener('blur', () => {
    if (activeInput) endTap(false);
  });

  // Discrete manual buttons (reset letter auto-commit timer cleanly)
  const scheduleManualLetterCommit = () => {
    if (state.manualTapper.pauseTimer) {
      clearTimeout(state.manualTapper.pauseTimer);
    }
    state.manualTapper.pauseTimer = setTimeout(() => {
      completeManualLetter();
    }, state.unitMs * 3.5);
  };

  if (el.dotBtn) {
    el.dotBtn.addEventListener('click', () => {
      sidetone.playPulse(state.unitMs);
      appendManualMorseSymbol('.');
      scheduleManualLetterCommit();
    });
  }

  if (el.dashBtn) {
    el.dashBtn.addEventListener('click', () => {
      sidetone.playPulse(state.unitMs * 3);
      appendManualMorseSymbol('-');
      scheduleManualLetterCommit();
    });
  }

  if (el.spaceLetterBtn) {
    el.spaceLetterBtn.addEventListener('click', () => {
      if (state.manualTapper.pauseTimer) {
        clearTimeout(state.manualTapper.pauseTimer);
        state.manualTapper.pauseTimer = null;
      }
      completeManualLetter();
    });
  }

  if (el.spaceWordBtn) {
    el.spaceWordBtn.addEventListener('click', () => {
      if (state.manualTapper.pauseTimer) {
        clearTimeout(state.manualTapper.pauseTimer);
        state.manualTapper.pauseTimer = null;
      }
      completeManualWord();
    });
  }

  if (el.backspaceManualBtn) {
    el.backspaceManualBtn.addEventListener('click', () => {
      if (state.manualTapper.pauseTimer) {
        clearTimeout(state.manualTapper.pauseTimer);
        state.manualTapper.pauseTimer = null;
      }
      if (state.manualTapper.currentLetterMorse.length > 0) {
        state.manualTapper.currentLetterMorse = state.manualTapper.currentLetterMorse.slice(0, -1);
      } else if (state.manualTapper.fullDecodedText.length > 0) {
        state.manualTapper.fullDecodedText = state.manualTapper.fullDecodedText.slice(0, -1);
      }
      syncManualBuffersUI();
    });
  }

  if (el.clearManualBtn) {
    el.clearManualBtn.addEventListener('click', () => {
      if (state.manualTapper.pauseTimer) {
        clearTimeout(state.manualTapper.pauseTimer);
        state.manualTapper.pauseTimer = null;
      }
      state.manualTapper.currentLetterMorse = '';
      state.manualTapper.fullDecodedText = '';
      syncManualBuffersUI();
    });
  }

  if (el.applyManualBtn) {
    el.applyManualBtn.addEventListener('click', () => {
      completeManualLetter();
      const decoded = state.manualTapper.fullDecodedText.trim();
      if (!decoded) {
        showToast('Key Morse symbols before importing to Transmit.', true);
        return;
      }
      if (el.textInput) el.textInput.value = decoded;
      handleTextInputChange(decoded);
      switchTab('input');
      showToast('Manual Morse imported to Transmit.');
    });
  }
}

function syncManualBuffersUI() {
  if (el.manualDecodedText) {
    el.manualDecodedText.textContent = state.manualTapper.fullDecodedText;
  }
  if (el.manualMorseBuffer) {
    const decodedMorse = textToMorse(state.manualTapper.fullDecodedText.trim());
    const trailingWordGap = state.manualTapper.fullDecodedText.endsWith(' ') && decodedMorse ? ' / ' : '';
    const sep = decodedMorse && !trailingWordGap && state.manualTapper.currentLetterMorse ? ' ' : '';
    el.manualMorseBuffer.textContent = `${decodedMorse}${trailingWordGap}${sep}${state.manualTapper.currentLetterMorse}`.trim();
  }
}

function appendManualMorseSymbol(sym) {
  state.manualTapper.currentLetterMorse += sym;
  syncManualBuffersUI();
}

function completeManualLetter() {
  if (!state.manualTapper.currentLetterMorse) return;
  const letter = morseToText(state.manualTapper.currentLetterMorse);
  state.manualTapper.fullDecodedText += letter;
  state.manualTapper.currentLetterMorse = '';
  syncManualBuffersUI();
}

function completeManualWord() {
  completeManualLetter();
  if (!state.manualTapper.fullDecodedText || state.manualTapper.fullDecodedText.endsWith(' ')) return;
  state.manualTapper.fullDecodedText += ' ';
  syncManualBuffersUI();
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
      if (el.transmissionProgress) el.transmissionProgress.setAttribute('aria-valuenow', String(pct));
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
      showToast('Optical transmission complete.');
    }
  });
}

/**
 * Hardware Transmission to ESP32 (Wi-Fi REST / Web Serial / Local Simulation)
 * Automatically falls back to local optical beacon if external hardware is unreachable.
 */
async function startHardwareTransmission() {
  if (!state.morseOutput) {
    showToast('Enter text or Morse code to transmit.', true);
    return;
  }

  setTransmissionUIState(true);
  if (el.progressLabel) el.progressLabel.textContent = 'Dispatching to ESP32 Hardware...';

  try {
    await esp32Service.transmitMorse(
      state.morseOutput,
      state.encodedText,
      state.unitMs,
      state.repeatCount
    );

    state.hardwareTxActive = true;
    showToast(`Transmission dispatched (${esp32Service.mode.toUpperCase()}).`);

    // Run synchronized on-screen optical visualization
    const timeline = generateOpticalTimeline(state.morseOutput, state.unitMs);
    opticalTransmitter.playSequence(timeline, {
      repeatCount: state.repeatCount,
      interCycleGapMs: Math.max(420, state.unitMs * 7),
      enableTorch: Boolean(el.torchToggle && el.torchToggle.checked),
      enableSound: state.audioSidetoneEnabled,
      enableFullscreenFlash: Boolean(el.fullscreenBeacon && el.fullscreenBeacon.classList.contains('active-screen')),
      onFrame: ({ elapsedMs, totalDurationMs, progress }) => {
        const pct = Math.min(100, Math.max(0, Math.round(progress * 100)));
        if (el.transmissionProgress) el.transmissionProgress.setAttribute('aria-valuenow', String(pct));
        if (el.progressBar) el.progressBar.style.transform = `scaleX(${progress})`;
        if (el.beaconProgressBar) el.beaconProgressBar.style.transform = `scaleX(${progress})`;
        if (el.beaconProgressPct) el.beaconProgressPct.textContent = `${pct}%`;
        if (el.beaconTelemElapsed) {
          el.beaconTelemElapsed.textContent = `${(elapsedMs / 1000).toFixed(2)}s / ${(totalDurationMs / 1000).toFixed(2)}s`;
        }
        if (el.progressLabel) el.progressLabel.textContent = `ESP32 Transmitting: ${pct}%`;
      },
      onComplete: () => {
        state.hardwareTxActive = false;
        setTransmissionUIState(false);
      }
    });

  } catch (err) {
    state.hardwareTxActive = false;
    setTransmissionUIState(false);

    // Resilient Multimodal Fallback (PRODUCT.md Principle 4): cascade to local optical beacon
    const channel = (el.torchToggle && el.torchToggle.checked) ? 'Camera Torch + Screen Beacon' : 'Local Screen Beacon';
    esp32Service.log(`Hardware unreachable (${err.message}). Falling back to ${channel}.`, 'warn');
    showToast(`ESP32 unreachable (${err.message}) — falling back to ${channel}.`, true);
    startLocalOpticalPlayback({ stayOnCurrentTab: true });
  }
}

/**
 * Emergency Stop — halts all local emitters, arming countdowns, and reports hardware stop failures honestly
 */
async function stopAllTransmission() {
  cancelFullscreenArmingCountdown();
  opticalTransmitter.stopSequence();
  sidetone.stopTone();
  if (el.breakdownContainer) {
    el.breakdownContainer.querySelectorAll('.breakdown-char.playing').forEach((n) => n.classList.remove('playing'));
  }

  const shouldNotifyHardware = state.hardwareTxActive || esp32Service.isTransmitting;
  state.hardwareTxActive = false;
  setTransmissionUIState(false);

  if (shouldNotifyHardware) {
    try {
      await esp32Service.stopTransmission();
      showToast('Transmission aborted.');
    } catch (err) {
      showToast(`CRITICAL: Local emitters stopped, but ESP32 /api/stop failed (${err.message}). Verify physical LED.`, true);
    }
  } else {
    showToast('Transmission aborted.');
  }
}

function setTransmissionUIState(isTransmitting) {
  if (isTransmitting) {
    if (el.transmissionProgress) el.transmissionProgress.classList.remove('hidden');
    if (el.stopTransmissionBtn) el.stopTransmissionBtn.disabled = false;
    if (el.playBeaconBtn) el.playBeaconBtn.disabled = true;
    if (el.transmitEsp32Btn) el.transmitEsp32Btn.disabled = true;
    if (el.beaconEsp32Btn) el.beaconEsp32Btn.disabled = true;
    if (el.presetsContainer) {
      el.presetsContainer.querySelectorAll('.preset-chip').forEach((chip) => { chip.disabled = true; });
    }

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
    if (el.transmissionProgress) {
      el.transmissionProgress.classList.add('hidden');
      el.transmissionProgress.setAttribute('aria-valuenow', '0');
    }
    if (el.stopTransmissionBtn) el.stopTransmissionBtn.disabled = true;
    if (el.playBeaconBtn) el.playBeaconBtn.disabled = false;
    if (el.transmitEsp32Btn) el.transmitEsp32Btn.disabled = false;
    if (el.beaconEsp32Btn) el.beaconEsp32Btn.disabled = false;
    if (el.presetsContainer) {
      el.presetsContainer.querySelectorAll('.preset-chip').forEach((chip) => { chip.disabled = false; });
    }

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
 * Fullscreen Optical Strobe Beacon (WCAG 2.3.1 safety gate, 2s arming countdown, focus trap & stop-on-exit)
 */
function setFullscreenStrobeMode(mode) {
  const safeMode = ['amber', 'white', 'none'].includes(mode) ? mode : 'amber';
  state.fullscreenStrobeMode = safeMode;
  opticalTransmitter.setFullscreenStrobeMode(safeMode);

  if (el.fsColorModeBtns) {
    el.fsColorModeBtns.forEach((btn) => {
      const active = btn.getAttribute('data-fs-color') === safeMode;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }

  if (el.fsBeaconColorBtn) {
    const labels = { amber: 'Mode: Amber', white: 'Mode: White', none: 'Mode: Safe' };
    el.fsBeaconColorBtn.textContent = labels[safeMode];
  }
}

function cancelFullscreenArmingCountdown() {
  if (state.fsArmingTimer) {
    clearInterval(state.fsArmingTimer);
    state.fsArmingTimer = null;
  }
  if (el.fsArmStrobeBtn) {
    el.fsArmStrobeBtn.textContent = 'Arm Beacon (2s)';
    el.fsArmStrobeBtn.disabled = false;
  }
}

function beginFullscreenArmingCountdown() {
  cancelFullscreenArmingCountdown();

  // Safe non-strobe mode needs no flash arming countdown
  if (state.fullscreenStrobeMode === 'none') {
    if (el.fsSafetyGate) el.fsSafetyGate.classList.add('hidden');
    opticalTransmitter.setFullscreenFlash(true, 'none');
    startLocalOpticalPlayback({ stayOnCurrentTab: true, forceFullscreenFlash: true });
    if (el.fsBeaconPlayBtn) el.fsBeaconPlayBtn.focus();
    return;
  }

  let remaining = 2;
  if (el.fsArmStrobeBtn) {
    el.fsArmStrobeBtn.disabled = true;
    el.fsArmStrobeBtn.textContent = `Arming in ${remaining}s...`;
  }
  if (el.stopTransmissionBtn) el.stopTransmissionBtn.disabled = false;

  state.fsArmingTimer = setInterval(() => {
    remaining--;
    if (remaining > 0) {
      if (el.fsArmStrobeBtn) el.fsArmStrobeBtn.textContent = `Arming in ${remaining}s...`;
      return;
    }

    cancelFullscreenArmingCountdown();
    if (!el.fullscreenBeacon || !el.fullscreenBeacon.classList.contains('active')) return;
    if (el.fsSafetyGate) el.fsSafetyGate.classList.add('hidden');
    opticalTransmitter.setFullscreenFlash(true, state.fullscreenStrobeMode);
    startLocalOpticalPlayback({ stayOnCurrentTab: true, forceFullscreenFlash: true });
    if (el.fsBeaconPlayBtn) el.fsBeaconPlayBtn.focus();
  }, 1000);
}

function toggleFullscreenBeacon() {
  if (!el.fullscreenBeacon) return;
  if (!state.morseOutput) {
    showToast('Enter a message first to launch Fullscreen Beacon.', true);
    return;
  }

  state.fsLastFocused = document.activeElement;
  cancelFullscreenArmingCountdown();

  // Pause any running sequence until operator confirms the safety gate
  if (opticalTransmitter.isPlaying) {
    opticalTransmitter.stopSequence();
    setTransmissionUIState(false);
  }

  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const flashHz = (1000 / (state.unitMs * 2)).toFixed(2);
  const exceedsWcag = parseFloat(flashHz) > 3.0;

  // Default to safe non-strobe when reduced-motion is enabled and rate exceeds 3 Hz; otherwise Night-Vision Amber
  setFullscreenStrobeMode(reducedMotion && exceedsWcag ? 'none' : 'amber');

  if (el.fsSafetyDesc) {
    el.fsSafetyDesc.textContent = exceedsWcag
      ? `At ${state.wpm} WPM, full-screen strobing flashes up to ${flashHz} Hz (above the 3 Hz photosensitive threshold). Select Night-Vision Amber, White, or No Strobe before arming.`
      : `At ${state.wpm} WPM, maximum flash rate is ${flashHz} Hz. Choose Night-Vision Amber, White, or No Strobe before arming.`;
  }

  if (el.fsReducedMotionNote) {
    el.fsReducedMotionNote.classList.toggle('hidden', !reducedMotion);
  }

  if (el.fsSafetyGate) {
    el.fsSafetyGate.classList.remove('hidden');
  }

  el.fullscreenBeacon.classList.add('active', 'active-screen');
  opticalTransmitter.setFullscreenFlash(false, state.fullscreenStrobeMode);

  if (el.fsBeaconPayload) el.fsBeaconPayload.textContent = state.encodedText || 'OPTICAL BEACON';
  if (el.fsBeaconMorse) el.fsBeaconMorse.textContent = state.morseOutput;

  el.fullscreenBeacon.requestFullscreen?.().catch(() => {
    document.documentElement.requestFullscreen?.().catch(() => { });
  });

  // Move focus into the dialog cleanly
  requestAnimationFrame(() => {
    if (el.fsArmStrobeBtn) el.fsArmStrobeBtn.focus();
  });
}

function exitFullscreenBeacon() {
  if (!el.fullscreenBeacon) return;
  cancelFullscreenArmingCountdown();

  // Stop active playback on exit so audio/torch never keep running invisibly
  if (opticalTransmitter.isPlaying || state.hardwareTxActive) {
    opticalTransmitter.stopSequence();
    sidetone.stopTone();
    state.hardwareTxActive = false;
    setTransmissionUIState(false);
  }

  el.fullscreenBeacon.classList.remove('active', 'active-screen', 'flash-on', 'flash-amber');
  if (el.fsSafetyGate) el.fsSafetyGate.classList.add('hidden');
  opticalTransmitter.setFullscreenFlash(false);

  if (document.fullscreenElement) {
    document.exitFullscreen?.().catch(() => { });
  }

  if (state.fsLastFocused && typeof state.fsLastFocused.focus === 'function') {
    state.fsLastFocused.focus();
    state.fsLastFocused = null;
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

  const isWifi = esp32Service.mode === 'wifi';
  const isSerial = esp32Service.mode === 'serial';
  if (el.connectSerialBtn) {
    el.connectSerialBtn.classList.toggle('hidden', !isSerial);
  }
  [el.esp32IpInput, el.esp32PortInput, el.useProxyCheck].forEach((inputEl) => {
    const group = inputEl ? inputEl.closest('.form-group') : null;
    if (group) group.classList.toggle('hidden', !isWifi);
  });

  if (el.hardwareStatusBadge && el.hardwareStatusText) {
    if (esp32Service.mode === 'simulation') {
      el.hardwareStatusBadge.className = 'status-badge sim';
      el.hardwareStatusText.textContent = 'SYS.SIMULATED';
    } else if (esp32Service.isConnected) {
      el.hardwareStatusBadge.className = 'status-badge online';
      el.hardwareStatusText.textContent = 'SYS.ONLINE';
    } else {
      el.hardwareStatusBadge.className = 'status-badge standby';
      el.hardwareStatusText.textContent = 'SYS.STANDBY';
    }
  }

  // Sync Signal Routing Path diagram on Transmit workspace
  if (el.routingBridgeLabel) {
    const bridgeMap = {
      simulation: 'BRIDGE [UART]',
      serial: 'BRIDGE [UART]',
      wifi: 'BRIDGE [HTTP]'
    };
    el.routingBridgeLabel.textContent = bridgeMap[esp32Service.mode] || 'BRIDGE [UART]';
  }

  if (el.routingLinkStatus && el.routingLinkText) {
    if (esp32Service.mode === 'simulation' || esp32Service.isConnected) {
      el.routingLinkStatus.className = 'routing-link-status online';
      el.routingLinkText.textContent = 'LINK ONLINE';
    } else {
      el.routingLinkStatus.className = 'routing-link-status standby';
      el.routingLinkText.textContent = 'LINK STANDBY';
    }
  }
}

function showToast(message, isError = false) {
  const container = el.toastRegion || document.body;
  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'error' : 'success'}`;
  toast.setAttribute('role', isError ? 'alert' : 'status');

  const textSpan = document.createElement('span');
  textSpan.className = 'toast-message';
  textSpan.textContent = message;
  toast.appendChild(textSpan);

  const dismiss = () => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 260);
  };

  if (isError) {
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'toast-close-btn';
    closeBtn.setAttribute('aria-label', 'Dismiss alert');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', dismiss);
    toast.appendChild(closeBtn);
  }

  container.appendChild(toast);

  // Cap visible stack to 4 notifications
  while (container.children.length > 4) {
    container.firstElementChild.remove();
  }

  requestAnimationFrame(() => toast.classList.add('show'));
  const timeoutMs = isError ? 6500 : 3400;
  setTimeout(dismiss, timeoutMs);
}

// Log listener from ESP32 service (strictly textContent — zero innerHTML XSS)
esp32Service.onLogMessage = (entry) => {
  if (!el.activityLog) return;
  const row = document.createElement('div');
  row.className = `log-row ${entry.type || 'info'}`;

  const timeSpan = document.createElement('span');
  timeSpan.className = 'log-time';
  timeSpan.textContent = `[${entry.timestamp}]`;

  const textSpan = document.createElement('span');
  textSpan.className = 'log-text';
  textSpan.textContent = ` ${entry.text}`;

  row.appendChild(timeSpan);
  row.appendChild(textSpan);
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
  el.missionClockDisplay.textContent = `${utcHours}:${utcMins}:${utcSecs} UTC`;
}

function updateViewportCalibrationSpec() {
  if (!el.footerViewportSpec) return;
  el.footerViewportSpec.textContent = `${window.innerWidth} × ${window.innerHeight} CALIBRATED`;
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initDOMElements();
  initEventListeners();

  // Restore persisted calibrated settings from localStorage
  if (el.adaptiveToggle) {
    state.adaptiveSemanticEnabled = el.adaptiveToggle.checked;
  }
  const savedSound = localStorage.getItem('optix_sound');
  if (el.soundToggle) {
    if (savedSound !== null) el.soundToggle.checked = savedSound === 'true';
    state.audioSidetoneEnabled = el.soundToggle.checked;
    sidetone.setEnabled(state.audioSidetoneEnabled);
  }
  const savedPitch = parseInt(localStorage.getItem('optix_pitch') || '', 10);
  if (el.pitchSlider) {
    const pitch = Number.isFinite(savedPitch) ? Math.max(300, Math.min(1500, savedPitch)) : (parseInt(el.pitchSlider.value, 10) || 750);
    el.pitchSlider.value = String(pitch);
    sidetone.setFrequency(pitch);
    if (el.pitchValue) el.pitchValue.textContent = `${pitch} Hz`;
    if (el.soundSubLabel) el.soundSubLabel.textContent = `CW audio tone · ${pitch} Hz`;
  }
  const savedWpm = parseInt(localStorage.getItem('optix_wpm') || '', 10);
  const initialWpm = Number.isFinite(savedWpm) ? savedWpm : (el.wpmSlider ? parseInt(el.wpmSlider.value, 10) : state.wpm);
  setWpm(initialWpm);

  const savedRepeat = parseInt(localStorage.getItem('optix_repeat') || '', 10);
  const initialRepeat = Number.isFinite(savedRepeat) ? savedRepeat : (el.repeatSelect ? parseInt(el.repeatSelect.value, 10) : state.repeatCount);
  setRepeatCount(initialRepeat);

  esp32Service.init();
  updateHardwareUI();

  // Reflect network connectivity on cloud speech dictation control
  const syncVoiceOnlineState = () => {
    if (!el.micBtn) return;
    const offline = navigator.onLine === false;
    el.micBtn.title = offline
      ? 'Voice Dictation (offline — cloud speech API unavailable; type or key manually)'
      : 'Voice Dictation';
    if (offline && el.micStatus && !speechHandler.isListening) {
      el.micStatus.textContent = 'Offline (text/key ready)';
    } else if (!offline && el.micStatus && el.micStatus.textContent === 'Offline (text/key ready)') {
      el.micStatus.textContent = '';
    }
  };
  syncVoiceOnlineState();
  window.addEventListener('online', syncVoiceOnlineState);
  window.addEventListener('offline', syncVoiceOnlineState);

  // Start live mission clock & viewport calibration spec
  updateMissionClock();
  setInterval(updateMissionClock, 1000);
  updateViewportCalibrationSpec();
  window.addEventListener('resize', updateViewportCalibrationSpec);

  // Periodic Wi-Fi hardware heartbeat so ONLINE status never goes stale if ESP32 resets
  setInterval(async () => {
    if (document.visibilityState !== 'visible') return;
    if (esp32Service.mode !== 'wifi' || !esp32Service.isConnected) return;
    try {
      await esp32Service.getStatus();
    } catch (err) {
      esp32Service.isConnected = false;
      updateHardwareUI();
      if (el.hardwareStatusBadge && el.hardwareStatusText) {
        el.hardwareStatusBadge.className = 'status-badge offline';
        el.hardwareStatusText.textContent = 'SYS.FAULT';
      }
      if (el.routingLinkStatus && el.routingLinkText) {
        el.routingLinkStatus.className = 'routing-link-status offline';
        el.routingLinkText.textContent = 'LINK FAULT';
      }
      esp32Service.log(`Wi-Fi heartbeat lost: ${err.message}`, 'warn');
    }
  }, 15000);

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
