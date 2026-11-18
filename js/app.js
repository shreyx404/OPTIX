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

// DOM Element cache
const el = {};

// Application State
const state = {
  currentInputMode: 'text', // 'text' | 'voice' | 'manual'
  rawText: '',
  morseOutput: '',
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

  // Initialize Optical Transmitter with DOM elements
  opticalTransmitter.init({
    beaconEl: el.beaconBulb,
    canvasEl: el.waveformCanvas,
    fullscreenBeaconEl: el.fullscreenBeacon
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

  // Sliders
  if (el.wpmSlider) {
    el.wpmSlider.addEventListener('input', (e) => {
      const wpm = parseInt(e.target.value, 10);
      state.wpm = wpm;
      state.unitMs = wpmToUnitMs(wpm);
      if (el.wpmValue) el.wpmValue.textContent = `${wpm} WPM`;
      if (el.unitMsDisplay) el.unitMsDisplay.textContent = `${state.unitMs} ms / dot`;
      updateCalculationsAndWaveform();
    });
  }

  if (el.pitchSlider) {
    el.pitchSlider.addEventListener('input', (e) => {
      const pitch = parseInt(e.target.value, 10);
      sidetone.setFrequency(pitch);
      if (el.pitchValue) el.pitchValue.textContent = `${pitch} Hz`;
    });
  }

  if (el.soundToggle) {
    el.soundToggle.addEventListener('change', (e) => {
      state.audioSidetoneEnabled = e.target.checked;
      sidetone.setEnabled(e.target.checked);
    });
  }

  if (el.repeatSelect) {
    el.repeatSelect.addEventListener('change', (e) => {
      state.repeatCount = parseInt(e.target.value, 10);
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

  // Play Beacon locally on screen/torch
  if (el.playBeaconBtn) {
    el.playBeaconBtn.addEventListener('click', startLocalOpticalPlayback);
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
          showToast('Camera flash torch not supported on this device/browser');
        } else {
          showToast('Camera torch armed for optical transmission');
        }
      } else {
        await opticalTransmitter.releaseTorch();
      }
    });
  }

  if (el.fullscreenToggle) {
    el.fullscreenToggle.addEventListener('click', toggleFullscreenBeacon);
  }
  if (el.fullscreenBeacon) {
    el.fullscreenBeacon.addEventListener('click', exitFullscreenBeacon);
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
  renderPresets();
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
function handleTextInputChange(inputText) {
  state.rawText = inputText;
  let textToEncode = inputText;

  if (el.charCounter) {
    el.charCounter.textContent = `${inputText.length} chars`;
  }

  // Semantic Contraction
  if (state.adaptiveSemanticEnabled && inputText.trim()) {
    const comp = applySemanticCompression(inputText);
    if (comp.savingsPercent > 0 && comp.compressed !== inputText.toUpperCase()) {
      textToEncode = comp.compressed;
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
  state.morseOutput = textToMorse(textToEncode);
  renderMorseOutput(state.morseOutput, textToEncode);
  updateCalculationsAndWaveform();
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
 * Recalculate metrics and redraw timeline
 */
function updateCalculationsAndWaveform() {
  const metrics = calculateMorseUnits(state.morseOutput);
  const durationSec = ((metrics.totalUnits * state.unitMs) / 1000).toFixed(2);

  if (el.statUnits) el.statUnits.textContent = metrics.totalUnits;
  if (el.statDuration) el.statDuration.textContent = `${durationSec}s`;
  if (el.statChars) el.statChars.textContent = metrics.charCount;
  if (el.statWpm) el.statWpm.textContent = state.wpm;

  // Render optical timeline canvas
  const timeline = generateOpticalTimeline(state.morseOutput, state.unitMs);
  opticalTransmitter.drawTimeline(timeline, -1);
}

/**
 * Voice Input using Web Speech API
 */
function toggleVoiceRecognition() {
  if (speechHandler.isListening) {
    speechHandler.stop();
    if (el.micBtn) el.micBtn.classList.remove('listening');
    if (el.micStatus) el.micStatus.textContent = '';
  } else {
    const started = speechHandler.start({
      onStatus: ({ listening }) => {
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
 * Local Optical Beacon Playback (Screen + Mobile Camera Flash + Audio)
 */
function startLocalOpticalPlayback() {
  if (!state.morseOutput) {
    showToast('Please enter text or Morse code first!', true);
    return;
  }

  const timeline = generateOpticalTimeline(state.morseOutput, state.unitMs);
  if (timeline.length === 0) return;

  switchTab('beacon');
  setTransmissionUIState(true);

  opticalTransmitter.playSequence(timeline, {
    enableTorch: Boolean(el.torchToggle && el.torchToggle.checked),
    enableSound: state.audioSidetoneEnabled,
    enableFullscreenFlash: Boolean(el.fullscreenBeacon && el.fullscreenBeacon.classList.contains('active-screen')),
    onProgress: ({ currentIndex, totalItems }) => {
      const pct = Math.round((currentIndex / totalItems) * 100);
      if (el.progressBar) el.progressBar.style.transform = `scaleX(${pct / 100})`;
      if (el.progressLabel) el.progressLabel.textContent = `Emitting Optical Signal: ${pct}%`;
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
      enableTorch: Boolean(el.torchToggle && el.torchToggle.checked),
      enableSound: state.audioSidetoneEnabled,
      onProgress: ({ currentIndex, totalItems }) => {
        const pct = Math.round((currentIndex / totalItems) * 100);
        if (el.progressBar) el.progressBar.style.transform = `scaleX(${pct / 100})`;
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
  } else {
    if (el.transmissionProgress) el.transmissionProgress.classList.add('hidden');
    if (el.stopTransmissionBtn) el.stopTransmissionBtn.disabled = true;
    if (el.playBeaconBtn) el.playBeaconBtn.disabled = false;
    if (el.transmitEsp32Btn) el.transmitEsp32Btn.disabled = false;
    if (el.progressBar) el.progressBar.style.transform = 'scaleX(0)';
  }
}

/**
 * Fullscreen strobe beacon
 */
function toggleFullscreenBeacon() {
  if (!el.fullscreenBeacon) return;
  el.fullscreenBeacon.classList.add('active');
  el.fullscreenBeacon.classList.add('active-screen');
  document.documentElement.requestFullscreen?.().catch(() => {});
  showToast('Fullscreen Optical Beacon Active. Tap anywhere to exit.');
}

function exitFullscreenBeacon() {
  if (!el.fullscreenBeacon) return;
  el.fullscreenBeacon.classList.remove('active');
  el.fullscreenBeacon.classList.remove('active-screen');
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

  // Sync state with DOM checkbox state (in case browser restored it on reload)
  if (el.adaptiveToggle) {
    state.adaptiveSemanticEnabled = el.adaptiveToggle.checked;
  }

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

  // Sidetone unlock on first user gesture
  const unlockAudio = () => {
    sidetone.init();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('touchstart', unlockAudio);
});
