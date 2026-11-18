/**
 * OPTIX - Optical Signal & Beacon Controller
 * Handles Screen Optical Beacon, Calibrated Canvas Oscilloscope, Repeat/Loop Bursts,
 * Interactive Waveform Scrubbing, and Mobile Camera Flashlight (Torch)
 */

import { sidetone } from './audioSidetone.js';

class OpticalTransmitter {
  constructor() {
    this.beaconEl = null;
    this.canvasEl = null;
    this.ctx = null;
    this.canvases = []; // Supports primary oscilloscope + synced Transmit preview trace
    this.mediaStream = null;
    this.videoTrack = null;
    this.torchSupported = false;
    this.torchActive = false;

    this.isPlaying = false;
    this.isManualTest = false;
    this.currentIndex = -1;
    this.timeline = [];
    this.totalDurationMs = 0;
    this.stepStartTime = 0;
    this.stepElapsedBeforeCurrent = 0;
    this._cycleAnchorTime = 0;

    this.repeatCount = 1;
    this.currentCycle = 1;
    this.interCycleGapMs = 600;
    this.inInterCycleGap = false;

    this.timerId = null;
    this.rafId = null;
    this.onProgressCallback = null;
    this.onFrameCallback = null;
    this.onCompleteCallback = null;
    this.onSeekCallback = null;

    this.fullscreenBeaconEl = null;
    this.enableFullscreenFlash = false;
    this.fullscreenStrobeMode = 'amber'; // 'amber' (night-vision) | 'white' (max luminance) | 'none' (reduced-motion safe)
    this.enableTorch = false;
    this.enableSound = true;
    this.stateListeners = new Set();

    // Cached logical canvas dimensions to avoid 60fps getBoundingClientRect() layout queries
    this._canvasWidth = 0;
    this._canvasHeight = 0;

    // Interactive oscilloscope hover & keyboard inspection state
    this.hoverIndex = -1;
    this.hoverX = -1;
    this._canvasBound = false;
  }

  addStateListener(fn) {
    if (typeof fn === 'function') {
      this.stateListeners.add(fn);
    }
    return () => this.stateListeners.delete(fn);
  }

  init({ beaconEl, canvasEl, previewCanvasEl, fullscreenBeaconEl, onSeek } = {}) {
    this.beaconEl = beaconEl;
    this.canvasEl = canvasEl;
    this.fullscreenBeaconEl = fullscreenBeaconEl;
    if (typeof onSeek === 'function') {
      this.onSeekCallback = onSeek;
    }

    const targets = [canvasEl, previewCanvasEl].filter(Boolean);
    this.canvases = targets.map((el) => ({
      el,
      ctx: el.getContext('2d'),
      width: 0,
      height: 0,
      hoverIndex: -1,
      hoverX: -1
    }));

    if (this.canvases.length > 0) {
      this.ctx = this.canvases[0].ctx;
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());

      this.canvases.forEach((entry) => {
        if (window.ResizeObserver && entry.el.parentElement) {
          const ro = new ResizeObserver(() => this.resizeCanvas());
          ro.observe(entry.el.parentElement);
        }
        this._bindCanvasInteraction(entry);
      });
      this._canvasBound = true;
    }

    this.checkTorchSupport();
  }

  _bindCanvasInteraction(entry) {
    const canvas = entry.el;
    if (!canvas) return;

    const getIndexAtX = (clientX) => {
      if (!this.timeline || this.timeline.length === 0 || this.totalDurationMs <= 0) return -1;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0) return -1;
      const relX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const targetMs = (relX / rect.width) * this.totalDurationMs;

      let acc = 0;
      for (let i = 0; i < this.timeline.length; i++) {
        acc += this.timeline[i].durationMs;
        if (targetMs <= acc) {
          return i;
        }
      }
      return this.timeline.length - 1;
    };

    canvas.addEventListener('mousemove', (e) => {
      if (!this.timeline || this.timeline.length === 0) return;
      const rect = canvas.getBoundingClientRect();
      entry.hoverX = e.clientX - rect.left;
      entry.hoverIndex = getIndexAtX(e.clientX);
      if (!this.isPlaying) {
        this.drawTimeline(this.timeline, this.currentIndex);
      }
    });

    canvas.addEventListener('mouseleave', () => {
      entry.hoverIndex = -1;
      entry.hoverX = -1;
      if (!this.isPlaying) {
        this.drawTimeline(this.timeline, this.currentIndex);
      }
    });

    canvas.addEventListener('click', (e) => {
      const idx = getIndexAtX(e.clientX);
      if (idx < 0) return;
      if (this.onSeekCallback) {
        this.onSeekCallback(idx, this.timeline[idx]);
      }
    });

    // Keyboard inspection & seek parity (ArrowLeft / ArrowRight / Home / End / Enter / Space)
    canvas.addEventListener('keydown', (e) => {
      if (!this.timeline || this.timeline.length === 0) return;
      const len = this.timeline.length;
      let nextIdx = entry.hoverIndex;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextIdx = nextIdx < 0 ? 0 : Math.min(len - 1, nextIdx + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        nextIdx = nextIdx < 0 ? len - 1 : Math.max(0, nextIdx - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIdx = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIdx = len - 1;
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const seekIdx = entry.hoverIndex >= 0 ? entry.hoverIndex : 0;
        if (this.onSeekCallback) {
          this.onSeekCallback(seekIdx, this.timeline[seekIdx]);
        }
        return;
      } else {
        return;
      }

      entry.hoverIndex = nextIdx;
      const width = entry.width || canvas.getBoundingClientRect().width || 1;
      const elapsedBefore = this._getElapsedBeforeIndex(nextIdx);
      const item = this.timeline[nextIdx];
      entry.hoverX = this.totalDurationMs > 0
        ? ((elapsedBefore + item.durationMs / 2) / this.totalDurationMs) * width
        : 0;
      this.drawTimeline(this.timeline, this.currentIndex);
    });

    canvas.addEventListener('blur', () => {
      if (entry.hoverIndex !== -1) {
        entry.hoverIndex = -1;
        entry.hoverX = -1;
        if (!this.isPlaying) {
          this.drawTimeline(this.timeline, this.currentIndex);
        }
      }
    });
  }

  resizeCanvas() {
    if (!this.canvases || this.canvases.length === 0) return;
    const dpr = window.devicePixelRatio || 1;
    let resizedAny = false;

    this.canvases.forEach((entry) => {
      const rect = entry.el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      entry.width = rect.width;
      entry.height = rect.height;
      entry.el.width = Math.round(rect.width * dpr);
      entry.el.height = Math.round(rect.height * dpr);
      if (entry.ctx) {
        entry.ctx.setTransform(1, 0, 0, 1, 0, 0);
        entry.ctx.scale(dpr, dpr);
      }
      resizedAny = true;
    });

    if (resizedAny) {
      this.drawTimeline(this.timeline, this.currentIndex, this._getSmoothElapsedMs());
    }
  }

  /**
   * Check if mobile device supports camera torch (flash)
   */
  async checkTorchSupport() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.torchSupported = false;
      return false;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some(d => d.kind === 'videoinput');
      return hasCamera;
    } catch (e) {
      console.warn('Torch check warning:', e);
      return false;
    }
  }

  /**
   * Initialize and request permission for the physical camera LED torch
   */
  async initTorch() {
    if (this.videoTrack && this.torchSupported) return true;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }
        }
      });
      const tracks = this.mediaStream.getVideoTracks();
      if (tracks.length > 0) {
        this.videoTrack = tracks[0];
        const capabilities = this.videoTrack.getCapabilities ? this.videoTrack.getCapabilities() : {};
        if (capabilities.torch) {
          this.torchSupported = true;
          return true;
        }
      }
      this.torchSupported = false;
      return false;
    } catch (err) {
      console.warn('Camera flash not accessible:', err.message);
      this.torchSupported = false;
      return false;
    }
  }

  async releaseTorch() {
    if (this.videoTrack) {
      try {
        await this.videoTrack.applyConstraints({ advanced: [{ torch: false }] });
      } catch (e) {}
      this.videoTrack.stop();
      this.videoTrack = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
  }

  /**
   * Dynamically toggle fullscreen strobe overlay flashing even mid-transmission
   */
  setFullscreenFlash(enabled, strobeMode = null) {
    this.enableFullscreenFlash = Boolean(enabled);
    if (strobeMode) {
      this.fullscreenStrobeMode = strobeMode;
    }
    if (!this.enableFullscreenFlash && this.fullscreenBeaconEl) {
      this.fullscreenBeaconEl.classList.remove('flash-on', 'flash-amber');
    }
  }

  setFullscreenStrobeMode(strobeMode) {
    this.fullscreenStrobeMode = strobeMode || 'amber';
    if (this.fullscreenBeaconEl) {
      this.fullscreenBeaconEl.classList.remove('flash-on', 'flash-amber');
    }
  }

  /**
   * Dynamically toggle sound or torch mid-transmission
   */
  setLiveOptions({ enableSound, enableTorch } = {}) {
    if (typeof enableSound === 'boolean') {
      this.enableSound = enableSound;
      if (!enableSound) sidetone.stopTone();
    }
    if (typeof enableTorch === 'boolean') {
      this.enableTorch = enableTorch;
      if (!enableTorch && this.videoTrack && this.torchSupported) {
        try {
          this.videoTrack.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
        } catch (e) {}
      }
    }
  }

  /**
   * Compute waveform telemetry (duty cycle, pulse counts, total duration)
   */
  getTimelineStats(timeline = this.timeline) {
    if (!timeline || timeline.length === 0) {
      return {
        totalDurationMs: 0,
        highDurationMs: 0,
        dutyCyclePct: 0,
        dotCount: 0,
        dashCount: 0
      };
    }

    let totalDurationMs = 0;
    let highDurationMs = 0;
    let dotCount = 0;
    let dashCount = 0;

    for (const item of timeline) {
      totalDurationMs += item.durationMs;
      if (item.state) {
        highDurationMs += item.durationMs;
        if (item.type === 'dot') dotCount++;
        else if (item.type === 'dash') dashCount++;
      }
    }

    const dutyCyclePct = totalDurationMs > 0
      ? Math.round((highDurationMs / totalDurationMs) * 1000) / 10
      : 0;

    return { totalDurationMs, highDurationMs, dutyCyclePct, dotCount, dashCount };
  }

  /**
   * Set optical physical state (LED / Torch / Screen Beacon)
   */
  setOpticalState(isOn, meta = null) {
    const active = Boolean(isOn);

    // 1. On-Screen Beacon Bulb
    if (this.beaconEl) {
      this.beaconEl.classList.toggle('active', active);
    }

    // 2. Fullscreen flash overlay (if enabled & not in reduced-motion non-strobe mode)
    if (this.fullscreenBeaconEl && this.enableFullscreenFlash && this.fullscreenStrobeMode !== 'none') {
      const useAmber = this.fullscreenStrobeMode === 'amber';
      this.fullscreenBeaconEl.classList.toggle('flash-amber', active && useAmber);
      this.fullscreenBeaconEl.classList.toggle('flash-on', active && !useAmber);
    } else if (this.fullscreenBeaconEl) {
      this.fullscreenBeaconEl.classList.remove('flash-on', 'flash-amber');
    }

    // 3. Audio Sidetone
    if (this.enableSound) {
      if (active) {
        sidetone.startTone();
      } else {
        sidetone.stopTone();
      }
    }

    // 4. Physical Mobile Camera Torch
    if (this.enableTorch && this.videoTrack && this.torchSupported) {
      try {
        this.videoTrack.applyConstraints({ advanced: [{ torch: active }] }).catch(() => {});
      } catch (e) {}
    }

    // 5. Notify Digital Twin & external visualizers
    this.stateListeners.forEach((listener) => {
      try {
        listener(active, meta);
      } catch (e) {}
    });
  }

  /**
   * Manual test pulse (press & hold on the emitter bulb)
   */
  setManualPulse(isOn, { enableTorch = false, enableSound = true } = {}) {
    if (isOn) {
      if (this.isPlaying) {
        this.stopSequence();
      }
      this.isManualTest = true;
      this.enableTorch = Boolean(enableTorch);
      this.enableSound = Boolean(enableSound);
      this.setOpticalState(true, { manual: true, type: 'manual' });
    } else if (this.isManualTest) {
      this.isManualTest = false;
      this.setOpticalState(false, { manual: false, type: 'idle' });
    }
  }

  /**
   * Transmit an optical timeline sequence locally on the device
   */
  playSequence(timeline, options = {}) {
    this.stopSequence();
    if (!timeline || timeline.length === 0) return;

    this.timeline = timeline;
    this.totalDurationMs = timeline.reduce((sum, item) => sum + item.durationMs, 0);
    this.isPlaying = true;
    this.isManualTest = false;
    this.inInterCycleGap = false;

    const startIdx = Math.max(0, Math.min(timeline.length - 1, Number(options.startIndex) || 0));
    this.currentIndex = startIdx;
    this.repeatCount = Math.max(1, Number(options.repeatCount) || 1);
    this.currentCycle = 1;
    this.interCycleGapMs = Math.max(420, Number(options.interCycleGapMs) || 560);

    this.onProgressCallback = options.onProgress || null;
    this.onFrameCallback = options.onFrame || null;
    this.onCompleteCallback = options.onComplete || null;
    this.enableTorch = Boolean(options.enableTorch);
    this.enableSound = options.enableSound !== false;
    this.enableFullscreenFlash = Boolean(options.enableFullscreenFlash);
    this._cycleAnchorTime = performance.now() - this._getElapsedBeforeIndex(startIdx);

    this._startAnimationLoop();
    this.stepTimeline();
  }

  _getElapsedBeforeIndex(idx) {
    let sum = 0;
    for (let i = 0; i < idx && i < this.timeline.length; i++) {
      sum += this.timeline[i].durationMs;
    }
    return sum;
  }

  _getSmoothElapsedMs() {
    if (!this.isPlaying) return -1;
    if (this.inInterCycleGap) return this.totalDurationMs;
    if (this.currentIndex < 0 || this.currentIndex >= this.timeline.length) return -1;
    const item = this.timeline[this.currentIndex];
    const inStep = Math.min(item.durationMs, Math.max(0, performance.now() - this.stepStartTime));
    return Math.min(this.totalDurationMs, this.stepElapsedBeforeCurrent + inStep);
  }

  _startAnimationLoop() {
    if (this.rafId) cancelAnimationFrame(this.rafId);

    const tick = () => {
      if (!this.isPlaying) {
        this.rafId = null;
        return;
      }

      const elapsedMs = this._getSmoothElapsedMs();
      this.drawTimeline(this.timeline, this.inInterCycleGap ? -1 : this.currentIndex, elapsedMs);

      if (this.onFrameCallback && this.totalDurationMs > 0) {
        const clamped = Math.max(0, Math.min(this.totalDurationMs, elapsedMs));
        this.onFrameCallback({
          elapsedMs: clamped,
          totalDurationMs: this.totalDurationMs,
          progress: clamped / this.totalDurationMs,
          cycle: this.currentCycle,
          repeatCount: this.repeatCount,
          inInterCycleGap: this.inInterCycleGap
        });
      }

      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  stepTimeline() {
    if (!this.isPlaying) return;

    if (this.currentIndex >= this.timeline.length) {
      const isInfinite = this.repeatCount >= 999;
      if (isInfinite || this.currentCycle < this.repeatCount) {
        this.inInterCycleGap = true;
        this.setOpticalState(false, { type: 'cycleGap', cycle: this.currentCycle, repeatCount: this.repeatCount });

        this.timerId = setTimeout(() => {
          if (!this.isPlaying) return;
          this.inInterCycleGap = false;
          this.currentCycle++;
          this.currentIndex = 0;
          this._cycleAnchorTime = performance.now();
          this.stepTimeline();
        }, this.interCycleGapMs);
        return;
      }

      const doneCb = this.onCompleteCallback;
      this.stopSequence();
      if (doneCb) doneCb();
      return;
    }

    const item = this.timeline[this.currentIndex];
    this.stepStartTime = performance.now();
    this.stepElapsedBeforeCurrent = this._getElapsedBeforeIndex(this.currentIndex);

    this.setOpticalState(item.state, {
      type: item.type,
      symbol: item.symbol || '',
      durationMs: item.durationMs,
      index: this.currentIndex,
      totalItems: this.timeline.length,
      cycle: this.currentCycle,
      repeatCount: this.repeatCount
    });

    if (this.onProgressCallback) {
      this.onProgressCallback({
        currentIndex: this.currentIndex,
        totalItems: this.timeline.length,
        item,
        cycle: this.currentCycle,
        repeatCount: this.repeatCount
      });
    }

    // Drift-compensated monotonic scheduling relative to cycle start
    const targetEndTime = this._cycleAnchorTime + this.stepElapsedBeforeCurrent + item.durationMs;
    const delayMs = Math.max(0, Math.round(targetEndTime - performance.now()));
    this.timerId = setTimeout(() => {
      this.currentIndex++;
      this.stepTimeline();
    }, delayMs);
  }

  stopSequence() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.isPlaying = false;
    this.isManualTest = false;
    this.inInterCycleGap = false;
    this.currentIndex = -1;
    this.setOpticalState(false, { type: 'idle' });
    this.drawTimeline(this.timeline, -1, -1);
  }

  /**
   * Render the calibrated digital pulse oscilloscope on canvas
   * Swiss Purism light-mode TTL instrument oscilloscope with fine graticule,
   * voltage rails, dot/dash glyph markers, time ticks, smooth playhead, and hover inspector
   */
  drawTimeline(timeline, activeIdx = -1, smoothElapsedMs = -1) {
    if (timeline) {
      this.timeline = timeline;
      this.totalDurationMs = timeline.reduce((sum, item) => sum + item.durationMs, 0);
    }
    if (!this.canvases || this.canvases.length === 0) return;

    const rootStyles = window.getComputedStyle ? getComputedStyle(document.documentElement) : null;
    const accentPrimary = (rootStyles && rootStyles.getPropertyValue('--accent-primary').trim()) || '#111111';
    const accentDanger = (rootStyles && rootStyles.getPropertyValue('--accent-danger').trim()) || '#d92d20';
    const textPrimary = (rootStyles && rootStyles.getPropertyValue('--text-primary').trim()) || '#111111';
    const textMuted = (rootStyles && rootStyles.getPropertyValue('--text-muted').trim()) || '#666666';

    this.canvases.forEach((entry) => {
      this._drawCanvasEntry(entry, activeIdx, smoothElapsedMs, { accentPrimary, accentDanger, textPrimary, textMuted });
    });
  }

  _drawCanvasEntry(entry, activeIdx, smoothElapsedMs, palette) {
    const ctx = entry.ctx;
    if (!ctx) return;

    if (!entry.width || !entry.height) {
      const rect = entry.el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      entry.width = rect.width;
      entry.height = rect.height;
    }

    const width = entry.width;
    const height = entry.height;
    if (width === 0 || height === 0) return;

    ctx.clearRect(0, 0, width, height);

    const topPad = 24;
    const bottomPad = 24;
    const highY = topPad + (height - topPad - bottomPad) * 0.14;
    const lowY = height - bottomPad - (height - topPad - bottomPad) * 0.12;

    // 1. Oscilloscope Graticule Grid (Swiss hairline)
    ctx.strokeStyle = '#ececec';
    ctx.lineWidth = 1;

    const hDivs = 4;
    for (let i = 1; i < hDivs; i++) {
      const y = (height / hDivs) * i;
      ctx.beginPath();
      ctx.setLineDash([2, 4]);
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const vDivs = 8;
    for (let i = 1; i < vDivs; i++) {
      const x = (width / vDivs) * i;
      ctx.beginPath();
      ctx.setLineDash([2, 4]);
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height - 16);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 2. WCAG AA+ Calibrated Voltage Rail Labels on #ffffff
    ctx.font = '500 10.5px "JetBrains Mono", monospace';
    ctx.fillStyle = '#454545';
    ctx.textAlign = 'left';
    ctx.fillText('HIGH 3.3V', 8, Math.max(13, highY - 7));
    ctx.fillStyle = '#666666';
    ctx.fillText('LOW 0V', 8, lowY + 14);

    if (!this.timeline || this.timeline.length === 0 || this.totalDurationMs <= 0) {
      ctx.strokeStyle = '#d4d4d4';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, lowY);
      ctx.lineTo(width, lowY);
      ctx.stroke();

      ctx.fillStyle = '#595959';
      ctx.font = '500 11.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('STANDBY — NO SIGNAL', width / 2, height / 2 + 4);
      return;
    }

    const scaleX = width / this.totalDurationMs;

    // 3. Low Reference Baseline
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, lowY);
    ctx.lineTo(width, lowY);
    ctx.stroke();

    // 4. Subtle Architectural Shading Under High Pulses & Glyph Markers
    const activeGrad = ctx.createLinearGradient(0, highY, 0, lowY);
    activeGrad.addColorStop(0, 'rgba(217, 45, 32, 0.22)');
    activeGrad.addColorStop(1, 'rgba(217, 45, 32, 0.04)');

    const hoverGrad = ctx.createLinearGradient(0, highY, 0, lowY);
    hoverGrad.addColorStop(0, 'rgba(17, 17, 17, 0.14)');
    hoverGrad.addColorStop(1, 'rgba(17, 17, 17, 0.03)');

    const idleGrad = ctx.createLinearGradient(0, highY, 0, lowY);
    idleGrad.addColorStop(0, 'rgba(17, 17, 17, 0.075)');
    idleGrad.addColorStop(1, 'rgba(17, 17, 17, 0.015)');

    let currentX = 0;
    this.timeline.forEach((item, idx) => {
      const itemWidth = item.durationMs * scaleX;
      const isCurrent = idx === activeIdx;
      const isHovered = idx === entry.hoverIndex;

      if (isHovered && !item.state) {
        ctx.fillStyle = 'rgba(17, 17, 17, 0.04)';
        ctx.fillRect(currentX, highY, itemWidth, lowY - highY);
      }

      if (item.state) {
        ctx.fillStyle = isCurrent ? activeGrad : (isHovered ? hoverGrad : idleGrad);
        ctx.fillRect(currentX, highY, itemWidth, lowY - highY);

        if (itemWidth >= 14) {
          ctx.fillStyle = isCurrent ? palette.accentDanger : '#454545';
          ctx.font = '600 11px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          const glyph = item.type === 'dash' ? '—' : '·';
          ctx.fillText(glyph, currentX + itemWidth / 2, Math.max(13, highY - 5));
        }
      }

      currentX += itemWidth;
    });

    // 5. Crisp Ink Pulse Waveform Trace (Zero neon glow)
    ctx.save();
    ctx.beginPath();
    currentX = 0;
    ctx.moveTo(0, lowY);

    this.timeline.forEach((item) => {
      const itemWidth = item.durationMs * scaleX;
      const targetY = item.state ? highY : lowY;
      ctx.lineTo(currentX, targetY);
      ctx.lineTo(currentX + itemWidth, targetY);
      currentX += itemWidth;
    });

    ctx.strokeStyle = palette.accentPrimary;
    ctx.lineWidth = 1.75;
    ctx.lineJoin = 'miter';
    ctx.stroke();
    ctx.restore();

    // 6. Time Scale Ticks along Bottom Rail (WCAG AA on #ffffff)
    ctx.font = '500 10.5px "JetBrains Mono", monospace';
    ctx.fillStyle = '#595959';
    const tickCount = 4;
    for (let i = 0; i <= tickCount; i++) {
      const ratio = i / tickCount;
      const x = ratio * width;
      const sec = ((this.totalDurationMs * ratio) / 1000).toFixed(2) + 's';
      if (i === 0) {
        ctx.textAlign = 'left';
        ctx.fillText(sec, 6, height - 5);
      } else if (i === tickCount) {
        ctx.textAlign = 'right';
        ctx.fillText(sec, width - 6, height - 5);
      } else {
        ctx.textAlign = 'center';
        ctx.fillText(sec, x, height - 5);
      }
    }

    // 7. Smooth Active Playhead Cursor (650nm Optical Red)
    let playheadX = -1;
    if (smoothElapsedMs >= 0 && this.totalDurationMs > 0) {
      playheadX = Math.min(width - 1, Math.max(0, smoothElapsedMs * scaleX));
    } else if (activeIdx >= 0 && activeIdx < this.timeline.length) {
      playheadX = this._getElapsedBeforeIndex(activeIdx) * scaleX;
    }

    if (playheadX >= 0) {
      const activeItem = activeIdx >= 0 ? this.timeline[activeIdx] : null;
      const markerY = activeItem && activeItem.state ? highY : lowY;

      ctx.save();
      ctx.fillStyle = palette.accentDanger;
      ctx.fillRect(playheadX, 0, 1.5, height - 16);

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = palette.accentDanger;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(playheadX + 0.75, markerY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 8. Hover / Keyboard Crosshair & Segment Inspector Pill
    if (entry.hoverIndex >= 0 && entry.hoverIndex < this.timeline.length && entry.hoverX >= 0) {
      const hItem = this.timeline[entry.hoverIndex];
      const typeNames = {
        dot: 'DOT (1T)',
        dash: 'DASH (3T)',
        gap: 'INTRA-GAP (1T)',
        charGap: 'CHAR GAP (3T)',
        wordGap: 'WORD GAP (7T)'
      };
      const label = `${typeNames[hItem.type] || 'PULSE'} · ${hItem.durationMs}ms`;

      ctx.save();
      ctx.strokeStyle = 'rgba(17, 17, 17, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(entry.hoverX, 0);
      ctx.lineTo(entry.hoverX, height - 16);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = '500 10.5px "JetBrains Mono", monospace';
      const tw = ctx.measureText(label).width;
      const pillW = tw + 14;
      const pillH = 20;
      const pillX = Math.min(width - pillW - 6, Math.max(6, entry.hoverX - pillW / 2));
      const pillY = 4;

      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(label, pillX + 7, pillY + 13.5);
      ctx.restore();
    }
  }
}

export const opticalTransmitter = new OpticalTransmitter();
