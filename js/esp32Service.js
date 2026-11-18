/**
 * BIOTCP - ESP32 Hardware Communication Service
 * Supports Wi-Fi HTTP REST, CORS Relay Proxy, Web Serial USB, and Virtual Hardware Simulation
 */

class Esp32Service {
  constructor() {
    this.targetIp = '192.168.4.1'; // Default SoftAP IP of ESP32
    this.targetPort = 80;
    this.useProxy = false; // Forward through server proxy if CORS issues
    this.mode = 'wifi'; // 'wifi' | 'serial' | 'simulation'
    this.isConnected = false;
    this.isTransmitting = false;

    // Web Serial properties
    this.serialPort = null;
    this.serialWriter = null;
    this.serialReader = null;
    this.serialSupported = 'serial' in navigator;

    // Callbacks
    this.onStatusChange = null;
    this.onLogMessage = null;

    // Telemetry & transmission history
    this.logs = [];
    this.pingTimer = null;
  }

  init(options = {}) {
    this.targetIp = options.targetIp || localStorage.getItem('biotcp_esp32_ip') || '192.168.4.1';
    this.targetPort = options.targetPort || parseInt(localStorage.getItem('biotcp_esp32_port') || '80', 10);
    this.mode = options.mode || localStorage.getItem('biotcp_mode') || 'simulation';
    this.useProxy = options.useProxy !== undefined ? options.useProxy : (localStorage.getItem('biotcp_proxy') === 'true');

    this.log(`ESP32 Service initialized in [${this.mode.toUpperCase()}] mode.`);
  }

  saveConfig() {
    localStorage.setItem('biotcp_esp32_ip', this.targetIp);
    localStorage.setItem('biotcp_esp32_port', String(this.targetPort));
    localStorage.setItem('biotcp_mode', this.mode);
    localStorage.setItem('biotcp_proxy', String(this.useProxy));
  }

  log(msg, type = 'info') {
    const entry = {
      timestamp: new Date().toLocaleTimeString(),
      text: msg,
      type
    };
    this.logs.unshift(entry);
    if (this.logs.length > 100) this.logs.pop();
    if (this.onLogMessage) this.onLogMessage(entry);
  }

  getBaseUrl() {
    if (this.mode === 'simulation') {
      return `${window.location.origin}/mock-esp32`;
    }
    return `http://${this.targetIp}:${this.targetPort}`;
  }

  /**
   * Helper for HTTP requests with optional CORS proxy and timeout
   */
  async fetchWithTimeout(endpoint, options = {}, timeoutMs = 3500) {
    const baseUrl = this.getBaseUrl();
    let url = `${baseUrl}${endpoint}`;

    if (this.mode === 'wifi' && this.useProxy) {
      url = `${window.location.origin}/proxy/esp32?url=${encodeURIComponent(url)}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });
      clearTimeout(timer);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  /**
   * Ping ESP32 hardware to check connectivity
   */
  async ping() {
    if (this.mode === 'serial') {
      const connected = Boolean(this.serialPort && this.serialWriter);
      this.isConnected = connected;
      if (this.onStatusChange) this.onStatusChange({ connected, mode: this.mode });
      return { status: connected ? 'ok' : 'disconnected', mode: 'serial' };
    }

    try {
      const data = await this.fetchWithTimeout('/api/ping', { method: 'GET' }, 2500);
      this.isConnected = true;
      this.log(`Heartbeat ACK from ESP32: ${JSON.stringify(data)}`, 'success');
      if (this.onStatusChange) this.onStatusChange({ connected: true, mode: this.mode, data });
      return data;
    } catch (err) {
      this.isConnected = false;
      this.log(`Ping failed: ${err.message}`, 'error');
      if (this.onStatusChange) this.onStatusChange({ connected: false, mode: this.mode, error: err.message });
      throw err;
    }
  }

  /**
   * Query full hardware telemetry status
   */
  async getStatus() {
    if (this.mode === 'serial') {
      return { transmitting: this.isTransmitting, mode: 'serial' };
    }

    try {
      const data = await this.fetchWithTimeout('/api/status', { method: 'GET' }, 2500);
      this.isTransmitting = Boolean(data.transmitting);
      return data;
    } catch (err) {
      this.isTransmitting = false;
      throw err;
    }
  }

  /**
   * Send Morse code sequence to ESP32 to flash physical LED
   */
  async transmitMorse(morseSequence, text = '', unitMs = 100, repeat = 1) {
    if (!morseSequence) {
      throw new Error('Morse sequence cannot be empty');
    }

    this.log(`Transmitting sequence: "${morseSequence}" (${unitMs}ms unit, ${repeat}x) via ${this.mode.toUpperCase()}`);

    // Mode 1: Web Serial USB Connection
    if (this.mode === 'serial') {
      if (!this.serialWriter) {
        throw new Error('Serial port not connected. Please connect USB first.');
      }
      const command = `TX ${morseSequence} ${unitMs} ${repeat}\n`;
      const encoder = new TextEncoder();
      await this.serialWriter.write(encoder.encode(command));
      this.isTransmitting = true;
      this.log(`Serial command sent: ${command.trim()}`, 'success');
      return { success: true, mode: 'serial' };
    }

    // Mode 2 & 3: HTTP REST (Real ESP32 or Virtual Simulator)
    const payload = {
      morse: morseSequence,
      text: text || '',
      unit_ms: unitMs,
      repeat: repeat
    };

    try {
      const res = await this.fetchWithTimeout('/api/transmit', {
        method: 'POST',
        body: JSON.stringify(payload)
      }, 5000);

      this.isTransmitting = true;
      this.log(`Transmission accepted by hardware: ${JSON.stringify(res)}`, 'success');
      return res;
    } catch (err) {
      this.isTransmitting = false;
      this.log(`Transmission error: ${err.message}`, 'error');
      throw err;
    }
  }

  /**
   * Stop active transmission immediately
   */
  async stopTransmission() {
    this.log('Emergency Stop command triggered');

    if (this.mode === 'serial') {
      if (this.serialWriter) {
        const encoder = new TextEncoder();
        await this.serialWriter.write(encoder.encode("STOP\n"));
      }
      this.isTransmitting = false;
      return { success: true };
    }

    try {
      const res = await this.fetchWithTimeout('/api/stop', {
        method: 'POST',
        body: JSON.stringify({ stop: true })
      }, 3000);
      this.isTransmitting = false;
      this.log('Hardware transmission halted', 'warn');
      return res;
    } catch (err) {
      this.isTransmitting = false;
      this.log(`Stop command failed: ${err.message}`, 'error');
      throw err;
    }
  }

  /**
   * Connect to ESP32 via USB Web Serial API (Chrome / Edge)
   */
  async connectSerial() {
    if (!this.serialSupported) {
      throw new Error('Web Serial API is not supported in this browser. Please use Chrome/Edge or switch to Wi-Fi mode.');
    }

    try {
      this.serialPort = await navigator.serial.requestPort();
      await this.serialPort.open({ baudRate: 115200 });

      this.serialWriter = this.serialPort.writable.getWriter();
      this.readSerialLoop();

      this.isConnected = true;
      this.mode = 'serial';
      this.saveConfig();
      this.log('ESP32 connected via USB Serial at 115200 baud!', 'success');
      if (this.onStatusChange) this.onStatusChange({ connected: true, mode: 'serial' });
      return true;
    } catch (err) {
      this.log(`Serial connection error: ${err.message}`, 'error');
      throw err;
    }
  }

  async disconnectSerial() {
    if (this.serialWriter) {
      try {
        await this.serialWriter.close();
      } catch (e) {}
      this.serialWriter = null;
    }
    if (this.serialPort) {
      try {
        await this.serialPort.close();
      } catch (e) {}
      this.serialPort = null;
    }
    this.isConnected = false;
    this.log('USB Serial disconnected');
    if (this.onStatusChange) this.onStatusChange({ connected: false, mode: this.mode });
  }

  async readSerialLoop() {
    while (this.serialPort && this.serialPort.readable) {
      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = this.serialPort.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      this.serialReader = reader;

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) {
            this.log(`[ESP32 Serial]: ${value.trim()}`);
          }
        }
      } catch (error) {
        console.warn('Serial read error:', error);
      } finally {
        reader.releaseLock();
      }
    }
  }
}

export const esp32Service = new Esp32Service();
