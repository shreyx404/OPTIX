/**
 * OPTIX - Optical Signal & Beacon Controller
 * Handles Screen Optical Beacon, Canvas Pulse Waveform, and Mobile Camera Flashlight (Torch)
 */

import { sidetone } from './audioSidetone.js';

class OpticalTransmitter {
  constructor() {
    this.beaconEl = null;
    this.canvasEl = null;
    this.ctx = null;
    this.mediaStream = null;
    this.videoTrack = null;
    this.torchSupported = false;
    this.torchActive = false;

    this.isPlaying = false;
    this.currentIndex = 0;
    this.timeline = [];
    this.timerId = null;
    this.onProgressCallback = null;
    this.onCompleteCallback = null;

    this.fullscreenBeaconEl = null;
    this.enableFullscreenFlash = false;
    this.enableTorch = false;
    this.enableSound = true;
  }

  init({ beaconEl, canvasEl, fullscreenBeaconEl }) {
    this.beaconEl = beaconEl;
    this.canvasEl = canvasEl;
    this.fullscreenBeaconEl = fullscreenBeaconEl;

    if (this.canvasEl) {
      this.ctx = this.canvasEl.getContext('2d');
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());

      // Automatically redraw when container size changes
      if (window.ResizeObserver && this.canvasEl.parentElement) {
        const ro = new ResizeObserver(() => {
          this.resizeCanvas();
        });
        ro.observe(this.canvasEl.parentElement);
      }
    }

    this.checkTorchSupport();
  }

  resizeCanvas() {
    if (!this.canvasEl) return;
    const rect = this.canvasEl.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dpr = window.devicePixelRatio || 1;
    this.canvasEl.width = Math.round(rect.width * dpr);
    this.canvasEl.height = Math.round(rect.height * dpr);
    if (this.ctx) {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(dpr, dpr);
    }
    this.drawTimeline(this.timeline, this.currentIndex);
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
      // Check without grabbing stream yet if possible
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
   * Set optical physical state (LED / Torch / Screen Beacon)
   */
  setOpticalState(isOn) {
    // 1. On-Screen Beacon Bulb
    if (this.beaconEl) {
      if (isOn) {
        this.beaconEl.classList.add('active');
      } else {
        this.beaconEl.classList.remove('active');
      }
    }

    // 2. Fullscreen flash overlay (if enabled)
    if (this.fullscreenBeaconEl && this.enableFullscreenFlash) {
      if (isOn) {
        this.fullscreenBeaconEl.classList.add('flash-on');
      } else {
        this.fullscreenBeaconEl.classList.remove('flash-on');
      }
    }

    // 3. Audio Sidetone
    if (this.enableSound) {
      if (isOn) {
        sidetone.startTone();
      } else {
        sidetone.stopTone();
      }
    }

    // 4. Physical Mobile Camera Torch
    if (this.enableTorch && this.videoTrack && this.torchSupported) {
      try {
        this.videoTrack.applyConstraints({ advanced: [{ torch: Boolean(isOn) }] }).catch(() => {});
      } catch (e) {}
    }
  }

  /**
   * Transmit an optical timeline sequence locally on the device
   */
  playSequence(timeline, options = {}) {
    this.stopSequence();
    if (!timeline || timeline.length === 0) return;

    this.timeline = timeline;
    this.isPlaying = true;
    this.currentIndex = 0;
    this.onProgressCallback = options.onProgress || null;
    this.onCompleteCallback = options.onComplete || null;
    this.enableTorch = Boolean(options.enableTorch);
    this.enableSound = options.enableSound !== false;
    this.enableFullscreenFlash = Boolean(options.enableFullscreenFlash);

    this.stepTimeline();
  }

  stepTimeline() {
    if (!this.isPlaying) return;

    if (this.currentIndex >= this.timeline.length) {
      this.stopSequence();
      if (this.onCompleteCallback) this.onCompleteCallback();
      return;
    }

    const item = this.timeline[this.currentIndex];
    this.setOpticalState(item.state);
    this.drawTimeline(this.timeline, this.currentIndex);

    if (this.onProgressCallback) {
      this.onProgressCallback({
        currentIndex: this.currentIndex,
        totalItems: this.timeline.length,
        item
      });
    }

    this.timerId = setTimeout(() => {
      this.currentIndex++;
      this.stepTimeline();
    }, item.durationMs);
  }

  stopSequence() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.isPlaying = false;
    this.setOpticalState(false);
    this.drawTimeline(this.timeline, -1);
  }

  /**
   * Render the digital pulse timeline on canvas
   * Warm amber optical instrument oscilloscope with graticule and voltage rails
   */
  drawTimeline(timeline, activeIdx = -1) {
    if (timeline) {
      this.timeline = timeline;
    }
    this.currentIndex = activeIdx;
    if (!this.canvasEl || !this.ctx) return;
    const ctx = this.ctx;
    const rect = this.canvasEl.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    if (width === 0 || height === 0) return;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Oscilloscope Graticule Grid
    ctx.strokeStyle = 'rgba(229, 169, 59, 0.06)';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    const hDivs = 4;
    for (let i = 1; i < hDivs; i++) {
      const y = (height / hDivs) * i;
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical grid lines
    const vDivs = 10;
    for (let i = 1; i < vDivs; i++) {
      const x = (width / vDivs) * i;
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    ctx.setLineDash([]); // Reset line dash

    const highY = height * 0.24;
    const lowY = height * 0.76;

    // 2. Voltage Rail Markers
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(212, 201, 168, 0.5)';
    ctx.textAlign = 'left';
    ctx.fillText('HIGH 3.3V', 8, highY - 6);
    ctx.fillStyle = 'rgba(240, 236, 228, 0.25)';
    ctx.fillText('LOW 0V', 8, lowY + 14);

    if (!timeline || timeline.length === 0) {
      // Draw baseline placeholder
      ctx.strokeStyle = 'rgba(240, 236, 228, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, lowY);
      ctx.lineTo(width, lowY);
      ctx.stroke();

      ctx.fillStyle = 'rgba(240, 236, 228, 0.3)';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('STANDBY — NO SIGNAL', width / 2, height / 2 + 4);
      return;
    }

    const totalDuration = timeline.reduce((sum, item) => sum + item.durationMs, 0);
    if (totalDuration === 0) return;

    const scaleX = width / totalDuration;

    // 3. Draw Low Reference Baseline
    ctx.strokeStyle = 'rgba(240, 236, 228, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, lowY);
    ctx.lineTo(width, lowY);
    ctx.stroke();

    // 4. Fill Under High Pulses
    let currentX = 0;
    timeline.forEach((item, idx) => {
      const itemWidth = item.durationMs * scaleX;
      if (item.state) {
        const isCurrent = idx === activeIdx;
        const grad = ctx.createLinearGradient(0, highY, 0, lowY);
        if (isCurrent) {
          grad.addColorStop(0, 'rgba(240, 188, 82, 0.45)');
          grad.addColorStop(1, 'rgba(229, 169, 59, 0.08)');
        } else {
          grad.addColorStop(0, 'rgba(229, 169, 59, 0.22)');
          grad.addColorStop(1, 'rgba(229, 169, 59, 0.03)');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(currentX, highY, itemWidth, lowY - highY);
      }
      currentX += itemWidth;
    });

    // 5. Draw Pulse Waveform Stroke
    ctx.save();
    ctx.beginPath();
    currentX = 0;
    ctx.moveTo(0, lowY);

    timeline.forEach((item) => {
      const itemWidth = item.durationMs * scaleX;
      const targetY = item.state ? highY : lowY;

      // Vertical rise or fall edge
      ctx.lineTo(currentX, targetY);
      // Horizontal pulse duration
      ctx.lineTo(currentX + itemWidth, targetY);

      currentX += itemWidth;
    });

    ctx.shadowColor = 'rgba(229, 169, 59, 0.35)';
    ctx.shadowBlur = 4;
    ctx.strokeStyle = '#e5a93b';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'miter';
    ctx.stroke();
    ctx.restore();

    // 6. Draw Active Playhead Cursor
    if (activeIdx >= 0 && activeIdx < timeline.length) {
      let playheadX = 0;
      for (let i = 0; i < activeIdx; i++) {
        playheadX += timeline[i].durationMs * scaleX;
      }

      ctx.save();
      ctx.shadowColor = 'rgba(212, 69, 58, 0.35)';
      ctx.shadowBlur = 4;
      ctx.fillStyle = '#d4453a';
      ctx.fillRect(playheadX, 0, 2, height);

      // Playhead marker on HIGH rail
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#f0ece4';
      ctx.beginPath();
      ctx.arc(playheadX + 1, highY, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

export const opticalTransmitter = new OpticalTransmitter();
