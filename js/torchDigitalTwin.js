/**
 * OPTIX — Phase 2 Self-Contained Tactical Torch 3D Digital Twin
 * Fully offline Three.js WebGL interactive simulator synced with live OPTIX Morse engine.
 *
 * Architecture:
 *   - Compute Core: Raspberry Pi Compute Module 5 (CM5, 4GB LPDDR4X, Quad Cortex-A76 2.4GHz)
 *     Chosen to run offline Whisper-tiny STT + quantized AI semantic compression inside a 52mm barrel.
 *   - Optics: 10W Cree XHP50 LED + CNC Heatsink + Parabolic Reflector + Borosilicate Collimator Lens
 *   - Driver: IRLZ44N Logic-Level MOSFET + Constant-Current Buck Driver (GPIO 18 Hardware PWM)
 *   - Controls: 1.3" I2C OLED Telemetry Screen + 4 Tactile Hardware Buttons (PTT, TX, SOS, MODE)
 *   - Audio Input: INMP441 I2S Digital MEMS Microphone with Wind-Guard Acoustic Mesh
 *   - Power: 2S1P 18650 Li-Ion Pack (7.4V 3500mAh / 25.9Wh) + USB-C PD 2S BMS & 5V/3A Buck Rail
 *   - Enclosure: Custom 3D-Printed CF-PETG / PA12 Nylon Rugged Modular Housing (IP65 Target)
 */

import * as THREE from './vendor/three.module.min.js';

export const TORCH_SUBSYSTEMS = {
  overview: {
    id: 'overview',
    name: 'OPTIX-MK2 Complete Assembly',
    category: 'PHASE 2 SELF-CONTAINED TORCH',
    partModel: 'Zero-Network Handheld Optical AI Communicator',
    interface: '100% Autonomous (No Phone / No Cellular / No Wi-Fi)',
    power: 'Idle 1.8W · Voice AI 5.5W · Optical TX Peak 12W',
    cost: '~$118 Est. Prototype BOM (~₹9,800)',
    summary:
      'Complete self-contained tactical torch for military, hikers, and disaster response. All speech-to-text, AI semantic compression, ITU-R M.1677-1 Morse modulation, and high-power LED keying execute onboard with zero external infrastructure.'
  },
  compute: {
    id: 'compute',
    name: 'Raspberry Pi CM5 + Carrier PCB',
    category: 'ONBOARD AI & VOICE COMPUTE CORE',
    partModel: 'Raspberry Pi Compute Module 5 (4GB RAM, 32GB eMMC)',
    interface: 'GPIO 18 (PWM TX) · I2S (Mic) · I2C (OLED) · 4× GPIO (Buttons)',
    power: '5.0V / 3.0A Regulated Rail (Avg 2.5W, Peak 5.5W AI Inference)',
    cost: '~$55 (CM5 Module + Compact Custom Carrier PCB)',
    summary:
      'Selected over Pi Zero 2 W (512MB RAM cannot run local AI compression alongside STT) and standard Pi 5 (85×56mm too bulky). The 55×40mm CM5 fits cleanly inside a 52mm torch barrel while running offline whisper.cpp (Speech-to-Text) + quantized SmolLM2/Qwen2.5-0.5B semantic compression in real time.'
  },
  optics: {
    id: 'optics',
    name: '10W Optical Emitter & Collimator',
    category: 'HIGH-INTENSITY VLC OPTICS',
    partModel: 'Cree XHP50 10W LED + CNC Heatsink + Parabolic Reflector + Lens',
    interface: 'Constant-Current High-Side Drive (1.5A–2.5A Pulsed)',
    power: 'Up to 10W Peak (50% duty reduction via Adaptive Semantic Compression)',
    cost: '~$16 (LED Star MCPCB + Heatsink + Reflector + AR Glass Lens)',
    summary:
      'Collimated narrow-beam optical head engineered for 1.5–3 km line-of-sight visibility at night. Machined aluminum heatsink slug dissipates thermal load directly into the finned front bezel.'
  },
  driver: {
    id: 'driver',
    name: 'MOSFET Optical Keying Driver',
    category: 'POWER MODULATION STAGE',
    partModel: 'IRLZ44N Logic-Level N-MOSFET + Constant-Current Buck Driver',
    interface: 'Driven by RPi CM5 GPIO 18 (3.3V Hardware PWM / Precision Timing)',
    power: '92% Switching Efficiency · Microsecond Rise/Fall Optical Edges',
    cost: '~$6 (Driver PCB + MOSFET + Inductor + Thermal Sensor)',
    summary:
      'Isolates the Raspberry Pi 3.3V GPIO rail from the high-current 10W LED load. Produces razor-sharp ITU-R M.1677-1 optical dot/dash pulses with zero luminance lag.'
  },
  controls: {
    id: 'controls',
    name: 'Top Control Deck (OLED + 4 Buttons)',
    category: 'FIELD OPERATOR INTERFACE',
    partModel: '1.3" SH1106 I2C OLED + 4× IP67 Sealed Tactile Switches',
    interface: 'I2C (GPIO 2/3) + Hardware Interrupts (GPIO 5, 6, 13, 26)',
    power: '0.15W OLED Active (Auto-Dim Night Vision Mode)',
    cost: '~$11 (OLED + Silicone-Sealed Button Array + Piezo Sidetone)',
    summary:
      'Glove-friendly 4-button deck: [1] PTT/VOICE activates local microphone & AI compression, [2] TX transmits or acts as manual Morse key, [3] recessed crimson SOS triggers instant distress beacon, [4] MODE cycles Morse / Presets / Steady Flashlight.'
  },
  mic: {
    id: 'mic',
    name: 'INMP441 Digital MEMS Microphone',
    category: 'OFFLINE VOICE CAPTURE FRONT-END',
    partModel: 'INMP441 Omnidirectional I2S MEMS Mic + Acoustic Wind Mesh',
    interface: '24-Bit Digital I2S Bus (GPIO 19 LRCLK · GPIO 20 DIN · GPIO 21 BCLK)',
    power: '3.3V / 1.4mA (< 5mW)',
    cost: '~$4 (MEMS Module + Hydrophobic Acoustic Membrane)',
    summary:
      'Direct digital I2S audio capture eliminates analog ADC noise and interference from the high-current LED PWM stage. Protected by a wind-baffled acoustic grille for mountain and tactical use.'
  },
  battery: {
    id: 'battery',
    name: '2S1P 18650 Li-Ion Battery Pack',
    category: 'HIGH-DENSITY FIELD ENERGY STORE',
    partModel: '2× Samsung 35E 18650 Cells (7.4V Nominal, 3500mAh / 25.9Wh)',
    interface: 'Nickel-Welded 2S Bus + NTC Thermal Probe to BMS',
    power: '~6–10 hrs Mixed Field Ops · ~24+ hrs Periodic SOS Beacon',
    cost: '~$12 (2× 18650 Cells + Sled + Protection Thermistor)',
    summary:
      'Twin industrial 18650 lithium-ion cells mounted in a vibration-damped internal sled. High discharge headroom supports simultaneous Raspberry Pi AI inference and 10W optical bursts.'
  },
  usbc: {
    id: 'usbc',
    name: 'USB-C PD Fast Charger & 2S BMS',
    category: 'CHARGING & POWER REGULATION',
    partModel: 'USB Type-C PD 2S Balance Charger + 5V/3A Synchronous Buck',
    interface: 'External Recessed USB-C Port (5V–15V PD Input + Debug UART)',
    power: '18W USB-C PD Fast Charge (0–80% in ~75 min) · Overcurrent/Temp Cutoff',
    cost: '~$8 (2S BMS + IP67 Silicone-Capped USB-C Receptacle)',
    summary:
      'Provides universal USB-C Type-C field charging from solar panels, power banks, or vehicle ports. Integrates 2S cell balancing, fuel-gauge telemetry to the OLED, and clean 5V/3A regulation for the Pi CM5.'
  },
  enclosure: {
    id: 'enclosure',
    name: 'Custom 3D-Printed Rugged Housing',
    category: 'MECHANICAL ENCLOSURE (CF-PETG / PA12)',
    partModel: 'Modular Split-Shell 3D-Printed Barrel + Finned Strike Bezel + Tailcap',
    interface: 'Internal PCB Rails · O-Ring Grooves · Recessed USB-C & Mic Ports',
    power: 'Passive Thermal Finning + Mechanical Tailcap Master Power Lockout',
    cost: '~$6 (Carbon-Fiber PETG / SLS PA12 Nylon Filament & Fasteners)',
    summary:
      'Engineered for rapid custom 3D printing: two interlocking clamshell halves house the Pi CM5, battery sled, and button deck, locked mechanically by the threaded front optical bezel and knurled rear tailcap.'
  }
};

const CAMERA_PRESETS = {
  iso: { theta: 0.52, phi: 1.12, radius: 11.6, targetX: 0.25, targetY: 0.08 },
  optics: { theta: 0.95, phi: 1.28, radius: 8.2, targetX: 3.1, targetY: 0.0 },
  controls: { theta: 0.12, phi: 0.48, radius: 7.8, targetX: 0.75, targetY: 0.35 },
  internals: { theta: 0.02, phi: 1.38, radius: 10.2, targetX: 0.1, targetY: 0.05 },
  usbc: { theta: -0.42, phi: 1.25, radius: 7.4, targetX: -2.55, targetY: 0.02 }
};

class TorchDigitalTwin {
  constructor() {
    this.container = null;
    this.canvas = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.initialized = false;
    this.rafId = null;
    this.isVisible = false;

    // Interaction / Orbit State
    this.orbit = {
      theta: CAMERA_PRESETS.iso.theta,
      phi: CAMERA_PRESETS.iso.phi,
      radius: CAMERA_PRESETS.iso.radius,
      target: new THREE.Vector3(CAMERA_PRESETS.iso.targetX, CAMERA_PRESETS.iso.targetY, 0),
      goalTheta: CAMERA_PRESETS.iso.theta,
      goalPhi: CAMERA_PRESETS.iso.phi,
      goalRadius: CAMERA_PRESETS.iso.radius,
      goalTarget: new THREE.Vector3(CAMERA_PRESETS.iso.targetX, CAMERA_PRESETS.iso.targetY, 0),
      dragging: false,
      pointerMoved: false,
      lastX: 0,
      lastY: 0,
      autoRotate: true
    };

    // View & Hardware State
    this.viewMode = 'xray'; // 'assembled' | 'xray' | 'exploded'
    this.explodeTarget = 0;
    this.explodeCurrent = 0;
    this.selectedPart = 'overview';

    // Optical & Live Telemetry State
    this.morsePulseOn = false;
    this.steadyBeamOn = false;
    this.voiceListening = false;
    this.oledState = {
      mode: 'STANDBY',
      text: 'SOS',
      morse: '... --- ...',
      wpm: 15,
      compressed: false,
      savingsPercent: 0,
      batteryPct: 88,
      txActive: false
    };

    // Scene Graph References
    this.torchRoot = null;
    this.explodableParts = [];
    this.enclosureMeshes = [];
    this.enclosureWireframes = [];
    this.pickableMeshes = [];
    this.buttonMeshes = {};
    this.buttonPressAnim = { ptt: 0, tx: 0, sos: 0, mode: 0 };
    this.subsystemGroups = {};

    // Dynamic Materials & Lights
    this.ledDieMat = null;
    this.beamOuterMat = null;
    this.beamInnerMat = null;
    this.lensFlareMat = null;
    this.opticalPointLight = null;
    this.gpioSignalWireMat = null;
    this.ledDriveWireMat = null;
    this.piActLedMat = null;
    this.micRingMat = null;
    this.usbcLedMat = null;
    this.wiringGroup = null;

    // Live OLED CanvasTexture
    this.oledCanvas = null;
    this.oledCtx = null;
    this.oledTexture = null;

    // Callbacks
    this.onPartSelected = null;
    this.onTorchButtonAction = null;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.clock = new THREE.Clock();
  }

  init(containerEl, { onPartSelected, onTorchButtonAction } = {}) {
    if (this.initialized || !containerEl) return;
    this.container = containerEl;
    this.onPartSelected = onPartSelected || null;
    this.onTorchButtonAction = onTorchButtonAction || null;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.canvas = this.renderer.domElement;
    this.canvas.className = 'torch-webgl-canvas';
    this.container.appendChild(this.canvas);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b0c10);
    this.scene.fog = new THREE.FogExp2(0x0b0c10, 0.022);

    // Camera
    this.camera = new THREE.PerspectiveCamera(36, 16 / 10, 0.1, 100);

    // Subtle Lab Grid Floor (Warm Amber Optical Bench)
    const grid = new THREE.GridHelper(28, 28, 0x2c261d, 0x17181d);
    grid.position.y = -2.25;
    grid.material.transparent = true;
    grid.material.opacity = 0.55;
    this.scene.add(grid);

    // Lighting Studio Rig
    this.setupLighting();

    // Build Complete Torch Assembly
    this.torchRoot = new THREE.Group();
    this.scene.add(this.torchRoot);
    this.buildTorchAssembly();

    // Apply initial view mode (X-Ray cutaway makes the internal RPi & battery immediately visible!)
    this.applyViewMode('xray', false);
    this.updateOledTexture();

    // Events & Resize
    this.bindPointerEvents();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => this.resize());
      ro.observe(this.container);
    }

    this.initialized = true;
    this.setVisible(true);
  }

  setupLighting() {
    const hemi = new THREE.HemisphereLight(0xf0ece4, 0x1a1c22, 0.75);
    this.scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff4e0, 1.65);
    keyLight.position.set(6, 9, 7);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x9fb4d4, 0.75);
    fillLight.position.set(-8, 4, -6);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xe5a93b, 0.55);
    rimLight.position.set(-3, -5, 6);
    this.scene.add(rimLight);
  }

  /**
   * Helper to tag meshes for raycast selection + subsystem highlight
   */
  tagPickable(obj, partId, buttonId = null) {
    obj.traverse((child) => {
      if (child.isMesh) {
        child.userData.partId = partId;
        if (buttonId) child.userData.buttonId = buttonId;
        this.pickableMeshes.push(child);
      }
    });
  }

  registerExplodable(object3d, explodeOffsetVec) {
    this.explodableParts.push({
      obj: object3d,
      basePos: object3d.position.clone(),
      offset: explodeOffsetVec.clone()
    });
  }

  /**
   * Generate crisp procedural CanvasTexture for the Raspberry Pi CM5 SoC heatspreader
   */
  createCm5LabelTexture() {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#aeb4bd';
    ctx.fillRect(0, 0, 256, 256);

    // Brushed metallic grain
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    for (let y = 0; y < 256; y += 3) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#6c727d';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, 236, 236);

    ctx.fillStyle = '#1b1d22';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RPi CM5', 128, 86);
    ctx.font = 'bold 20px monospace';
    ctx.fillText('BCM2712', 128, 124);
    ctx.font = '18px monospace';
    ctx.fillText('4GB LPDDR4X', 128, 162);
    ctx.fillStyle = '#404550';
    ctx.font = '15px monospace';
    ctx.fillText('WHISPER + AI', 128, 200);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /**
   * Generate procedural CanvasTexture for 18650 Li-Ion battery wrap
   */
  createBatteryWrapTexture() {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#8b5e20';
    ctx.fillRect(0, 0, 256, 128);

    ctx.fillStyle = '#201a12';
    ctx.fillRect(0, 0, 256, 14);
    ctx.fillRect(0, 114, 256, 14);

    ctx.fillStyle = '#f0ece4';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('OPTIX 18650 · 3.7V', 128, 56);
    ctx.font = '14px monospace';
    ctx.fillStyle = '#f5d28b';
    ctx.fillText('3500mAh · 2S LI-ION PACK', 128, 84);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /**
   * Build the full multi-subsystem OPTIX-MK2 Torch
   */
  buildTorchAssembly() {
    // Shared Anodized & Industrial Materials
    const shellSolidMat = new THREE.MeshStandardMaterial({
      color: 0x1d2026,
      roughness: 0.52,
      metalness: 0.45,
      transparent: true,
      opacity: 1.0
    });
    const shellAccentMat = new THREE.MeshStandardMaterial({
      color: 0x2a2d35,
      roughness: 0.38,
      metalness: 0.65,
      transparent: true,
      opacity: 1.0
    });
    const darkAluminumMat = new THREE.MeshStandardMaterial({
      color: 0x393d47,
      roughness: 0.3,
      metalness: 0.85
    });
    const brightAluminumMat = new THREE.MeshStandardMaterial({
      color: 0xcbd0d8,
      roughness: 0.18,
      metalness: 0.92
    });
    const pcbBlackMat = new THREE.MeshStandardMaterial({
      color: 0x111714,
      roughness: 0.42,
      metalness: 0.2
    });
    const pcbGreenMat = new THREE.MeshStandardMaterial({
      color: 0x17462d,
      roughness: 0.45,
      metalness: 0.18
    });
    const goldPinMat = new THREE.MeshStandardMaterial({
      color: 0xe5a93b,
      roughness: 0.25,
      metalness: 0.9
    });
    const icBlackMat = new THREE.MeshStandardMaterial({
      color: 0x141518,
      roughness: 0.5,
      metalness: 0.2
    });

    // =========================================================================
    // 1. CUSTOM 3D-PRINTED ENCLOSURE (Front Bezel, Split Clamshell, Tailcap)
    // =========================================================================
    const enclosureGroup = new THREE.Group();
    this.subsystemGroups.enclosure = enclosureGroup;
    this.torchRoot.add(enclosureGroup);

    const addShellPart = (mesh, parent) => {
      parent.add(mesh);
      this.enclosureMeshes.push(mesh);
      // Add subtle edge wireframe visible in X-Ray mode
      const edges = new THREE.EdgesGeometry(mesh.geometry, 26);
      const wire = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({
          color: 0xe5a93b,
          transparent: true,
          opacity: 0.0
        })
      );
      mesh.add(wire);
      this.enclosureWireframes.push(wire);
    };

    // 1A. Front Tactical Bezel + Cooling Fins (+X)
    const frontBezelGroup = new THREE.Group();
    frontBezelGroup.position.set(3.55, 0, 0);
    enclosureGroup.add(frontBezelGroup);

    // Flared Optical Head Shell
    const headConeGeo = new THREE.CylinderGeometry(1.38, 1.12, 1.35, 36, 1, true);
    headConeGeo.rotateZ(-Math.PI / 2);
    const headShell = new THREE.Mesh(headConeGeo, shellSolidMat.clone());
    addShellPart(headShell, frontBezelGroup);

    // Front Tactical Strike Ring
    const strikeRingGeo = new THREE.TorusGeometry(1.36, 0.09, 14, 36);
    strikeRingGeo.rotateY(Math.PI / 2);
    const strikeRing = new THREE.Mesh(strikeRingGeo, shellAccentMat.clone());
    strikeRing.position.x = 0.68;
    addShellPart(strikeRing, frontBezelGroup);

    // Crenellated Strike Bezel Teeth (6 lugs)
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 0.14), shellAccentMat.clone());
      tooth.position.set(0.74, Math.cos(ang) * 1.35, Math.sin(ang) * 1.35);
      tooth.rotation.x = ang;
      addShellPart(tooth, frontBezelGroup);
    }

    // 4 CNC Cooling Fin Rings around Head Neck
    for (let i = 0; i < 4; i++) {
      const finGeo = new THREE.TorusGeometry(1.22 - i * 0.025, 0.045, 10, 36);
      finGeo.rotateY(Math.PI / 2);
      const fin = new THREE.Mesh(finGeo, shellAccentMat.clone());
      fin.position.x = -0.15 - i * 0.18;
      addShellPart(fin, frontBezelGroup);
    }

    this.tagPickable(frontBezelGroup, 'enclosure');
    this.registerExplodable(frontBezelGroup, new THREE.Vector3(2.3, 0, 0));

    // 1B. Upper 3D-Printed Clamshell Barrel Half (splits UP +Y when exploded)
    const upperShellGroup = new THREE.Group();
    upperShellGroup.position.set(-0.2, 0, 0);
    enclosureGroup.add(upperShellGroup);

    const upperBarrelGeo = new THREE.CylinderGeometry(1.08, 1.08, 6.2, 32, 1, true, 0, Math.PI);
    upperBarrelGeo.rotateZ(Math.PI / 2);
    const upperBarrel = new THREE.Mesh(upperBarrelGeo, shellSolidMat.clone());
    upperBarrel.material.side = THREE.DoubleSide;
    addShellPart(upperBarrel, upperShellGroup);

    // Top Control Deck Raised Shroud on Upper Clamshell
    const deckShroud = new THREE.Mesh(new THREE.BoxGeometry(3.15, 0.28, 1.18), shellAccentMat.clone());
    deckShroud.position.set(0.85, 1.05, 0);
    addShellPart(deckShroud, upperShellGroup);

    this.tagPickable(upperShellGroup, 'enclosure');
    this.registerExplodable(upperShellGroup, new THREE.Vector3(0, 2.05, 0));

    // 1C. Lower 3D-Printed Clamshell Barrel Half (splits DOWN -Y when exploded)
    const lowerShellGroup = new THREE.Group();
    lowerShellGroup.position.set(-0.2, 0, 0);
    enclosureGroup.add(lowerShellGroup);

    const lowerBarrelGeo = new THREE.CylinderGeometry(1.08, 1.08, 6.2, 32, 1, true, Math.PI, Math.PI);
    lowerBarrelGeo.rotateZ(Math.PI / 2);
    const lowerBarrel = new THREE.Mesh(lowerBarrelGeo, shellSolidMat.clone());
    lowerBarrel.material.side = THREE.DoubleSide;
    addShellPart(lowerBarrel, lowerShellGroup);

    // Ergonomic Grip Ribs along Lower Handle
    for (let i = 0; i < 9; i++) {
      const ribGeo = new THREE.TorusGeometry(1.09, 0.03, 8, 24, Math.PI);
      ribGeo.rotateY(Math.PI / 2);
      ribGeo.rotateX(Math.PI);
      const rib = new THREE.Mesh(ribGeo, shellAccentMat.clone());
      rib.position.x = -2.2 + i * 0.45;
      addShellPart(rib, lowerShellGroup);
    }

    this.tagPickable(lowerShellGroup, 'enclosure');
    this.registerExplodable(lowerShellGroup, new THREE.Vector3(0, -1.95, 0));

    // 1D. Knurled Rear Tailcap + Mechanical Power Lockout Switch (-X)
    const tailcapGroup = new THREE.Group();
    tailcapGroup.position.set(-3.65, 0, 0);
    enclosureGroup.add(tailcapGroup);

    const tailBodyGeo = new THREE.CylinderGeometry(1.09, 1.02, 0.85, 32);
    tailBodyGeo.rotateZ(-Math.PI / 2);
    const tailBody = new THREE.Mesh(tailBodyGeo, shellAccentMat.clone());
    addShellPart(tailBody, tailcapGroup);

    // Master Mechanical Tail Power Switch Boot
    const tailSwitchGeo = new THREE.CylinderGeometry(0.42, 0.46, 0.22, 24);
    tailSwitchGeo.rotateZ(Math.PI / 2);
    const tailSwitch = new THREE.Mesh(
      tailSwitchGeo,
      new THREE.MeshStandardMaterial({ color: 0x3b352c, roughness: 0.7, metalness: 0.1 })
    );
    tailSwitch.position.x = -0.46;
    tailcapGroup.add(tailSwitch);

    // Tactical Lanyard Ring Lug
    const lanyardGeo = new THREE.TorusGeometry(0.24, 0.045, 10, 20);
    const lanyard = new THREE.Mesh(lanyardGeo, darkAluminumMat);
    lanyard.position.set(-0.35, -0.82, 0);
    tailcapGroup.add(lanyard);

    this.tagPickable(tailcapGroup, 'enclosure');
    this.registerExplodable(tailcapGroup, new THREE.Vector3(-2.4, 0, 0));

    // =========================================================================
    // 2. OPTICAL EMITTER ASSEMBLY (Lens, Parabolic Reflector, 10W LED, Heatsink)
    // =========================================================================
    const opticsGroup = new THREE.Group();
    opticsGroup.position.set(3.15, 0, 0);
    this.subsystemGroups.optics = opticsGroup;
    this.torchRoot.add(opticsGroup);

    // CNC Aluminum Thermal Heatsink Slug
    const heatsinkGeo = new THREE.CylinderGeometry(0.86, 0.86, 0.62, 28);
    heatsinkGeo.rotateZ(Math.PI / 2);
    const heatsink = new THREE.Mesh(heatsinkGeo, darkAluminumMat);
    heatsink.position.x = -0.35;
    opticsGroup.add(heatsink);

    // Cree XHP50 Star MCPCB
    const mcpcbGeo = new THREE.CylinderGeometry(0.62, 0.62, 0.08, 6);
    mcpcbGeo.rotateZ(Math.PI / 2);
    const mcpcb = new THREE.Mesh(
      mcpcbGeo,
      new THREE.MeshStandardMaterial({ color: 0xdedad0, roughness: 0.35, metalness: 0.25 })
    );
    mcpcb.position.x = -0.01;
    opticsGroup.add(mcpcb);

    // 10W LED Emitter Die (Dynamic Emissive!)
    this.ledDieMat = new THREE.MeshStandardMaterial({
      color: 0xffd27d,
      emissive: 0xffb830,
      emissiveIntensity: 0.35,
      roughness: 0.2,
      metalness: 0.1
    });
    const ledDie = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.34, 0.34), this.ledDieMat);
    ledDie.position.x = 0.05;
    opticsGroup.add(ledDie);

    // Parabolic Aluminum Reflector Cone
    const reflectorGeo = new THREE.CylinderGeometry(1.22, 0.36, 0.92, 32, 1, true);
    reflectorGeo.rotateZ(-Math.PI / 2);
    const reflectorMat = new THREE.MeshStandardMaterial({
      color: 0xe6e8ec,
      roughness: 0.12,
      metalness: 0.96,
      side: THREE.DoubleSide
    });
    const reflector = new THREE.Mesh(reflectorGeo, reflectorMat);
    reflector.position.x = 0.48;
    opticsGroup.add(reflector);

    // Borosilicate Collimator Lens (Front Glass)
    const lensGeo = new THREE.CylinderGeometry(1.24, 1.24, 0.1, 36);
    lensGeo.rotateZ(Math.PI / 2);
    const lensMat = new THREE.MeshPhysicalMaterial({
      color: 0xfff8e8,
      roughness: 0.06,
      metalness: 0.05,
      transmission: 0.72,
      transparent: true,
      opacity: 0.48,
      ior: 1.5
    });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.x = 0.98;
    opticsGroup.add(lens);

    // Volumetric 3D Light Beam Cones (Additive Glow — synced live to Morse!)
    const beamOuterGeo = new THREE.CylinderGeometry(3.4, 1.18, 9.5, 32, 1, true);
    beamOuterGeo.rotateZ(-Math.PI / 2);
    this.beamOuterMat = new THREE.MeshBasicMaterial({
      color: 0xf4b942,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const beamOuter = new THREE.Mesh(beamOuterGeo, this.beamOuterMat);
    beamOuter.position.x = 5.75;
    opticsGroup.add(beamOuter);

    const beamInnerGeo = new THREE.CylinderGeometry(1.85, 0.55, 8.2, 24, 1, true);
    beamInnerGeo.rotateZ(-Math.PI / 2);
    this.beamInnerMat = new THREE.MeshBasicMaterial({
      color: 0xfff4d4,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const beamInner = new THREE.Mesh(beamInnerGeo, this.beamInnerMat);
    beamInner.position.x = 5.1;
    opticsGroup.add(beamInner);

    // Front Aperture Flare Disc
    const flareGeo = new THREE.CircleGeometry(1.3, 32);
    flareGeo.rotateY(Math.PI / 2);
    this.lensFlareMat = new THREE.MeshBasicMaterial({
      color: 0xffe4a0,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const lensFlare = new THREE.Mesh(flareGeo, this.lensFlareMat);
    lensFlare.position.x = 1.06;
    opticsGroup.add(lensFlare);

    // Dynamic Optical Point Light
    this.opticalPointLight = new THREE.PointLight(0xffcb66, 0, 14, 1.6);
    this.opticalPointLight.position.set(1.5, 0, 0);
    opticsGroup.add(this.opticalPointLight);

    // Keep beams non-pickable so dragging across the beam doesn't trigger selection
    beamOuter.userData.ignorePick = true;
    beamInner.userData.ignorePick = true;
    lensFlare.userData.ignorePick = true;

    [heatsink, mcpcb, ledDie, reflector, lens].forEach((m) => this.tagPickable(m, 'optics'));
    this.registerExplodable(opticsGroup, new THREE.Vector3(1.15, 0, 0));

    // =========================================================================
    // 3. MOSFET CONSTANT-CURRENT LED DRIVER PCB
    // =========================================================================
    const driverGroup = new THREE.Group();
    driverGroup.position.set(2.12, -0.05, 0);
    this.subsystemGroups.driver = driverGroup;
    this.torchRoot.add(driverGroup);

    const driverPcbGeo = new THREE.CylinderGeometry(0.84, 0.84, 0.1, 24);
    driverPcbGeo.rotateZ(Math.PI / 2);
    const driverPcb = new THREE.Mesh(driverPcbGeo, pcbGreenMat);
    driverGroup.add(driverPcb);

    // IRLZ44N TO-220 MOSFET package
    const mosfetBody = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.34, 0.32), icBlackMat);
    mosfetBody.position.set(-0.14, 0.24, 0.15);
    driverGroup.add(mosfetBody);

    const mosfetTab = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.44, 0.32), brightAluminumMat);
    mosfetTab.position.set(-0.04, 0.29, 0.15);
    driverGroup.add(mosfetTab);

    // Toroid Buck Inductor (Copper Wound)
    const toroidGeo = new THREE.TorusGeometry(0.18, 0.08, 12, 20);
    const toroid = new THREE.Mesh(
      toroidGeo,
      new THREE.MeshStandardMaterial({ color: 0xb87333, roughness: 0.32, metalness: 0.82 })
    );
    toroid.position.set(-0.16, -0.22, -0.18);
    driverGroup.add(toroid);

    // Electrolytic Filter Capacitor
    const capGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.34, 16);
    capGeo.rotateZ(Math.PI / 2);
    const cap = new THREE.Mesh(
      capGeo,
      new THREE.MeshStandardMaterial({ color: 0x20334a, roughness: 0.35, metalness: 0.5 })
    );
    cap.position.set(-0.22, -0.2, 0.28);
    driverGroup.add(cap);

    this.tagPickable(driverGroup, 'driver');
    this.registerExplodable(driverGroup, new THREE.Vector3(0.55, -0.55, 0));

    // =========================================================================
    // 4. COMPUTE CORE: RASPBERRY PI CM5 (4GB) + CUSTOM CARRIER PCB
    // =========================================================================
    const computeGroup = new THREE.Group();
    computeGroup.position.set(0.52, 0.08, 0);
    this.subsystemGroups.compute = computeGroup;
    this.torchRoot.add(computeGroup);

    // Custom Carrier PCB (sits horizontally inside the barrel)
    const carrierBoard = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.08, 1.48), pcbBlackMat);
    computeGroup.add(carrierBoard);

    // Raspberry Pi Compute Module 5 (CM5) mounted on board-to-board connectors
    const cm5Board = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.07, 1.24), pcbGreenMat);
    cm5Board.position.set(0, 0.11, 0);
    computeGroup.add(cm5Board);

    // Broadcom BCM2712 SoC Heatspreader (with crisp etched CM5 texture)
    const socMat = new THREE.MeshStandardMaterial({
      map: this.createCm5LabelTexture(),
      roughness: 0.28,
      metalness: 0.78
    });
    const socMesh = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.09, 0.72), socMat);
    socMesh.position.set(-0.15, 0.19, 0.02);
    computeGroup.add(socMesh);

    // LPDDR4X 4GB RAM Package
    const ramChip = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.34), icBlackMat);
    ramChip.position.set(0.58, 0.17, -0.22);
    computeGroup.add(ramChip);

    // 32GB eMMC Flash IC
    const emmcChip = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.06, 0.34), icBlackMat);
    emmcChip.position.set(0.58, 0.17, 0.26);
    computeGroup.add(emmcChip);

    // RF Shield Can (Wi-Fi/BT standby module)
    const rfCan = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.09, 0.56), brightAluminumMat);
    rfCan.position.set(-0.78, 0.19, -0.2);
    computeGroup.add(rfCan);

    // Gold-Plated GPIO Header Pins along carrier edge
    for (let i = 0; i < 12; i++) {
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.04), goldPinMat);
      pin.position.set(-0.98 + i * 0.17, 0.09, 0.66);
      computeGroup.add(pin);
    }

    // Pi CM5 Activity Status LED
    this.piActLedMat = new THREE.MeshStandardMaterial({
      color: 0x5cb85c,
      emissive: 0x5cb85c,
      emissiveIntensity: 0.8
    });
    const piActLed = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.09), this.piActLedMat);
    piActLed.position.set(-0.88, 0.18, 0.42);
    computeGroup.add(piActLed);

    this.tagPickable(computeGroup, 'compute');
    this.registerExplodable(computeGroup, new THREE.Vector3(0.15, 0.45, 0));

    // =========================================================================
    // 5. TOP CONTROL DECK: LIVE 1.3" OLED + 4 TACTILE HARDWARE BUTTONS
    // =========================================================================
    const controlsGroup = new THREE.Group();
    controlsGroup.position.set(0.65, 1.14, 0);
    this.subsystemGroups.controls = controlsGroup;
    this.torchRoot.add(controlsGroup);

    // Control Deck Carrier Plate
    const deckBase = new THREE.Mesh(
      new THREE.BoxGeometry(2.95, 0.14, 0.96),
      new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.45, metalness: 0.55 })
    );
    controlsGroup.add(deckBase);

    // 1.3" Live OLED Display (CanvasTexture!)
    this.oledCanvas = document.createElement('canvas');
    this.oledCanvas.width = 256;
    this.oledCanvas.height = 128;
    this.oledCtx = this.oledCanvas.getContext('2d');
    this.oledTexture = new THREE.CanvasTexture(this.oledCanvas);
    this.oledTexture.colorSpace = THREE.SRGBColorSpace;

    const oledBezel = new THREE.Mesh(
      new THREE.BoxGeometry(1.26, 0.08, 0.72),
      new THREE.MeshStandardMaterial({ color: 0x090a0d, roughness: 0.25, metalness: 0.7 })
    );
    oledBezel.position.set(0.68, 0.08, 0);
    controlsGroup.add(oledBezel);

    const oledScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.16, 0.6),
      new THREE.MeshBasicMaterial({ map: this.oledTexture })
    );
    oledScreen.rotation.x = -Math.PI / 2;
    oledScreen.position.set(0.68, 0.125, 0);
    controlsGroup.add(oledScreen);

    // 4 Dedicated Interactive Hardware Buttons
    const buildHardwareButton = ({ id, x, z, radius, capColor, ringColor }) => {
      const btnGroup = new THREE.Group();
      btnGroup.position.set(x, 0.1, z);

      const bezel = new THREE.Mesh(
        new THREE.CylinderGeometry(radius + 0.045, radius + 0.06, 0.08, 24),
        new THREE.MeshStandardMaterial({ color: ringColor, roughness: 0.3, metalness: 0.75 })
      );
      btnGroup.add(bezel);

      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius * 1.04, 0.11, 24),
        new THREE.MeshStandardMaterial({
          color: capColor,
          roughness: 0.35,
          metalness: 0.35,
          emissive: capColor === 0xd4453a ? 0x4a100c : 0x000000,
          emissiveIntensity: 0.4
        })
      );
      cap.position.y = 0.05;
      btnGroup.add(cap);

      controlsGroup.add(btnGroup);
      this.buttonMeshes[id] = cap;
      this.tagPickable(btnGroup, 'controls', id);
    };

    // Row of 4 Tactile Switches behind the OLED:
    // [PTT VOICE] (amber ring), [TX MORSE] (warm silver), [SOS] (crimson guard), [MODE/BEAM] (dark knurled)
    buildHardwareButton({ id: 'ptt', x: -0.22, z: -0.22, radius: 0.145, capColor: 0x252830, ringColor: 0xe5a93b });
    buildHardwareButton({ id: 'tx', x: -0.22, z: 0.22, radius: 0.145, capColor: 0xe5a93b, ringColor: 0x8b6a28 });
    buildHardwareButton({ id: 'sos', x: -0.82, z: -0.22, radius: 0.145, capColor: 0xd4453a, ringColor: 0x6b201b });
    buildHardwareButton({ id: 'mode', x: -0.82, z: 0.22, radius: 0.145, capColor: 0x2d313a, ringColor: 0x6a6e77 });

    // Piezo Acoustic Sidetone Buzzer Disc under Deck
    const piezo = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.08, 20),
      new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.4, metalness: 0.3 })
    );
    piezo.position.set(-1.18, 0.08, 0);
    controlsGroup.add(piezo);

    this.tagPickable(deckBase, 'controls');
    this.tagPickable(oledBezel, 'controls');
    this.tagPickable(oledScreen, 'controls');
    this.tagPickable(piezo, 'controls');
    this.registerExplodable(controlsGroup, new THREE.Vector3(0.15, 1.35, 0));

    // =========================================================================
    // 6. INMP441 I2S DIGITAL MEMS MICROPHONE (Front Upper Collar)
    // =========================================================================
    const micGroup = new THREE.Group();
    micGroup.position.set(2.42, 1.06, 0);
    this.subsystemGroups.mic = micGroup;
    this.torchRoot.add(micGroup);

    const micPcb = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.06, 20), pcbBlackMat);
    micGroup.add(micPcb);

    // Brass MEMS Capsule
    const micCapsule = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.11, 20), goldPinMat);
    micCapsule.position.y = 0.07;
    micGroup.add(micCapsule);

    // Acoustic Wind-Screen Grille Mesh Cap
    const micGrille = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.26, 0.08, 24),
      new THREE.MeshStandardMaterial({ color: 0x2c3038, roughness: 0.65, metalness: 0.7 })
    );
    micGrille.position.y = 0.14;
    micGroup.add(micGrille);

    // Voice-Listening Halo Indicator Ring
    this.micRingMat = new THREE.MeshStandardMaterial({
      color: 0xe5a93b,
      emissive: 0xe5a93b,
      emissiveIntensity: 0.15
    });
    const micRing = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.024, 10, 24), this.micRingMat);
    micRing.rotation.x = Math.PI / 2;
    micRing.position.y = 0.16;
    micGroup.add(micRing);

    this.tagPickable(micGroup, 'mic');
    this.registerExplodable(micGroup, new THREE.Vector3(0.65, 1.25, 0));

    // =========================================================================
    // 7. 2S1P 18650 LI-ION BATTERY PACK (7.4V 3500mAh / 25.9Wh)
    // =========================================================================
    const batteryGroup = new THREE.Group();
    batteryGroup.position.set(-1.55, -0.04, 0);
    this.subsystemGroups.battery = batteryGroup;
    this.torchRoot.add(batteryGroup);

    const cellWrapMat = new THREE.MeshStandardMaterial({
      map: this.createBatteryWrapTexture(),
      roughness: 0.38,
      metalness: 0.18
    });

    // Twin 18650 Cells Side-by-Side
    [-0.4, 0.4].forEach((zOff) => {
      const cellGeo = new THREE.CylinderGeometry(0.37, 0.37, 2.35, 24);
      cellGeo.rotateZ(Math.PI / 2);
      const cell = new THREE.Mesh(cellGeo, cellWrapMat);
      cell.position.z = zOff;
      batteryGroup.add(cell);

      // Positive Button Cap
      const posCapGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.08, 16);
      posCapGeo.rotateZ(Math.PI / 2);
      const posCap = new THREE.Mesh(posCapGeo, brightAluminumMat);
      posCap.position.set(1.2, 0, zOff);
      batteryGroup.add(posCap);

      // Negative End Plate
      const negCapGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.04, 16);
      negCapGeo.rotateZ(Math.PI / 2);
      const negCap = new THREE.Mesh(negCapGeo, brightAluminumMat);
      negCap.position.set(-1.18, 0, zOff);
      batteryGroup.add(negCap);
    });

    // Spot-Welded Nickel Busbar Strip connecting 2S cells
    const nickelBar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 1.02), brightAluminumMat);
    nickelBar.position.set(-1.22, 0, 0);
    batteryGroup.add(nickelBar);

    // 3D-Printed Battery Sled Cradle
    const sled = new THREE.Mesh(
      new THREE.BoxGeometry(2.15, 0.16, 1.38),
      new THREE.MeshStandardMaterial({ color: 0x1c1e24, roughness: 0.7, metalness: 0.15 })
    );
    sled.position.y = -0.44;
    batteryGroup.add(sled);

    this.tagPickable(batteryGroup, 'battery');
    this.registerExplodable(batteryGroup, new THREE.Vector3(-0.75, -0.45, 0));

    // =========================================================================
    // 8. USB-C PD FAST CHARGING & 2S BMS MODULE (Rear-Side Type-C Port)
    // =========================================================================
    const usbcGroup = new THREE.Group();
    usbcGroup.position.set(-2.95, 0.02, 0);
    this.subsystemGroups.usbc = usbcGroup;
    this.torchRoot.add(usbcGroup);

    // Vertical 2S BMS + 5V/3A Buck PCB
    const bmsPcb = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.24, 1.24), pcbGreenMat);
    usbcGroup.add(bmsPcb);

    // BMS Protection IC & Buck Inductors
    const bmsIc = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.34, 0.34), icBlackMat);
    bmsIc.position.set(-0.1, 0.22, 0.2);
    usbcGroup.add(bmsIc);

    const buckInductor = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.32, 0.32), darkAluminumMat);
    buckInductor.position.set(-0.12, -0.25, -0.18);
    usbcGroup.add(buckInductor);

    // Recessed Metallic USB Type-C Receptacle (Protruding out the +Z side wall)
    const usbcHousing = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.22, 0.52), brightAluminumMat);
    usbcHousing.position.set(0.02, 0.08, 0.72);
    usbcGroup.add(usbcHousing);

    // Inner Dark USB-C Cavity + Contact Tongue
    const usbcCavity = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.14, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x050608, roughness: 0.9 })
    );
    usbcCavity.position.set(0.02, 0.08, 0.95);
    usbcGroup.add(usbcCavity);

    const usbcTongue = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.035, 0.12), goldPinMat);
    usbcTongue.position.set(0.02, 0.08, 0.95);
    usbcGroup.add(usbcTongue);

    // USB-C Charging Indicator LED
    this.usbcLedMat = new THREE.MeshStandardMaterial({
      color: 0x5cb85c,
      emissive: 0x5cb85c,
      emissiveIntensity: 0.75
    });
    const chgLed = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), this.usbcLedMat);
    chgLed.position.set(0.02, 0.3, 0.88);
    usbcGroup.add(chgLed);

    this.tagPickable(usbcGroup, 'usbc');
    this.registerExplodable(usbcGroup, new THREE.Vector3(-1.55, 0.35, 0.45));

    // =========================================================================
    // 9. COLOR-CODED INTERNAL WIRING HARNESS (TubeGeometry Splines)
    // =========================================================================
    this.wiringGroup = new THREE.Group();
    this.torchRoot.add(this.wiringGroup);

    const addWire = (points, colorHex, radius = 0.028, customMat = null) => {
      const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
      const geo = new THREE.TubeGeometry(curve, 24, radius, 8, false);
      const mat =
        customMat ||
        new THREE.MeshStandardMaterial({
          color: colorHex,
          roughness: 0.55,
          metalness: 0.15,
          transparent: true,
          opacity: 0.95
        });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData.ignorePick = true;
      this.wiringGroup.add(mesh);
      return mat;
    };

    // +7.4V Red Bus: Battery -> USB-C BMS -> Pi CM5 Carrier 5V Rail
    addWire(
      [
        [-2.75, 0.12, 0.35],
        [-2.4, 0.35, 0.58],
        [-1.1, 0.42, 0.62],
        [-0.55, 0.15, 0.55]
      ],
      0xc83e37,
      0.032
    );

    // GND Black Bus: Battery -> BMS -> Pi CM5 -> MOSFET Driver
    addWire(
      [
        [-2.75, -0.22, -0.35],
        [-2.2, -0.52, -0.58],
        [-0.3, -0.52, -0.58],
        [1.95, -0.32, -0.38]
      ],
      0x2c3038,
      0.032
    );

    // GPIO 18 PWM Signal Wire: Pi CM5 -> MOSFET Driver (Pulses Bright Amber on TX!)
    this.gpioSignalWireMat = new THREE.MeshStandardMaterial({
      color: 0xe5a93b,
      emissive: 0xe5a93b,
      emissiveIntensity: 0.12,
      roughness: 0.4,
      transparent: true,
      opacity: 0.95
    });
    addWire(
      [
        [1.55, 0.16, 0.62],
        [1.82, 0.25, 0.52],
        [2.05, 0.22, 0.2]
      ],
      0xe5a93b,
      0.03,
      this.gpioSignalWireMat
    );

    // High-Current LED Drive Leads: MOSFET Driver -> 10W Cree LED Star
    this.ledDriveWireMat = new THREE.MeshStandardMaterial({
      color: 0xf0bc52,
      emissive: 0xe5a93b,
      emissiveIntensity: 0.1,
      roughness: 0.35,
      transparent: true,
      opacity: 0.95
    });
    addWire(
      [
        [2.18, 0.18, 0.15],
        [2.58, 0.22, 0.25],
        [3.12, 0.14, 0.18]
      ],
      0xf0bc52,
      0.036,
      this.ledDriveWireMat
    );

    // I2C Bus Ribbon: Pi CM5 -> Top Control Deck OLED & Buttons
    addWire(
      [
        [0.85, 0.22, 0.55],
        [0.95, 0.68, 0.52],
        [0.75, 1.05, 0.32]
      ],
      0x5d8aa8,
      0.024
    );

    // I2S Digital Audio Bus: Pi CM5 -> INMP441 MEMS Mic
    addWire(
      [
        [1.42, 0.22, -0.45],
        [1.92, 0.65, -0.35],
        [2.38, 1.02, -0.1]
      ],
      0x6ca87a,
      0.024
    );
  }

  /**
   * Draw live instrumentation telemetry onto the 3D Torch's 1.3" OLED screen!
   */
  updateOledTexture() {
    if (!this.oledCtx || !this.oledTexture) return;
    const ctx = this.oledCtx;
    const w = this.oledCanvas.width;
    const h = this.oledCanvas.height;

    // Deep OLED black ground
    ctx.fillStyle = '#050608';
    ctx.fillRect(0, 0, w, h);

    // Crisp amber border frame
    ctx.strokeStyle = this.oledState.txActive || this.steadyBeamOn ? '#f0bc52' : 'rgba(229, 169, 59, 0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(3, 3, w - 6, h - 6);

    // Header Bar: Mode + Battery
    ctx.fillStyle = 'rgba(229, 169, 59, 0.15)';
    ctx.fillRect(4, 4, w - 8, 24);

    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = this.oledState.mode === 'SOS OVERRIDE' ? '#ff6b60' : '#f0bc52';
    ctx.textAlign = 'left';
    const modeLabel = this.voiceListening
      ? 'MIC · AI STT'
      : this.steadyBeamOn
      ? 'STEADY BEAM'
      : this.oledState.txActive
      ? 'TX OPTICAL'
      : this.oledState.mode;
    ctx.fillText(modeLabel, 10, 20);

    // Battery Indicator
    ctx.textAlign = 'right';
    ctx.fillStyle = '#5cb85c';
    ctx.fillText(`${this.oledState.batteryPct}% 7.4V`, w - 10, 20);

    // Main Message Line
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f0ece4';
    ctx.font = 'bold 20px monospace';
    const msg = (this.oledState.text || 'READY').toUpperCase().slice(0, 16);
    ctx.fillText(msg, 10, 56);

    // Morse Code Preview Line
    ctx.fillStyle = '#e5a93b';
    ctx.font = 'bold 16px monospace';
    const morseStr = (this.oledState.morse || '... --- ...').slice(0, 22);
    ctx.fillText(morseStr, 10, 84);

    // Bottom Telemetry Footer: CM5 AI Status + WPM + Optical LED Dot
    ctx.fillStyle = 'rgba(240, 236, 228, 0.65)';
    ctx.font = '11px monospace';
    const aiTag = this.oledState.compressed
      ? `AI COMP -${this.oledState.savingsPercent}%`
      : 'CM5 OFFLINE AI';
    ctx.fillText(`${aiTag} · ${this.oledState.wpm}WPM`, 10, 112);

    // Live Optical Pulse Indicator Circle
    const isLit = this.morsePulseOn || this.steadyBeamOn;
    ctx.beginPath();
    ctx.arc(w - 18, 108, 6, 0, Math.PI * 2);
    ctx.fillStyle = isLit ? '#f0bc52' : '#2a2d35';
    ctx.fill();

    this.oledTexture.needsUpdate = true;
  }

  /**
   * Sync live message, Morse string, WPM, and compression status from OPTIX app
   */
  syncTelemetry({ text, morse, wpm, compressed, savingsPercent, mode }) {
    if (text !== undefined) this.oledState.text = text;
    if (morse !== undefined) this.oledState.morse = morse;
    if (wpm !== undefined) this.oledState.wpm = wpm;
    if (compressed !== undefined) this.oledState.compressed = compressed;
    if (savingsPercent !== undefined) this.oledState.savingsPercent = savingsPercent;
    if (mode !== undefined) this.oledState.mode = mode;
    this.updateOledTexture();
  }

  /**
   * Sync voice listening status onto MEMS mic glow & OLED
   */
  setVoiceListening(isListening) {
    this.voiceListening = Boolean(isListening);
    this.updateOledTexture();
  }

  /**
   * Sync real-time optical Morse pulse (called automatically by OpticalTransmitter!)
   */
  setOpticalPulse(isOn) {
    this.morsePulseOn = Boolean(isOn);
    this.oledState.txActive = Boolean(isOn);
    this.updateOledTexture();
  }

  /**
   * Toggle Steady Tactical Flashlight Beam Mode
   */
  toggleSteadyBeam() {
    this.steadyBeamOn = !this.steadyBeamOn;
    this.triggerButtonPressAnim('mode');
    this.updateOledTexture();
    return this.steadyBeamOn;
  }

  triggerButtonPressAnim(btnId) {
    if (this.buttonPressAnim[btnId] !== undefined) {
      this.buttonPressAnim[btnId] = 1.0;
    }
  }

  /**
   * View Modes: 'assembled' | 'xray' | 'exploded'
   */
  applyViewMode(mode, updateSliderCallback = true) {
    this.viewMode = mode;
    if (mode === 'assembled') {
      this.explodeTarget = 0;
    } else if (mode === 'xray') {
      this.explodeTarget = 0;
    } else if (mode === 'exploded') {
      this.explodeTarget = 1;
    }

    const isXray = mode === 'xray';
    const targetOpacity = isXray ? 0.16 : 1.0;

    this.enclosureMeshes.forEach((mesh) => {
      mesh.material.opacity = targetOpacity;
      mesh.material.depthWrite = !isXray;
      mesh.material.needsUpdate = true;
    });

    this.enclosureWireframes.forEach((wire) => {
      wire.material.opacity = isXray ? 0.24 : 0.0;
    });

    if (updateSliderCallback && this.onExplodeSliderSync) {
      this.onExplodeSliderSync(Math.round(this.explodeTarget * 100));
    }
  }

  setExplodeAmount(normalized) {
    this.explodeTarget = Math.max(0, Math.min(1, normalized));
    if (this.explodeTarget > 0.05 && this.viewMode === 'assembled') {
      // Keep shell solid when manually exploding from assembled
    }
  }

  setCameraPreset(presetName) {
    const p = CAMERA_PRESETS[presetName];
    if (!p) return;
    this.orbit.goalTheta = p.theta;
    this.orbit.goalPhi = p.phi;
    this.orbit.goalRadius = p.radius;
    this.orbit.goalTarget.set(p.targetX, p.targetY, 0);
    this.orbit.autoRotate = false;
  }

  setAutoRotate(enabled) {
    this.orbit.autoRotate = Boolean(enabled);
  }

  selectSubsystem(partId) {
    this.selectedPart = partId || 'overview';
    if (this.onPartSelected) {
      this.onPartSelected(TORCH_SUBSYSTEMS[this.selectedPart] || TORCH_SUBSYSTEMS.overview);
    }

    // Focus camera gently if specific internal subsystem selected
    if (partId === 'optics') this.setCameraPreset('optics');
    else if (partId === 'controls' || partId === 'mic') this.setCameraPreset('controls');
    else if (partId === 'usbc') this.setCameraPreset('usbc');
    else if (partId === 'compute' || partId === 'battery' || partId === 'driver') {
      if (this.viewMode === 'assembled') {
        this.applyViewMode('xray', true);
      }
      this.setCameraPreset('internals');
    }
  }

  bindPointerEvents() {
    const dom = this.canvas;
    const activePointers = new Map();
    let lastPinchDist = 0;

    const getPinchDistance = () => {
      const pts = [...activePointers.values()];
      if (pts.length < 2) return 0;
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      return Math.hypot(dx, dy);
    };

    dom.addEventListener('pointerdown', (e) => {
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      dom.setPointerCapture?.(e.pointerId);

      if (activePointers.size === 1) {
        this.orbit.dragging = true;
        this.orbit.pointerMoved = false;
        this.orbit.lastX = e.clientX;
        this.orbit.lastY = e.clientY;
      } else if (activePointers.size === 2) {
        // Two-finger pinch zoom on mobile / tablet
        this.orbit.dragging = false;
        this.orbit.pointerMoved = true;
        this.orbit.autoRotate = false;
        lastPinchDist = getPinchDistance();
      }
    });

    dom.addEventListener('pointermove', (e) => {
      if (activePointers.has(e.pointerId)) {
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      if (activePointers.size >= 2) {
        const dist = getPinchDistance();
        if (lastPinchDist > 0 && dist > 0) {
          const delta = lastPinchDist - dist;
          this.orbit.goalRadius = Math.max(5.5, Math.min(18.0, this.orbit.goalRadius + delta * 0.032));
        }
        lastPinchDist = dist;
        return;
      }

      if (this.orbit.dragging) {
        const dx = e.clientX - this.orbit.lastX;
        const dy = e.clientY - this.orbit.lastY;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
          this.orbit.pointerMoved = true;
          this.orbit.autoRotate = false;
        }
        this.orbit.lastX = e.clientX;
        this.orbit.lastY = e.clientY;

        this.orbit.goalTheta -= dx * 0.0085;
        this.orbit.goalPhi = Math.max(0.22, Math.min(Math.PI - 0.25, this.orbit.goalPhi - dy * 0.0085));
      } else if (e.pointerType === 'mouse') {
        // Subtle hover cursor feedback on desktop
        const hit = this.raycastFromEvent(e);
        dom.style.cursor = hit ? 'pointer' : 'grab';
      }
    });

    const stopDrag = (e) => {
      const wasSingleClick = activePointers.size === 1 && this.orbit.dragging && !this.orbit.pointerMoved;
      activePointers.delete(e.pointerId);
      dom.releasePointerCapture?.(e.pointerId);

      if (activePointers.size < 2) {
        lastPinchDist = 0;
      }

      if (activePointers.size === 1) {
        const remaining = [...activePointers.values()][0];
        this.orbit.dragging = true;
        this.orbit.lastX = remaining.x;
        this.orbit.lastY = remaining.y;
        return;
      }

      if (wasSingleClick) {
        this.handleCanvasClick(e);
      }
      this.orbit.dragging = false;
    };

    dom.addEventListener('pointerup', stopDrag);
    dom.addEventListener('pointercancel', stopDrag);

    dom.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.orbit.goalRadius = Math.max(5.5, Math.min(18.0, this.orbit.goalRadius + e.deltaY * 0.0075));
      },
      { passive: false }
    );
  }

  raycastFromEvent(e) {
    if (!this.canvas || !this.camera) return null;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.pickableMeshes, false);

    // In X-Ray mode, prefer picking internal components underneath the transparent shell
    if (this.viewMode === 'xray') {
      const internalHit = hits.find((h) => h.object.userData.partId && h.object.userData.partId !== 'enclosure');
      if (internalHit) return internalHit;
    }
    return hits.find((h) => h.object.userData.partId) || null;
  }

  handleCanvasClick(e) {
    const hit = this.raycastFromEvent(e);
    if (!hit) {
      this.selectedPart = 'overview';
      if (this.onPartSelected) this.onPartSelected(TORCH_SUBSYSTEMS.overview);
      return;
    }

    const { partId, buttonId } = hit.object.userData;

    // If user clicked one of the 4 physical hardware buttons on the 3D torch!
    if (buttonId) {
      this.triggerButtonPressAnim(buttonId);
      if (this.onTorchButtonAction) {
        this.onTorchButtonAction(buttonId);
      }
    }

    if (partId) {
      this.selectedPart = partId;
      if (this.onPartSelected) {
        this.onPartSelected(TORCH_SUBSYSTEMS[partId] || TORCH_SUBSYSTEMS.overview);
      }
    }
  }

  resize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const rect = this.container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(rect.width, rect.height, false);
  }

  setVisible(visible) {
    this.isVisible = Boolean(visible);
    if (this.isVisible) {
      this.resize();
      if (!this.rafId) {
        this.clock.start();
        this.animate();
      }
    } else if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  animate() {
    if (!this.isVisible) return;
    this.rafId = requestAnimationFrame(() => this.animate());

    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;

    // 1. Smooth Camera Damping + Optional Gentle Auto-Orbit
    if (this.orbit.autoRotate && !this.orbit.dragging) {
      this.orbit.goalTheta += dt * 0.22;
    }
    const damp = 1 - Math.exp(-8 * dt);
    this.orbit.theta += (this.orbit.goalTheta - this.orbit.theta) * damp;
    this.orbit.phi += (this.orbit.goalPhi - this.orbit.phi) * damp;
    this.orbit.radius += (this.orbit.goalRadius - this.orbit.radius) * damp;
    this.orbit.target.lerp(this.orbit.goalTarget, damp);

    const sinPhi = Math.sin(this.orbit.phi);
    this.camera.position.set(
      this.orbit.target.x + this.orbit.radius * sinPhi * Math.sin(this.orbit.theta),
      this.orbit.target.y + this.orbit.radius * Math.cos(this.orbit.phi),
      this.orbit.target.z + this.orbit.radius * sinPhi * Math.cos(this.orbit.theta)
    );
    this.camera.lookAt(this.orbit.target);

    // 2. Smooth Exploded View Interpolation
    this.explodeCurrent += (this.explodeTarget - this.explodeCurrent) * (1 - Math.exp(-9 * dt));
    for (let i = 0; i < this.explodableParts.length; i++) {
      const item = this.explodableParts[i];
      item.obj.position.lerpVectors(
        item.basePos,
        item.basePos.clone().add(item.offset),
        this.explodeCurrent
      );
    }

    // Fade internal wiring gracefully when heavily exploded so wires don't float detached
    if (this.wiringGroup) {
      const wireVis = Math.max(0, 1 - this.explodeCurrent * 1.45);
      this.wiringGroup.visible = wireVis > 0.02;
      this.wiringGroup.children.forEach((w) => {
        if (w.material) w.material.opacity = wireVis * 0.95;
      });
    }

    // 3. Live Optical Emitter & Volumetric Beam Animation
    const beamActive = this.morsePulseOn || this.steadyBeamOn;
    const targetBeam = beamActive ? 1.0 : 0.0;
    const beamSpeed = beamActive ? 28 : 18;
    const curIntensity = this.opticalPointLight.intensity / 18;
    const nextIntensity = curIntensity + (targetBeam - curIntensity) * (1 - Math.exp(-beamSpeed * dt));

    this.opticalPointLight.intensity = nextIntensity * 18;
    this.ledDieMat.emissiveIntensity = 0.25 + nextIntensity * 5.2;
    this.beamOuterMat.opacity = nextIntensity * 0.22;
    this.beamInnerMat.opacity = nextIntensity * 0.34;
    this.lensFlareMat.opacity = nextIntensity * 0.65;

    // 4. GPIO 18 PWM Wire & LED Drive Lead Live Pulse Glow!
    if (this.gpioSignalWireMat) {
      this.gpioSignalWireMat.emissiveIntensity = 0.1 + nextIntensity * 2.4;
    }
    if (this.ledDriveWireMat) {
      this.ledDriveWireMat.emissiveIntensity = 0.08 + nextIntensity * 1.9;
    }

    // 5. Pi CM5 Activity LED & MEMS Mic Voice Ring & USB-C LED
    if (this.piActLedMat) {
      const pulse = this.voiceListening || beamActive
        ? 0.6 + 0.6 * Math.abs(Math.sin(t * 14))
        : 0.35 + 0.25 * Math.sin(t * 2.5);
      this.piActLedMat.emissiveIntensity = pulse;
    }
    if (this.micRingMat) {
      this.micRingMat.emissiveIntensity = this.voiceListening
        ? 0.9 + 0.8 * Math.abs(Math.sin(t * 8))
        : 0.12;
    }
    if (this.usbcLedMat) {
      this.usbcLedMat.emissiveIntensity = 0.55 + 0.25 * Math.sin(t * 1.8);
    }

    // 6. Tactile 3D Button Press Spring Animation
    Object.keys(this.buttonPressAnim).forEach((btnId) => {
      if (this.buttonPressAnim[btnId] > 0.001) {
        this.buttonPressAnim[btnId] = Math.max(0, this.buttonPressAnim[btnId] - dt * 5.5);
        const cap = this.buttonMeshes[btnId];
        if (cap) {
          cap.position.y = 0.05 - this.buttonPressAnim[btnId] * 0.045;
        }
      }
    });

    this.renderer.render(this.scene, this.camera);
  }
}

export const torchDigitalTwin = new TorchDigitalTwin();
