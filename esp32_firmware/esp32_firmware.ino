/**
 * ==============================================================================================
 * OPTIX — Adaptive Semantic Morse-Based Optical Communication System
 * Phase 1: ESP32 Optical LED Transmitter Firmware
 * 
 * Hardware Target: ESP32 Dev Module / NodeMCU-32S / ESP32-WROOM-32
 * Compatibility: Arduino IDE 2.x, PlatformIO, ESP-IDF Arduino Core (v2.x - v3.x)
 * ==============================================================================================
 * 
 * Key Features:
 * 1. Autonomous SoftAP Mode ("OPTIX-Optical-Transmitter" @ 192.168.4.1) for offline disaster zones
 * 2. Optional Station (STA) mode to join existing Wi-Fi routers
 * 3. Full HTTP REST API on Port 80 with CORS support (Mobile browser compatible)
 * 4. FreeRTOS Non-blocking Optical Timing Engine (Web server stays responsive during transmission)
 * 5. USB Serial Command Interface at 115200 baud
 * 6. Built-in Captive Fallback Web Page served directly from ESP32 flash memory
 * 7. Supports Onboard LED (GPIO 2) and External High-Power Optical LED / MOSFET (GPIO 4)
 * ==============================================================================================
 */

#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h> // ArduinoJson v6 or v7

// ==============================================================================================
// CONFIGURATION & PIN DEFINITIONS
// ==============================================================================================

// Output Pins
#define LED_BUILTIN_PIN 2     // Standard ESP32 onboard blue LED (GPIO 2)
#define LED_OPTICAL_PIN 4     // External Optical LED / MOSFET driver (GPIO 4)

// Wi-Fi Access Point Configuration (Disaster / Offline Mode)
const char* AP_SSID = "OPTIX-Optical-Transmitter";
const char* AP_PASS = "12345678"; // Min 8 chars, or set to NULL for open network
IPAddress AP_LOCAL_IP(192, 168, 4, 1);
IPAddress AP_GATEWAY(192, 168, 4, 1);
IPAddress AP_SUBNET(255, 255, 255, 0);

// Optional Station Mode (Set these if you want ESP32 to connect to home/lab Wi-Fi router)
const char* STA_SSID = "";     // Leave empty to use SoftAP mode
const char* STA_PASS = "";

// Default Morse Timing (Paris standard: 15 WPM = 80ms dot)
const uint32_t DEFAULT_UNIT_MS = 80;

// ==============================================================================================
// SYSTEM STATE & FREERTOS TASK QUEUES
// ==============================================================================================

WebServer server(80);

struct TransmissionJob {
  char morse[512];
  uint32_t unitMs;
  uint16_t repeatCount;
  bool active;
  bool cancelRequested;
};

TransmissionJob currentJob = { "", DEFAULT_UNIT_MS, 1, false, false };
TaskHandle_t opticalTaskHandle = NULL;
SemaphoreHandle_t jobMutex = NULL;

// Telemetry counters
uint32_t totalTransmissionsCount = 0;
uint32_t totalOpticalPulses = 0;

// ==============================================================================================
// HELPER FUNCTIONS
// ==============================================================================================

void setOpticalLeds(bool state) {
  digitalWrite(LED_BUILTIN_PIN, state ? HIGH : LOW);
  digitalWrite(LED_OPTICAL_PIN, state ? HIGH : LOW);
}

void setCorsHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
}

// ==============================================================================================
// FREERTOS OPTICAL TRANSMISSION TASK (Accurate, Non-blocking LED Timing)
// ==============================================================================================

void opticalTransmissionTask(void* parameter) {
  while (true) {
    if (currentJob.active) {
      char morseSeq[512];
      uint32_t unitMs;
      uint16_t repeats;

      // Safely copy job details
      xSemaphoreTake(jobMutex, portMAX_DELAY);
      strncpy(morseSeq, currentJob.morse, sizeof(morseSeq) - 1);
      morseSeq[sizeof(morseSeq) - 1] = '\0';
      unitMs = currentJob.unitMs;
      repeats = currentJob.repeatCount;
      xSemaphoreGive(jobMutex);

      Serial.printf("[OPTICAL] Starting optical transmission (%d repeats, %d ms/unit): %s\n", repeats, unitMs, morseSeq);

      for (uint16_t r = 0; r < repeats; r++) {
        if (currentJob.cancelRequested) break;

        size_t len = strlen(morseSeq);
        for (size_t i = 0; i < len; i++) {
          if (currentJob.cancelRequested) break;

          char sym = morseSeq[i];

          if (sym == '.') {
            // DOT: 1 unit ON, 1 unit OFF
            setOpticalLeds(true);
            totalOpticalPulses++;
            vTaskDelay(pdMS_TO_TICKS(unitMs * 1));
            setOpticalLeds(false);
            vTaskDelay(pdMS_TO_TICKS(unitMs * 1));
          } 
          else if (sym == '-') {
            // DASH: 3 units ON, 1 unit OFF
            setOpticalLeds(true);
            totalOpticalPulses++;
            vTaskDelay(pdMS_TO_TICKS(unitMs * 3));
            setOpticalLeds(false);
            vTaskDelay(pdMS_TO_TICKS(unitMs * 1));
          } 
          else if (sym == ' ') {
            // Inter-character space: 3 units total (1 already elapsed from element space)
            vTaskDelay(pdMS_TO_TICKS(unitMs * 2));
          } 
          else if (sym == '/') {
            // Word space: 7 units total (1 already elapsed)
            vTaskDelay(pdMS_TO_TICKS(unitMs * 6));
          }
        }

        // Inter-repeat gap if repeating
        if (r < repeats - 1 && !currentJob.cancelRequested) {
          vTaskDelay(pdMS_TO_TICKS(unitMs * 7));
        }
      }

      setOpticalLeds(false);
      xSemaphoreTake(jobMutex, portMAX_DELAY);
      currentJob.active = false;
      currentJob.cancelRequested = false;
      totalTransmissionsCount++;
      xSemaphoreGive(jobMutex);

      Serial.println("[OPTICAL] Transmission complete. Optical transmitter idle.");
    }

    // Sleep when idle
    vTaskDelay(pdMS_TO_TICKS(50));
  }
}

// ==============================================================================================
// HTTP REST API HANDLERS
// ==============================================================================================

void handleOptions() {
  setCorsHeaders();
  server.send(204);
}

void handlePing() {
  setCorsHeaders();
  StaticJsonDocument<256> doc;
  doc["status"] = "ok";
  doc["device"] = "ESP32-Optical-Transmitter";
  doc["firmware"] = "OPTIX-v1.0";
  doc["uptime_sec"] = millis() / 1000;
  doc["gpio_builtin"] = LED_BUILTIN_PIN;
  doc["gpio_optical"] = LED_OPTICAL_PIN;

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void handleStatus() {
  setCorsHeaders();
  StaticJsonDocument<512> doc;

  xSemaphoreTake(jobMutex, portMAX_DELAY);
  doc["transmitting"] = currentJob.active;
  doc["current_sequence"] = currentJob.morse;
  doc["unit_ms"] = currentJob.unitMs;
  doc["repeats_remaining"] = currentJob.repeatCount;
  xSemaphoreGive(jobMutex);

  doc["uptime_sec"] = millis() / 1000;
  doc["free_heap"] = ESP.getFreeHeap();
  doc["total_transmissions"] = totalTransmissionsCount;
  doc["total_pulses"] = totalOpticalPulses;
  doc["wifi_mode"] = (WiFi.getMode() == WIFI_AP) ? "AP" : "STA";
  doc["ip_address"] = (WiFi.getMode() == WIFI_AP) ? WiFi.softAPIP().toString() : WiFi.localIP().toString();

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void handleTransmit() {
  setCorsHeaders();

  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"error\":\"Missing JSON body\"}");
    return;
  }

  StaticJsonDocument<768> doc;
  DeserializationError err = deserializeJson(doc, server.arg("plain"));
  if (err) {
    server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
    return;
  }

  const char* morse = doc["morse"] | "";
  uint32_t unitMs = doc["unit_ms"] | DEFAULT_UNIT_MS;
  uint16_t repeat = doc["repeat"] | 1;

  if (strlen(morse) == 0) {
    server.send(400, "application/json", "{\"error\":\"Morse sequence cannot be empty\"}");
    return;
  }

  if (unitMs < 20 || unitMs > 1000) {
    unitMs = DEFAULT_UNIT_MS;
  }

  // Load transmission job into FreeRTOS worker
  xSemaphoreTake(jobMutex, portMAX_DELAY);
  strncpy(currentJob.morse, morse, sizeof(currentJob.morse) - 1);
  currentJob.morse[sizeof(currentJob.morse) - 1] = '\0';
  currentJob.unitMs = unitMs;
  currentJob.repeatCount = repeat;
  currentJob.cancelRequested = false;
  currentJob.active = true;
  xSemaphoreGive(jobMutex);

  StaticJsonDocument<256> resp;
  resp["success"] = true;
  resp["message"] = "Optical transmission queued";
  resp["sequence"] = morse;
  resp["unit_ms"] = unitMs;
  resp["repeat"] = repeat;

  String output;
  serializeJson(resp, output);
  server.send(200, "application/json", output);
}

void handleStop() {
  setCorsHeaders();
  xSemaphoreTake(jobMutex, portMAX_DELAY);
  currentJob.cancelRequested = true;
  xSemaphoreGive(jobMutex);

  setOpticalLeds(false);

  server.send(200, "application/json", "{\"success\":true,\"message\":\"Optical transmission aborted\"}");
}

// Embedded Fallback Web Portal
void handleRoot() {
  setCorsHeaders();
  const char html[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>OPTIX Optical Transmitter</title>
  <style>
    body { background: #06090e; color: #fff; font-family: sans-serif; text-align: center; padding: 2rem 1rem; }
    h1 { color: #00f0ff; margin-bottom: 0.5rem; }
    p { color: #8b9bb4; font-size: 0.9rem; }
    .btn { background: #00f0ff; color: #000; font-weight: bold; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; margin: 0.5rem; }
    .btn-danger { background: #ff0055; color: #fff; }
    input { background: #111a28; border: 1px solid #00f0ff; color: #fff; padding: 0.8rem; border-radius: 8px; width: 80%; max-width: 350px; font-size: 1.1rem; }
    .card { background: rgba(13,20,32,0.8); border: 1px solid rgba(0,240,255,0.2); border-radius: 12px; padding: 1.5rem; max-width: 480px; margin: 1.5rem auto; }
  </style>
</head>
<body>
  <h1>🔦 OPTIX Optical Transmitter</h1>
  <p>ESP32 Embedded Optical Node • Autonomous SoftAP</p>
  <div class="card">
    <input type="text" id="morseInput" value="... --- ..." placeholder="Enter Morse code">
    <div style="margin-top: 1rem;">
      <button class="btn" onclick="sendMorse()">Transmit Morse</button>
      <button class="btn btn-danger" onclick="stopMorse()">Abort</button>
    </div>
    <div id="status" style="margin-top: 1rem; color: #00ff9d; font-family: monospace;">Ready</div>
  </div>
  <script>
    async function sendMorse() {
      const morse = document.getElementById('morseInput').value;
      document.getElementById('status').innerText = 'Transmitting...';
      const res = await fetch('/api/transmit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ morse: morse, unit_ms: 80, repeat: 1 })
      });
      const data = await res.json();
      document.getElementById('status').innerText = 'ACK: ' + data.message;
    }
    async function stopMorse() {
      await fetch('/api/stop', { method: 'POST' });
      document.getElementById('status').innerText = 'Stopped';
    }
  </script>
</body>
</html>
  )rawliteral";
  server.send(200, "text/html", html);
}

// ==============================================================================
// SERIAL COMMAND INTERFACE (Direct USB Cable Testing)
// ==============================================================================

void processSerialInput() {
  if (Serial.available() > 0) {
    String line = Serial.readStringUntil('\n');
    line.trim();
    if (line.length() == 0) return;

    if (line.startsWith("TX ")) {
      // Format: TX <morse_sequence> [unit_ms] [repeat]
      int firstSpace = line.indexOf(' ');
      int secondSpace = line.indexOf(' ', firstSpace + 1);

      String morse = "";
      uint32_t unitMs = DEFAULT_UNIT_MS;
      uint16_t repeat = 1;

      if (secondSpace == -1) {
        morse = line.substring(firstSpace + 1);
      } else {
        morse = line.substring(firstSpace + 1, secondSpace);
        int thirdSpace = line.indexOf(' ', secondSpace + 1);
        if (thirdSpace == -1) {
          unitMs = line.substring(secondSpace + 1).toInt();
        } else {
          unitMs = line.substring(secondSpace + 1, thirdSpace).toInt();
          repeat = line.substring(thirdSpace + 1).toInt();
        }
      }

      if (unitMs < 20) unitMs = DEFAULT_UNIT_MS;
      if (repeat < 1) repeat = 1;

      xSemaphoreTake(jobMutex, portMAX_DELAY);
      strncpy(currentJob.morse, morse.c_str(), sizeof(currentJob.morse) - 1);
      currentJob.unitMs = unitMs;
      currentJob.repeatCount = repeat;
      currentJob.cancelRequested = false;
      currentJob.active = true;
      xSemaphoreGive(jobMutex);

      Serial.printf("[ACK] Queued Morse: %s (%d ms, %dx)\n", morse.c_str(), unitMs, repeat);
    } 
    else if (line.equalsIgnoreCase("STOP")) {
      xSemaphoreTake(jobMutex, portMAX_DELAY);
      currentJob.cancelRequested = true;
      xSemaphoreGive(jobMutex);
      setOpticalLeds(false);
      Serial.println("[ACK] Transmission stopped.");
    } 
    else if (line.equalsIgnoreCase("PING")) {
      Serial.printf("[ACK] PONG | Uptime: %lu s | Heap: %u B\n", millis() / 1000, ESP.getFreeHeap());
    } 
    else if (line.equalsIgnoreCase("STATUS")) {
      Serial.printf("[STATUS] Active: %s | Sequence: %s | Pulses: %u\n", 
                    currentJob.active ? "YES" : "NO", currentJob.morse, totalOpticalPulses);
    }
  }
}

// ==============================================================================
// SETUP & MAIN LOOP
// ==============================================================================

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n========================================================");
  Serial.println("🔦 OPTIX Optical Communication System - ESP32 Firmware");
  Serial.println("========================================================");

  // Initialize LED Pins
  pinMode(LED_BUILTIN_PIN, OUTPUT);
  pinMode(LED_OPTICAL_PIN, OUTPUT);
  setOpticalLeds(false);

  // Quick LED POST (Power-On Self Test) Blinks
  for (int i = 0; i < 3; i++) {
    setOpticalLeds(true);
    delay(70);
    setOpticalLeds(false);
    delay(70);
  }

  jobMutex = xSemaphoreCreateMutex();

  // Create FreeRTOS task on Core 1 for Optical Signal generation
  xTaskCreatePinnedToCore(
    opticalTransmissionTask,
    "OpticalTxTask",
    4096,
    NULL,
    1,
    &opticalTaskHandle,
    1 // Pin to Core 1 so Core 0 handles Wi-Fi stack
  );

  // Wi-Fi Initialization
  if (strlen(STA_SSID) > 0) {
    Serial.printf("[WIFI] Connecting to Station SSID: %s ...\n", STA_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(STA_SSID, STA_PASS);

    uint8_t timeout = 20;
    while (WiFi.status() != WL_CONNECTED && timeout > 0) {
      delay(500);
      Serial.print(".");
      timeout--;
    }

    if (WiFi.status() == WL_CONNECTED) {
      Serial.printf("\n[WIFI] Connected! Station IP: %s\n", WiFi.localIP().toString().c_str());
    } else {
      Serial.println("\n[WIFI] Station connection failed. Falling back to SoftAP mode...");
      WiFi.mode(WIFI_AP);
      WiFi.softAPConfig(AP_LOCAL_IP, AP_GATEWAY, AP_SUBNET);
      WiFi.softAP(AP_SSID, AP_PASS);
      Serial.printf("[WIFI] SoftAP Active: %s | IP: %s\n", AP_SSID, WiFi.softAPIP().toString().c_str());
    }
  } else {
    // Autonomous SoftAP Mode
    WiFi.mode(WIFI_AP);
    WiFi.softAPConfig(AP_LOCAL_IP, AP_GATEWAY, AP_SUBNET);
    WiFi.softAP(AP_SSID, AP_PASS);
    Serial.printf("[WIFI] SoftAP Active: %s | IP: %s\n", AP_SSID, WiFi.softAPIP().toString().c_str());
  }

  // Register HTTP Routes
  server.on("/", HTTP_GET, handleRoot);
  server.on("/api/ping", HTTP_GET, handlePing);
  server.on("/api/status", HTTP_GET, handleStatus);
  server.on("/api/transmit", HTTP_POST, handleTransmit);
  server.on("/api/stop", HTTP_POST, handleStop);

  // OPTIONS Preflight handlers for CORS
  server.on("/api/ping", HTTP_OPTIONS, handleOptions);
  server.on("/api/status", HTTP_OPTIONS, handleOptions);
  server.on("/api/transmit", HTTP_OPTIONS, handleOptions);
  server.on("/api/stop", HTTP_OPTIONS, handleOptions);

  server.begin();
  Serial.println("[HTTP] REST Web Server running on port 80");
  Serial.println("[SYSTEM] Ready for optical Morse commands!\n");
}

void loop() {
  server.handleClient();
  processSerialInput();
  delay(2); // Yield CPU
}
