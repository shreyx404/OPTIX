/**
 * BIOTCP - Adaptive Semantic Optical Morse Communication System
 * Local Development Server & ESP32 Bridge/Proxy
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.resolve(__dirname);

// MIME types mapping
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ino': 'text/plain; charset=UTF-8',
  '.md': 'text/markdown; charset=UTF-8'
};

// Simulated Virtual ESP32 State for development/testing without physical board
const virtualEsp32State = {
  transmitting: false,
  currentSequence: '',
  currentIndex: 0,
  ledState: 0,
  unitMs: 100,
  loopCount: 1,
  totalUnits: 0,
  uptimeSec: 0,
  freeHeap: 278420,
  wifiRssi: -58,
  ipAddress: '192.168.4.1 (Simulated)',
  lastTransmission: null
};

let virtualTimer = null;
const startTime = Date.now();

function updateVirtualUptime() {
  virtualEsp32State.uptimeSec = Math.floor((Date.now() - startTime) / 1000);
}

function stopVirtualTransmission() {
  if (virtualTimer) {
    clearTimeout(virtualTimer);
    virtualTimer = null;
  }
  virtualEsp32State.transmitting = false;
  virtualEsp32State.ledState = 0;
  virtualEsp32State.currentIndex = 0;
}

function stepVirtualMorse(morseTokens, tokenIdx, unitMs) {
  if (!virtualEsp32State.transmitting || tokenIdx >= morseTokens.length) {
    stopVirtualTransmission();
    return;
  }

  const token = morseTokens[tokenIdx];
  virtualEsp32State.currentIndex = tokenIdx;
  virtualEsp32State.ledState = token.led ? 1 : 0;

  virtualTimer = setTimeout(() => {
    stepVirtualMorse(morseTokens, tokenIdx + 1, unitMs);
  }, token.units * unitMs);
}

function startVirtualTransmission(morseText, unitMs) {
  stopVirtualTransmission();
  virtualEsp32State.transmitting = true;
  virtualEsp32State.currentSequence = morseText;
  virtualEsp32State.unitMs = unitMs || 100;
  virtualEsp32State.lastTransmission = {
    morse: morseText,
    timestamp: new Date().toISOString()
  };

  // Build token stream: dot=1on,1off, dash=3on,1off, charGap=2off (total 3), wordGap=6off (total 7)
  const tokens = [];
  const chars = morseText.split('');
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === '.') {
      tokens.push({ led: true, units: 1 });
      tokens.push({ led: false, units: 1 }); // intra-char gap
    } else if (ch === '-') {
      tokens.push({ led: true, units: 3 });
      tokens.push({ led: false, units: 1 }); // intra-char gap
    } else if (ch === ' ') {
      tokens.push({ led: false, units: 2 }); // added to previous 1 = 3 units (letter space)
    } else if (ch === '/') {
      tokens.push({ led: false, units: 6 }); // added to previous 1 = 7 units (word space)
    }
  }

  virtualEsp32State.totalUnits = tokens.reduce((sum, t) => sum + t.units, 0);
  stepVirtualMorse(tokens, 0, virtualEsp32State.unitMs);
}

// Request helper to parse JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const requestHandler = async (req, res) => {
  // CORS Headers for mobile web clients
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(urlObj.pathname);

  // 1. VIRTUAL ESP32 MOCK API (For offline or desktop testing without hardware)
  if (pathname.startsWith('/mock-esp32/')) {
    updateVirtualUptime();
    const endpoint = pathname.replace('/mock-esp32', '');

    if (endpoint === '/api/ping' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', device: 'Virtual-ESP32', mode: 'simulation', uptime: virtualEsp32State.uptimeSec }));
      return;
    }

    if (endpoint === '/api/status' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(virtualEsp32State));
      return;
    }

    if (endpoint === '/api/transmit' && req.method === 'POST') {
      try {
        const payload = await parseJsonBody(req);
        const morse = payload.morse || '';
        const unitMs = Number(payload.unit_ms) || 100;
        startVirtualTransmission(morse, unitMs);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Virtual transmission started',
          sequence: morse,
          unit_ms: unitMs,
          estimated_duration_sec: ((virtualEsp32State.totalUnits * unitMs) / 1000).toFixed(2)
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    if (endpoint === '/api/stop' && req.method === 'POST') {
      stopVirtualTransmission();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Virtual transmission stopped' }));
      return;
    }
  }

  // 2. CORS RELAY PROXY (Allows mobile web app to forward requests to real ESP32 without CORS headaches)
  if (pathname === '/proxy/esp32' && (req.method === 'POST' || req.method === 'GET')) {
    const targetUrl = urlObj.searchParams.get('url');
    if (!targetUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing ?url= query parameter' }));
      return;
    }

    try {
      const targetObj = new URL(targetUrl);
      const isPost = req.method === 'POST';
      let postBody = '';
      if (isPost) {
        postBody = await new Promise((resolve, reject) => {
          let b = '';
          req.on('data', chunk => (b += chunk));
          req.on('end', () => resolve(b));
          req.on('error', reject);
        });
      }

      const proxyReq = http.request(
        targetObj,
        {
          method: req.method,
          headers: {
            'Content-Type': req.headers['content-type'] || 'application/json',
            'Content-Length': Buffer.byteLength(postBody)
          },
          timeout: 4000
        },
        proxyRes => {
          res.writeHead(proxyRes.statusCode, {
            'Content-Type': proxyRes.headers['content-type'] || 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          proxyRes.pipe(res);
        }
      );

      proxyReq.on('timeout', () => {
        proxyReq.destroy();
        res.writeHead(504, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'ESP32 Connection Timeout' }));
      });

      proxyReq.on('error', err => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Cannot reach ESP32 at ${targetUrl}: ${err.message}` }));
      });

      if (isPost && postBody) {
        proxyReq.write(postBody);
      }
      proxyReq.end();
      return;
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Invalid proxy URL: ${err.message}` }));
      return;
    }
  }

  // 3. STATIC FILE SERVER
  let safePath = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!safePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Access Denied');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File Not Found');
      return;
    }

    if (stats.isDirectory()) {
      safePath = path.join(safePath, 'index.html');
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(safePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server Error: ' + readErr.message);
        return;
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(content);
    });
  });
};

const server = http.createServer(requestHandler);

const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
let httpsServer = null;

const certPath = path.join(__dirname, 'cert.pem');
const keyPath = path.join(__dirname, 'key.pem');

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  try {
    const sslOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
    httpsServer = https.createServer(sslOptions, requestHandler);
  } catch (err) {
    console.warn('⚠️ Could not initialize HTTPS server:', err.message);
  }
}

// Find Local IP addresses for easy mobile testing
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

server.listen(PORT, '0.0.0.0', () => {
  const localIps = getLocalIpAddresses();
  console.log('\n============================================================');
  console.log('📡 BIOTCP Optical Communication System Server Running!');
  console.log('============================================================');
  console.log(`💻 Local HTTP:         http://localhost:${PORT}`);
  if (localIps.length > 0) {
    localIps.forEach(ip => {
      console.log(`📱 Mobile Network:    http://${ip}:${PORT}`);
    });
  }
  console.log('⚡ Simulated ESP32:   http://localhost:' + PORT + '/mock-esp32/api/ping');

  if (httpsServer) {
    httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
      console.log('------------------------------------------------------------');
      console.log(`🔒 Local HTTPS:        https://localhost:${HTTPS_PORT}`);
      if (localIps.length > 0) {
        localIps.forEach(ip => {
          console.log(`🎙️ Mobile HTTPS (Mic): https://${ip}:${HTTPS_PORT}  <-- USE FOR MOBILE VOICE`);
        });
      }
      console.log('   (Accept self-signed certificate on mobile browser to enable mic)');
      console.log('============================================================\n');
    });
  } else {
    console.log('============================================================\n');
  }
});
