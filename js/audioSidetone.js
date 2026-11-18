/**
 * BIOTCP - Web Audio API Morse Sidetone Generator
 * Synthesizes pure sine wave telegraph tones with smooth attack/decay envelope
 */

class AudioSidetone {
  constructor() {
    this.audioCtx = null;
    this.gainNode = null;
    this.oscillator = null;
    this.frequency = 750; // Standard CW telegraph tone (Hz)
    this.volume = 0.25;
    this.enabled = true;
    this.isPlaying = false;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        console.warn('Web Audio API not supported on this device');
        return;
      }
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  setFrequency(hz) {
    this.frequency = Math.max(200, Math.min(2000, Number(hz) || 750));
    if (this.oscillator) {
      this.oscillator.frequency.setTargetAtTime(this.frequency, this.audioCtx.currentTime, 0.01);
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, Number(vol)));
    if (this.gainNode && this.isPlaying) {
      this.gainNode.gain.setTargetAtTime(this.volume, this.audioCtx.currentTime, 0.01);
    }
  }

  setEnabled(bool) {
    this.enabled = Boolean(bool);
    if (!this.enabled && this.isPlaying) {
      this.stopTone();
    }
  }

  // Start continuous tone (e.g. while holding down manual Morse paddle)
  startTone() {
    if (!this.enabled) return;
    this.init();
    if (!this.audioCtx) return;

    if (this.isPlaying) return;
    this.isPlaying = true;

    const now = this.audioCtx.currentTime;
    this.oscillator = this.audioCtx.createOscillator();
    this.gainNode = this.audioCtx.createGain();

    this.oscillator.type = 'sine';
    this.oscillator.frequency.setValueAtTime(this.frequency, now);

    // Smooth envelope attack to prevent audio clicks
    this.gainNode.gain.setValueAtTime(0.0001, now);
    this.gainNode.gain.exponentialRampToValueAtTime(Math.max(0.001, this.volume), now + 0.006);

    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.audioCtx.destination);
    this.oscillator.start(now);
  }

  // Stop continuous tone
  stopTone() {
    if (!this.isPlaying || !this.audioCtx || !this.gainNode || !this.oscillator) {
      this.isPlaying = false;
      return;
    }

    const now = this.audioCtx.currentTime;
    // Smooth decay envelope
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
    this.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.008);

    const osc = this.oscillator;
    const gain = this.gainNode;
    this.oscillator = null;
    this.gainNode = null;
    this.isPlaying = false;

    setTimeout(() => {
      try {
        osc.stop();
        osc.disconnect();
        gain.disconnect();
      } catch (e) {
        // already stopped
      }
    }, 15);
  }

  // Play a discrete pulse for a specific duration (ms)
  playPulse(durationMs) {
    if (!this.enabled) return;
    this.startTone();
    setTimeout(() => {
      this.stopTone();
    }, durationMs);
  }
}

export const sidetone = new AudioSidetone();
