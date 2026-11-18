/**
 * OPTIX - Robust Speech Recognition Handler (Mobile & Desktop)
 * Uses Web Speech API (webkitSpeechRecognition / SpeechRecognition)
 * Includes Secure Context checking, continuous listening, and live audio monitoring
 */

export class SpeechHandler {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.manualStop = false;
    this.lang = 'en-US';
    this.baseText = '';
    this.sessionFinalTranscript = '';

    // Audio stream monitoring for visual feedback
    this.audioContext = null;
    this.audioStream = null;
    this.analyser = null;
    this.animFrameId = null;

    this.onResultCallback = null;
    this.onStatusCallback = null;
    this.onErrorCallback = null;
    this.onVolumeCallback = null;
  }

  /**
   * Check browser support and security context
   */
  getDiagnostics() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    const isSecure = window.isSecureContext || isLocal;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    return {
      supported: !!SpeechRec,
      apiName: window.SpeechRecognition ? 'SpeechRecognition' : (window.webkitSpeechRecognition ? 'webkitSpeechRecognition' : null),
      isSecureContext: isSecure,
      isLocal,
      isMobile,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      port: window.location.port,
      userAgent: navigator.userAgent,
      recommendedHttpsUrl: !isSecure ? `https://${window.location.hostname}:3443` : null
    };
  }

  get supported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  get isSecure() {
    return window.isSecureContext || ['localhost', '127.0.0.1'].includes(window.location.hostname);
  }

  /**
   * Start a new speech recognition session
   * @param {Object} callbacks
   * @param {string} callbacks.initialText - Existing text in text box to preserve/append to
   * @param {Function} callbacks.onStatus - Status update callback
   * @param {Function} callbacks.onResult - Result callback
   * @param {Function} callbacks.onError - Error callback
   * @param {Function} callbacks.onVolume - Live volume callback (0-100)
   */
  start(callbacks = {}) {
    const diagnostics = this.getDiagnostics();

    // Check if Web Speech API is supported
    if (!diagnostics.supported) {
      if (callbacks.onError) {
        callbacks.onError({
          error: 'unsupported',
          message: 'Speech recognition is not supported in this browser. Please use Chrome or Edge, or enter text manually.'
        });
      }
      return false;
    }

    // Check if running on mobile insecure HTTP
    if (!diagnostics.isSecureContext) {
      const err = {
        error: 'insecure-context',
        message: 'Microphone is blocked by your browser on plain HTTP. Please switch to HTTPS (port 3443) or enable Chrome insecure origin flags.',
        diagnostics
      };
      if (callbacks.onError) callbacks.onError(err);
      return false;
    }

    // Terminate any previous session cleanly
    this.stop();

    this.onResultCallback = callbacks.onResult || null;
    this.onStatusCallback = callbacks.onStatus || null;
    this.onErrorCallback = callbacks.onError || null;
    this.onVolumeCallback = callbacks.onVolume || null;
    this.baseText = callbacks.initialText ? callbacks.initialText.trim() : '';
    this.sessionFinalTranscript = '';
    this.manualStop = false;

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true; // Keep listening even with natural pauses
      this.recognition.interimResults = true; // Real-time preview
      this.recognition.lang = this.lang;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.startAudioMonitor();
        if (this.onStatusCallback) {
          this.onStatusCallback({
            listening: true,
            msg: 'Listening... Speak emergency message'
          });
        }
      };

      this.recognition.onaudiostart = () => {
        if (this.onStatusCallback && this.isListening) {
          this.onStatusCallback({ listening: true, msg: 'Audio capturing... Speak clearly' });
        }
      };

      this.recognition.onspeechstart = () => {
        if (this.onStatusCallback && this.isListening) {
          this.onStatusCallback({ listening: true, msg: 'Speech detected, transcribing...' });
        }
      };

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        let newlyFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            newlyFinal += (newlyFinal ? ' ' : '') + transcript.trim();
          } else {
            interimTranscript += transcript;
          }
        }

        if (newlyFinal) {
          this.sessionFinalTranscript += (this.sessionFinalTranscript ? ' ' : '') + newlyFinal;
        }

        // Combine base existing text + all finalized speech + current interim preview
        const parts = [];
        if (this.baseText) parts.push(this.baseText);
        if (this.sessionFinalTranscript) parts.push(this.sessionFinalTranscript);
        if (interimTranscript.trim()) parts.push(interimTranscript.trim());

        const fullCombined = parts.join(' ').trim();

        if (this.onResultCallback) {
          this.onResultCallback({
            text: fullCombined,
            final: this.sessionFinalTranscript,
            interim: interimTranscript.trim(),
            raw: event
          });
        }
      };

      this.recognition.onerror = (event) => {
        const errorType = event.error;
        console.warn('Speech recognition event error:', errorType);

        // 'no-speech' is a normal pause in continuous dictation; don't break the session
        if (errorType === 'no-speech') {
          if (this.onStatusCallback && this.isListening) {
            this.onStatusCallback({ listening: true, msg: 'Listening... (waiting for voice)' });
          }
          return;
        }

        if (errorType === 'aborted') {
          // Normal abort upon user action
          return;
        }

        this.isListening = false;
        this.stopAudioMonitor();

        let message = 'Voice recognition error';
        if (errorType === 'not-allowed' || errorType === 'service-not-allowed') {
          if (!this.isSecure) {
            message = 'Microphone blocked: Mobile browsers require HTTPS. Open https://' + window.location.hostname + ':3443 or configure Chrome flags.';
          } else {
            message = 'Microphone permission denied. Allow mic access in browser address bar (lock/tune icon).';
          }
        } else if (errorType === 'network') {
          message = 'Speech Network Error: Cloud voice servers unreachable. Note: ESP32 Wi-Fi AP has no internet. Connect to home Wi-Fi or enter text manually.';
        } else if (errorType === 'audio-capture') {
          message = 'No microphone detected or mic is currently reserved by another app.';
        } else {
          message = `Voice recognition error: ${errorType}`;
        }

        if (this.onErrorCallback) {
          this.onErrorCallback({ error: errorType, message, diagnostics: this.getDiagnostics() });
        }
        if (this.onStatusCallback) {
          this.onStatusCallback({ listening: false, msg: message });
        }
      };

      this.recognition.onend = () => {
        this.stopAudioMonitor();

        // If the browser prematurely ended continuous mode and the user didn't press Stop:
        if (this.isListening && !this.manualStop) {
          try {
            this.recognition.start();
            return;
          } catch (e) {
            console.debug('Speech auto-restart not available:', e);
          }
        }

        this.isListening = false;
        if (this.onStatusCallback) {
          this.onStatusCallback({ listening: false, msg: 'Mic Idle' });
        }
      };

      this.recognition.start();
      return true;
    } catch (e) {
      console.warn('Speech recognition failed to start:', e);
      this.isListening = false;
      this.stopAudioMonitor();

      let msg = `Failed to start speech recognition: ${e.message || e.name}`;
      if (callbacks.onError) {
        callbacks.onError({
          error: e.name || 'start-exception',
          message: msg,
          diagnostics
        });
      }
      return false;
    }
  }

  /**
   * Stop speech recognition session
   */
  stop() {
    this.manualStop = true;
    this.isListening = false;
    this.stopAudioMonitor();

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        try {
          this.recognition.abort();
        } catch (ignore) {}
      }
      this.recognition = null;
    }

    if (this.onStatusCallback) {
      this.onStatusCallback({ listening: false, msg: 'Mic stopped' });
    }
  }

  /**
   * Start lightweight audio level meter to give visual feedback that mic is receiving sound
   */
  async startAudioMonitor() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    if (!this.onVolumeCallback) return;

    try {
      this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(this.audioStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);

      const buffer = new Uint8Array(this.analyser.frequencyBinCount);
      const updateVolume = () => {
        if (!this.isListening || !this.analyser) return;
        this.analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) sum += buffer[i];
        const avg = sum / buffer.length;
        const volume = Math.min(100, Math.round((avg / 128) * 100));

        if (this.onVolumeCallback) {
          this.onVolumeCallback(volume);
        }
        this.animFrameId = requestAnimationFrame(updateVolume);
      };

      this.animFrameId = requestAnimationFrame(updateVolume);
    } catch (e) {
      // Audio monitoring is purely cosmetic/diagnostic; do not fail recognition if getUserMedia rejects
      console.debug('Audio monitor stream not available:', e.message);
    }
  }

  /**
   * Stop audio monitor
   */
  stopAudioMonitor() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(t => t.stop());
      this.audioStream = null;
    }
    if (this.audioContext) {
      try { this.audioContext.close(); } catch (e) {}
      this.audioContext = null;
    }
    if (this.onVolumeCallback) {
      this.onVolumeCallback(0);
    }
  }

  setLanguage(langCode) {
    this.lang = langCode;
    if (this.recognition) {
      this.recognition.lang = langCode;
    }
  }
}

export const speechHandler = new SpeechHandler();
