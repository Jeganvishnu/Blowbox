/**
 * BLOW BOX — INTERACTIVE 3D SCROLL & EXPERIENCE ENGINE
 * High-performance WebGL (Three.js) scene with dynamic brand storytelling:
 * 1. Assembled Hero Emblem -> 2. Transformation -> 3. Services -> 4. Split-Screen About -> 5. Final Reassembly
 */

(function () {
  'use strict';

  // --- Global State ---
  let scene, camera, renderer;
  let emblemGroup, ribbonTop, ribbonBottom, ribbonStem, goldBevelGroup, codeCube, voxelsGroup, pedestalGroup;
  let codeGlyphTexture, canvasTextureCtx, canvasElement;
  let ambientLight, keyLight, cyanLight, goldLight, rimLight;

  // Intro Portal & Interactive State
  let appState = 'intro'; // 'intro' | 'entering' | 'entered'
  let introOrbitalGroup, cyanOrbitalRing, goldOrbitalRing;
  let cyanRingMat, goldRingMat;
  let orbitalDiamonds = [];
  let introTransition = 0;
  let raycaster, pointer;

  let windowWidth = window.innerWidth;
  let windowHeight = window.innerHeight;
  let mouseX = 0, mouseY = 0;
  let targetMouseX = 0, targetMouseY = 0;
  let currentScroll = 0, targetScroll = 0, maxScroll = 1;
  let scrollProgress = 0, targetScrollProgress = 0;
  let clock = new THREE.Clock();
  let reassemblyPulse = 0;
  let isMobile = windowWidth < 768;

  // --- Initial Setup ---
  function init() {
    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();

    initThreeScene();
    createProceduralEmblem();
    createIntroOrbitalRings();
    createPedestal();
    setupLighting();
    setupEventListeners();
    setupServiceCards();
    setupContactForm();
    setupNavigation();
    updateScrollMetrics();
    animate();
  }

  // --- Three.js Scene Setup ---
  function initThreeScene() {
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas) return;

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070d18, 0.022);

    camera = new THREE.PerspectiveCamera(42, windowWidth / windowHeight, 0.1, 100);
    camera.position.set(0, 0, 11);

    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(windowWidth, windowHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  // --- Showroom Lighting ---
  function setupLighting() {
    // Ambient soft blue fill
    ambientLight = new THREE.AmbientLight(0xcae8ff, 1.4);
    scene.add(ambientLight);

    // Warm metallic gold key light
    keyLight = new THREE.DirectionalLight(0xfff3d6, 2.4);
    keyLight.position.set(6, 7, 7);
    scene.add(keyLight);

    // Electric cyan side fill
    cyanLight = new THREE.DirectionalLight(0x00e5ff, 2.0);
    cyanLight.position.set(-6, -2, 5);
    scene.add(cyanLight);

    // Warm gold floor point light
    goldLight = new THREE.PointLight(0xf59e0b, 3.2, 25);
    goldLight.position.set(4, -3, 3);
    scene.add(goldLight);

    // Back rim light for sharp metallic bevels
    rimLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    rimLight.position.set(0, 5, -6);
    scene.add(rimLight);
  }

  // --- Generate Code Glyph Canvas Texture (</>) ---
  function createCodeGlyphTexture() {
    canvasElement = document.createElement('canvas');
    canvasElement.width = 512;
    canvasElement.height = 512;
    canvasTextureCtx = canvasElement.getContext('2d');

    renderCodeTexture(0);
    codeGlyphTexture = new THREE.CanvasTexture(canvasElement);
    codeGlyphTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return codeGlyphTexture;
  }

  function renderCodeTexture(intensityBoost) {
    if (!canvasTextureCtx) return;
    const ctx = canvasTextureCtx;
    const w = 512, h = 512;

    // Rich metallic azure gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#0066ee');
    bgGrad.addColorStop(1, '#002577');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle edge highlight
    ctx.strokeStyle = `rgba(0, 229, 255, ${0.4 + intensityBoost * 0.5})`;
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, w - 14, h - 14);

    // Soft cybernetic grid overlay
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 2;
    for (let i = 40; i < w; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }

    // Glowing Code Glyph </>
    ctx.save();
    ctx.translate(w / 2, h / 2);

    // Outer glow
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 30 + intensityBoost * 40;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 26;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Left chevron <
    ctx.beginPath();
    ctx.moveTo(-75, -85);
    ctx.lineTo(-145, 0);
    ctx.lineTo(-75, 85);
    ctx.stroke();

    // Center slash /
    ctx.beginPath();
    ctx.moveTo(35, -115);
    ctx.lineTo(-35, 115);
    ctx.stroke();

    // Right chevron >
    ctx.beginPath();
    ctx.moveTo(75, -85);
    ctx.lineTo(145, 0);
    ctx.lineTo(75, 85);
    ctx.stroke();

    ctx.restore();

    if (codeGlyphTexture) codeGlyphTexture.needsUpdate = true;
  }

  // --- High-Fidelity 3D Blow Box Logo Model ---
  function createProceduralEmblem() {
    emblemGroup = new THREE.Group();

    // 1. Materials
    const blueRibbonMat = new THREE.MeshPhysicalMaterial({
      color: 0x007bff,
      emissive: 0x001a44,
      roughness: 0.18,
      metalness: 0.88,
      clearcoat: 0.8,
      clearcoatRoughness: 0.12,
      reflectivity: 0.9,
    });

    const goldRibbonMat = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      emissive: 0x3d2102,
      roughness: 0.22,
      metalness: 0.94,
      clearcoat: 0.5,
      clearcoatRoughness: 0.15,
      reflectivity: 0.95,
    });

    const cubeSideMat = new THREE.MeshPhysicalMaterial({
      color: 0x0055dd,
      emissive: 0x001538,
      roughness: 0.2,
      metalness: 0.85,
      clearcoat: 0.7,
    });

    const cubeTopMat = new THREE.MeshPhysicalMaterial({
      color: 0xfbbf24,
      emissive: 0x422204,
      roughness: 0.2,
      metalness: 0.92,
      clearcoat: 0.6,
    });

    const codeTexture = createCodeGlyphTexture();
    const cubeFrontMat = new THREE.MeshBasicMaterial({
      map: codeTexture,
    });

    // 2. Top Ribbon of 'B' (Curved sweeping upper wing)
    ribbonTop = new THREE.Group();
    const topShape = new THREE.Shape();
    // Path defining upper loop of the B
    topShape.moveTo(-1.4, 0.1);
    topShape.lineTo(-1.4, 2.0);
    topShape.bezierCurveTo(-0.6, 2.05, 1.4, 2.0, 1.4, 0.9);
    topShape.bezierCurveTo(1.4, 0.15, 0.4, 0.1, -0.2, 0.1);
    topShape.closePath();

    const topHole = new THREE.Path();
    topHole.moveTo(-0.7, 0.6);
    topHole.lineTo(-0.7, 1.45);
    topHole.bezierCurveTo(-0.2, 1.45, 0.75, 1.4, 0.75, 0.9);
    topHole.bezierCurveTo(0.75, 0.6, 0.1, 0.6, -0.7, 0.6);
    topShape.holes.push(topHole);

    const extrudeSettingsTop = {
      steps: 2,
      depth: 0.7,
      bevelEnabled: true,
      bevelThickness: 0.14,
      bevelSize: 0.12,
      bevelSegments: 8,
    };

    const topBlueMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(topShape, extrudeSettingsTop), blueRibbonMat);
    topBlueMesh.castShadow = true;
    topBlueMesh.receiveShadow = true;
    ribbonTop.add(topBlueMesh);

    // Inner gold bevel for top loop
    const topGoldShape = new THREE.Shape();
    topGoldShape.moveTo(-0.65, 0.65);
    topGoldShape.lineTo(-0.65, 1.4);
    topGoldShape.bezierCurveTo(-0.1, 1.4, 0.68, 1.35, 0.68, 0.9);
    topGoldShape.bezierCurveTo(0.68, 0.65, 0.1, 0.65, -0.65, 0.65);
    const topGoldMesh = new THREE.Mesh(
      new THREE.ExtrudeGeometry(topGoldShape, { depth: 0.76, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 4 }),
      goldRibbonMat
    );
    topGoldMesh.position.set(0, 0, -0.03);
    ribbonTop.add(topGoldMesh);

    emblemGroup.add(ribbonTop);

    // 3. Bottom Ribbon of 'B' (Curved sweeping lower wing)
    ribbonBottom = new THREE.Group();
    const btmShape = new THREE.Shape();
    btmShape.moveTo(-1.4, 0.05);
    btmShape.lineTo(-0.15, 0.05);
    btmShape.bezierCurveTo(0.65, 0.05, 1.75, -0.05, 1.75, -1.05);
    btmShape.bezierCurveTo(1.75, -2.1, -0.3, -2.1, -1.4, -2.1);
    btmShape.closePath();

    const btmHole = new THREE.Path();
    btmHole.moveTo(-0.7, -0.45);
    btmHole.lineTo(0.0, -0.45);
    btmHole.bezierCurveTo(0.6, -0.45, 1.05, -0.55, 1.05, -1.05);
    btmHole.bezierCurveTo(1.05, -1.55, 0.35, -1.55, -0.7, -1.55);
    btmShape.holes.push(btmHole);

    const extrudeSettingsBtm = {
      steps: 2,
      depth: 0.7,
      bevelEnabled: true,
      bevelThickness: 0.14,
      bevelSize: 0.12,
      bevelSegments: 8,
    };

    const btmBlueMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(btmShape, extrudeSettingsBtm), blueRibbonMat);
    btmBlueMesh.castShadow = true;
    btmBlueMesh.receiveShadow = true;
    ribbonBottom.add(btmBlueMesh);

    // Inner gold bevel for bottom loop
    const btmGoldShape = new THREE.Shape();
    btmGoldShape.moveTo(-0.65, -0.5);
    btmGoldShape.lineTo(0.0, -0.5);
    btmGoldShape.bezierCurveTo(0.5, -0.5, 0.95, -0.6, 0.95, -1.05);
    btmGoldShape.bezierCurveTo(0.95, -1.5, 0.3, -1.5, -0.65, -1.5);
    const btmGoldMesh = new THREE.Mesh(
      new THREE.ExtrudeGeometry(btmGoldShape, { depth: 0.76, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 4 }),
      goldRibbonMat
    );
    btmGoldMesh.position.set(0, 0, -0.03);
    ribbonBottom.add(btmGoldMesh);

    emblemGroup.add(ribbonBottom);

    // 4. Central 3D Isometric Code Box (The core Box)
    codeCube = new THREE.Group();
    const cubeMaterials = [
      cubeSideMat,   // +x
      cubeSideMat,   // -x
      cubeTopMat,    // +y (Gold top plate)
      cubeSideMat,   // -y
      cubeFrontMat,  // +z (Glowing </> code glyph)
      cubeSideMat,   // -z
    ];

    const boxGeom = new THREE.BoxGeometry(1.25, 1.25, 1.25);
    const boxMesh = new THREE.Mesh(boxGeom, cubeMaterials);
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    codeCube.add(boxMesh);

    // Subtle golden corner chamfer edges
    const wireGeom = new THREE.BoxGeometry(1.27, 1.27, 1.27);
    const wireMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, wireframe: true, transparent: true, opacity: 0.35 });
    codeCube.add(new THREE.Mesh(wireGeom, wireMat));

    // Position centrally nestled inside the B
    codeCube.position.set(0.1, -0.05, 0.6);
    codeCube.rotation.set(0.38, -0.58, 0.22);
    emblemGroup.add(codeCube);

    // 5. Floating Digital Voxels (Top-Right of B)
    voxelsGroup = new THREE.Group();
    const voxelOffsets = [
      { x: 1.6, y: 1.2, z: 0.3, s: 0.24, mat: blueRibbonMat, speed: 1.2, dir: 1 },
      { x: 1.9, y: 1.7, z: 0.5, s: 0.28, mat: blueRibbonMat, speed: 0.9, dir: -1 },
      { x: 2.1, y: 0.8, z: 0.1, s: 0.22, mat: goldRibbonMat, speed: 1.4, dir: 1 },
      { x: 2.4, y: 1.4, z: 0.4, s: 0.26, mat: goldRibbonMat, speed: 1.1, dir: -1 },
      { x: 1.8, y: 2.2, z: 0.6, s: 0.30, mat: blueRibbonMat, speed: 0.8, dir: 1 },
      { x: 2.5, y: 2.1, z: 0.2, s: 0.20, mat: blueRibbonMat, speed: 1.3, dir: -1 },
      { x: 2.3, y: 0.2, z: 0.0, s: 0.18, mat: goldRibbonMat, speed: 1.5, dir: 1 },
      { x: 2.7, y: 1.0, z: 0.5, s: 0.22, mat: goldRibbonMat, speed: 1.0, dir: -1 },
    ];

    voxelOffsets.forEach((v) => {
      const geom = new THREE.BoxGeometry(v.s, v.s, v.s);
      const mesh = new THREE.Mesh(geom, v.mat);
      mesh.position.set(v.x, v.y, v.z);
      mesh.castShadow = true;
      mesh.userData = { ...v, baseX: v.x, baseY: v.y, baseZ: v.z };
      voxelsGroup.add(mesh);
    });

    emblemGroup.add(voxelsGroup);

    // Initial Emblem Orientation
    emblemGroup.position.set(0, 0.1, 0);
    scene.add(emblemGroup);
  }

  // --- Cinematic Intro 3D Orbital Rings with Diamond Satellites ---
  function createIntroOrbitalRings() {
    introOrbitalGroup = new THREE.Group();

    // 1. Cyan Luminous Orbital Ring (Tilted Ellipse)
    cyanRingMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.85 });
    const cyanCurve = new THREE.EllipseCurve(0, 0, 4.2, 2.3, 0, Math.PI * 2, false, 0);
    const cyanPts = cyanCurve.getPoints(120).map(p => new THREE.Vector3(p.x, p.y, 0));
    const cyanPath = new THREE.CatmullRomCurve3(cyanPts, true);
    cyanOrbitalRing = new THREE.Mesh(new THREE.TubeGeometry(cyanPath, 100, 0.024, 8, true), cyanRingMat);
    cyanOrbitalRing.rotation.set(1.18, 0.32, 0.22);
    introOrbitalGroup.add(cyanOrbitalRing);

    // 2. Gold Luminous Orbital Ring (Tilted in opposite diagonal)
    goldRingMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.75 });
    const goldCurve = new THREE.EllipseCurve(0, 0, 4.6, 2.6, 0, Math.PI * 2, false, 0);
    const goldPts = goldCurve.getPoints(120).map(p => new THREE.Vector3(p.x, p.y, 0));
    const goldPath = new THREE.CatmullRomCurve3(goldPts, true);
    goldOrbitalRing = new THREE.Mesh(new THREE.TubeGeometry(goldPath, 100, 0.022, 8, true), goldRingMat);
    goldOrbitalRing.rotation.set(-1.08, -0.42, -0.22);
    introOrbitalGroup.add(goldOrbitalRing);

    // 3. Diamond Nodes (Physical Octahedrons)
    const cyanDiamondMat = new THREE.MeshPhysicalMaterial({
      color: 0x00e5ff,
      emissive: 0x00a2ff,
      emissiveIntensity: 0.9,
      roughness: 0.12,
      metalness: 0.9,
      clearcoat: 1.0,
    });

    const goldDiamondMat = new THREE.MeshPhysicalMaterial({
      color: 0xffd166,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.9,
      roughness: 0.12,
      metalness: 0.9,
      clearcoat: 1.0,
    });

    // Satellites on Cyan Ring
    for (let i = 0; i < 4; i++) {
      const size = 0.18 + (i % 2) * 0.06;
      const dMesh = new THREE.Mesh(new THREE.OctahedronGeometry(size, 0), cyanDiamondMat);
      introOrbitalGroup.add(dMesh);
      orbitalDiamonds.push({
        mesh: dMesh,
        curve: cyanCurve,
        ringRot: cyanOrbitalRing.rotation,
        angle: (i / 4) * Math.PI * 2,
        speed: 0.5,
      });
    }

    // Satellites on Gold Ring
    for (let i = 0; i < 4; i++) {
      const size = 0.16 + (i % 2) * 0.05;
      const dMesh = new THREE.Mesh(new THREE.OctahedronGeometry(size, 0), goldDiamondMat);
      introOrbitalGroup.add(dMesh);
      orbitalDiamonds.push({
        mesh: dMesh,
        curve: goldCurve,
        ringRot: goldOrbitalRing.rotation,
        angle: (i / 4) * Math.PI * 2 + 0.35,
        speed: -0.42,
      });
    }

    // Ambient floating background micro-diamonds
    for (let i = 0; i < 18; i++) {
      const isGold = i % 2 === 0;
      const mMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.06 + Math.random() * 0.06, 0),
        isGold ? goldDiamondMat : cyanDiamondMat
      );
      mMesh.position.set(
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 9,
        (Math.random() - 0.5) * 5 - 0.5
      );
      introOrbitalGroup.add(mMesh);
    }

    scene.add(introOrbitalGroup);
  }

  function updateOrbitalDiamonds(elapsedTime) {
    orbitalDiamonds.forEach((d) => {
      d.angle += d.speed * 0.015;
      const u = ((d.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / (Math.PI * 2);
      const pt = d.curve.getPoint(u);
      const pos = new THREE.Vector3(pt.x, pt.y, 0);
      pos.applyEuler(d.ringRot);
      d.mesh.position.copy(pos);
      d.mesh.rotation.x += 0.025;
      d.mesh.rotation.y += 0.035;
    });
  }

  // --- Showroom Floor Pedestal ---
  function createPedestal() {
    pedestalGroup = new THREE.Group();

    // Inner Concentric Cyan Ring
    const innerRingGeom = new THREE.TorusGeometry(3.6, 0.03, 16, 100);
    const innerRingMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.6 });
    const innerRing = new THREE.Mesh(innerRingGeom, innerRingMat);
    innerRing.rotation.x = Math.PI / 2;
    pedestalGroup.add(innerRing);

    // Outer Concentric Gold Ring
    const outerRingGeom = new THREE.TorusGeometry(4.8, 0.04, 16, 100);
    const outerRingMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.5 });
    const outerRing = new THREE.Mesh(outerRingGeom, outerRingMat);
    outerRing.rotation.x = Math.PI / 2;
    pedestalGroup.add(outerRing);

    pedestalGroup.position.set(0, -3.2, 0);
    scene.add(pedestalGroup);
  }

  // --- Scroll & Storyline State Controller ---
  function updateScrollMetrics() {
    currentScroll = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    maxScroll = Math.max(docHeight, 1);
    targetScrollProgress = Math.min(Math.max(currentScroll / maxScroll, 0), 1);
  }

  // Linear Interpolation helper
  function lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  // Smooth Hermite Curve (Ease In-Out)
  function smoothStep(edge0, edge1, x) {
    const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
    return t * t * (3 - 2 * t);
  }

  // --- Storyline 3D Choreography ---
  function update3DStoryline(elapsedTime) {
    // Smooth mouse inertia
    mouseX = lerp(mouseX, targetMouseX, 0.06);
    mouseY = lerp(mouseY, targetMouseY, 0.06);

    const isDesktop = windowWidth >= 768;

    // ==========================================
    // 0. INTRO STATE (Before Click to Enter)
    // The "B" emblem actively floats and moves
    // ==========================================
    if (appState === 'intro') {
      const introFloatY = Math.sin(elapsedTime * 1.8) * 0.28;
      const introFloatX = Math.sin(elapsedTime * 1.1) * 0.16;
      const introRotY = Math.sin(elapsedTime * 1.2) * 0.25 + mouseX * 0.45;
      const introRotX = Math.cos(elapsedTime * 0.9) * 0.12 + mouseY * 0.3;

      emblemGroup.position.x = lerp(emblemGroup.position.x, introFloatX, 0.08);
      emblemGroup.position.y = lerp(emblemGroup.position.y, 0.35 + introFloatY, 0.08);
      emblemGroup.position.z = lerp(emblemGroup.position.z, 0.5, 0.08);

      emblemGroup.rotation.x = lerp(emblemGroup.rotation.x, introRotX, 0.08);
      emblemGroup.rotation.y = lerp(emblemGroup.rotation.y, introRotY, 0.08);
      emblemGroup.rotation.z = Math.sin(elapsedTime * 0.8) * 0.04;
      emblemGroup.scale.setScalar(lerp(emblemGroup.scale.x, isDesktop ? 1.05 : 0.85, 0.08));

      // Keep logo intact in rest assembled coordinates
      ribbonTop.position.set(0, 0, 0);
      ribbonTop.rotation.set(0, 0, 0);
      ribbonBottom.position.set(0, 0, 0);
      ribbonBottom.rotation.set(0, 0, 0);
      codeCube.position.set(0.1, -0.05, 0.6);
      codeCube.rotation.set(0.38, -0.58, 0.22);
      renderCodeTexture(0.35 + Math.sin(elapsedTime * 2.5) * 0.25);

      voxelsGroup.children.forEach((mesh) => {
        const u = mesh.userData;
        mesh.position.x = u.baseX + Math.sin(elapsedTime * u.speed * 0.6) * 0.06;
        mesh.position.y = u.baseY + Math.cos(elapsedTime * u.speed * 0.6) * 0.06;
        mesh.position.z = u.baseZ;
      });

      // Orbital rings rotate actively around the B logo
      if (introOrbitalGroup) {
        introOrbitalGroup.visible = true;
        introOrbitalGroup.position.copy(emblemGroup.position);
        if (cyanOrbitalRing) cyanOrbitalRing.rotation.z = elapsedTime * 0.35;
        if (goldOrbitalRing) goldOrbitalRing.rotation.z = -elapsedTime * 0.28;
        introOrbitalGroup.rotation.y = elapsedTime * 0.15 + mouseX * 0.25;
        introOrbitalGroup.rotation.x = Math.sin(elapsedTime * 0.6) * 0.06 + mouseY * 0.18;
        updateOrbitalDiamonds(elapsedTime);
      }

      if (pedestalGroup) {
        pedestalGroup.visible = false;
      }
      return;
    }

    // ==========================================
    // 0.5. ENTERING TRANSITION SEQUENCE
    // ==========================================
    if (appState === 'entering') {
      introTransition = Math.min(introTransition + 0.028, 1.0);
      const t = smoothStep(0, 1, introTransition);

      // Expand and fade out orbital rings
      if (introOrbitalGroup) {
        introOrbitalGroup.scale.setScalar(1 + t * 2.5);
        if (cyanRingMat) cyanRingMat.opacity = (1 - t) * 0.85;
        if (goldRingMat) goldRingMat.opacity = (1 - t) * 0.75;
      }

      // Smoothly transition emblem from intro center to hero landing position
      const heroFloatingY = Math.sin(elapsedTime * 1.5) * 0.12;
      emblemGroup.position.x = lerp(emblemGroup.position.x, 0, 0.1);
      emblemGroup.position.y = lerp(emblemGroup.position.y, heroFloatingY, 0.1);
      emblemGroup.position.z = lerp(emblemGroup.position.z, 0, 0.1);
      emblemGroup.rotation.x = lerp(emblemGroup.rotation.x, mouseY * 0.25, 0.1);
      emblemGroup.rotation.y = lerp(emblemGroup.rotation.y, mouseX * 0.35, 0.1);
      emblemGroup.rotation.z = lerp(emblemGroup.rotation.z, 0, 0.1);
      emblemGroup.scale.setScalar(lerp(emblemGroup.scale.x, isDesktop ? 1.0 : 0.8, 0.1));

      if (pedestalGroup) {
        pedestalGroup.visible = true;
        pedestalGroup.position.y = lerp(-12, -3.2, t);
      }

      if (introTransition >= 1.0) {
        appState = 'entered';
        if (introOrbitalGroup) introOrbitalGroup.visible = false;
      }
      return;
    }

    // ==========================================
    // 1. ENTERED STATE: NATURAL SCROLL STORYLINE
    // ==========================================
    // Smooth scroll interpolation
    scrollProgress = lerp(scrollProgress, targetScrollProgress, 0.08);
    const p = scrollProgress;

    // Phase 1: Hero State (p: 0.0 -> 0.18)
    // Logo assembled, floating with natural breathing animation & cursor tilt
    const heroFloatingY = Math.sin(elapsedTime * 1.5) * 0.12;
    const heroFloatingRotY = Math.sin(elapsedTime * 0.8) * 0.06;

    // Phase 2: Transformation & Expansion (p: 0.18 -> 0.45)
    const transformFactor = smoothStep(0.16, 0.42, p);

    // Phase 3: Services Section ambient background (p: 0.42 -> 0.68)
    const servicesFactor = smoothStep(0.40, 0.68, p);

    // Phase 4: About Section Split-Screen right half (p: 0.68 -> 0.84)
    const aboutFactor = smoothStep(0.68, 0.84, p);

    // Phase 5: Contact Finale & Logo Reassembly (p: 0.84 -> 1.00)
    const reassemblyFactor = smoothStep(0.84, 0.96, p);

    // --- Sub-component Transformation Calculations ---
    if (reassemblyFactor < 0.98) {
      // Elements are separating / transforming
      const separation = transformFactor * (1 - reassemblyFactor);

      // Top ribbon lifts and rotates outward
      ribbonTop.position.y = separation * 1.5;
      ribbonTop.position.x = separation * 0.45;
      ribbonTop.position.z = -separation * 0.4;
      ribbonTop.rotation.z = separation * 0.28;
      ribbonTop.rotation.y = -separation * 0.3;

      // Bottom ribbon drops and glides downward
      ribbonBottom.position.y = -separation * 1.35;
      ribbonBottom.position.x = -separation * 0.35;
      ribbonBottom.position.z = -separation * 0.3;
      ribbonBottom.rotation.z = -separation * 0.22;
      ribbonBottom.rotation.y = separation * 0.25;

      // Central Code Box floats forward toward camera with code glowing
      codeCube.position.z = 0.6 + separation * 2.5;
      codeCube.position.y = -0.05 + separation * 0.35;
      codeCube.rotation.y = -0.58 + separation * 1.4 + elapsedTime * 0.35 * separation;
      codeCube.rotation.x = 0.38 + separation * 0.4;

      // Pulse code glyph glow based on transformation
      renderCodeTexture(separation * 0.9);

      // Floating voxels expand outward in orbit
      voxelsGroup.children.forEach((mesh) => {
        const u = mesh.userData;
        const radialMultiplier = 1 + separation * 2.2;
        mesh.position.x = u.baseX * radialMultiplier + Math.sin(elapsedTime * u.speed) * 0.15;
        mesh.position.y = u.baseY * radialMultiplier + Math.cos(elapsedTime * u.speed) * 0.15;
        mesh.position.z = u.baseZ * radialMultiplier + Math.sin(elapsedTime * u.speed * 0.5) * 0.2;
        mesh.rotation.x += 0.01 * u.dir;
        mesh.rotation.y += 0.015 * u.dir;
      });
    } else {
      // FULLY REASSEMBLED FINALE!
      // Reverse gravitational pull locks everything back with precision
      ribbonTop.position.set(0, 0, 0);
      ribbonTop.rotation.set(0, 0, 0);

      ribbonBottom.position.set(0, 0, 0);
      ribbonBottom.rotation.set(0, 0, 0);

      codeCube.position.set(0.1, -0.05, 0.6);
      codeCube.rotation.set(0.38, -0.58, 0.22);

      renderCodeTexture(0.3 + Math.sin(elapsedTime * 3) * 0.2);

      voxelsGroup.children.forEach((mesh) => {
        const u = mesh.userData;
        mesh.position.x = u.baseX + Math.sin(elapsedTime * u.speed * 0.5) * 0.05;
        mesh.position.y = u.baseY + Math.cos(elapsedTime * u.speed * 0.5) * 0.05;
        mesh.position.z = u.baseZ;
      });

      // Pulse effect on reassembly
      reassemblyPulse = Math.min(reassemblyPulse + 0.04, 1.0);
    }

    // --- Overall Emblem Spatial Positioning across Story Stages ---
    let targetX = 0;
    let targetY = heroFloatingY;
    let targetZ = 0;
    let targetRotY = heroFloatingRotY + (isDesktop ? mouseX * 0.35 : 0);
    let targetRotX = isDesktop ? mouseY * 0.25 : 0;
    let targetScale = isDesktop ? 1.0 : 0.8;

    if (p > 0.22 && p <= 0.65) {
      // Services section: Push back slightly to let cards shine
      targetZ = -1.8;
      targetY = 0.5 + heroFloatingY;
      targetRotY += 0.25;
    } else if (p > 0.65 && p <= 0.85) {
      // About Section: Move to right side of screen (Split-screen 3D showcase)
      if (isDesktop) {
        targetX = 2.7;
        targetY = -0.1;
        targetZ = 0.3;
        targetRotY = 0.45 + mouseX * 0.3;
        targetScale = 1.05;
      } else {
        targetX = 0;
        targetY = 0.8;
        targetScale = 0.75;
      }
    } else if (p > 0.85) {
      // Contact Finale: Center stage above the CTA
      targetX = 0;
      targetY = isDesktop ? 0.3 : 0.5;
      targetZ = 0.8;
      targetRotY = heroFloatingRotY * 1.5 + (isDesktop ? mouseX * 0.2 : 0);
      targetScale = isDesktop ? 1.15 : 0.9;
    }

    emblemGroup.position.x = lerp(emblemGroup.position.x, targetX, 0.08);
    emblemGroup.position.y = lerp(emblemGroup.position.y, targetY, 0.08);
    emblemGroup.position.z = lerp(emblemGroup.position.z, targetZ, 0.08);
    emblemGroup.rotation.x = lerp(emblemGroup.rotation.x, targetRotX, 0.08);
    emblemGroup.rotation.y = lerp(emblemGroup.rotation.y, targetRotY, 0.08);
    emblemGroup.scale.setScalar(lerp(emblemGroup.scale.x, targetScale, 0.08));

    // Showroom Pedestal rotation and light pulse
    pedestalGroup.rotation.z = elapsedTime * 0.15;
    pedestalGroup.position.x = emblemGroup.position.x;
    pedestalGroup.position.z = emblemGroup.position.z;
    pedestalGroup.position.y = -3.2 + emblemGroup.position.y * 0.4;
  }

  // --- Cinematic Entrance Trigger ---
  function enterExperience() {
    if (appState !== 'intro') return;
    appState = 'entering';
    document.body.style.cursor = '';

    const portal = document.getElementById('intro-portal');
    if (portal) portal.classList.add('exit-transition');

    setTimeout(() => {
      document.body.classList.remove('intro-mode');
      document.body.classList.add('entered');
      window.scrollTo(0, 0);
      updateScrollMetrics();
    }, 350);

    setTimeout(() => {
      if (portal) portal.style.display = 'none';
      appState = 'entered';
      if (introOrbitalGroup) introOrbitalGroup.visible = false;
    }, 1000);
  }

  // --- Animation Loop ---
  function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();
    update3DStoryline(elapsedTime);
    renderer.render(scene, camera);
  }

  // --- Event Listeners ---
  function setupEventListeners() {
    // Window Resize
    window.addEventListener('resize', () => {
      windowWidth = window.innerWidth;
      windowHeight = window.innerHeight;
      isMobile = windowWidth < 768;

      camera.aspect = windowWidth / windowHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(windowWidth, windowHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      updateScrollMetrics();
    });

    // Pointer / Mouse Tracking for 3D Parallax & Raycasting
    window.addEventListener('pointermove', (e) => {
      targetMouseX = (e.clientX / windowWidth) * 2 - 1;
      targetMouseY = -(e.clientY / windowHeight) * 2 + 1;

      pointer.x = targetMouseX;
      pointer.y = targetMouseY;

      // Hover feedback when hovering over 3D B logo in intro state
      if (appState === 'intro' && raycaster && emblemGroup) {
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(emblemGroup.children, true);
        if (hits.length > 0) {
          document.body.style.cursor = 'pointer';
        } else {
          document.body.style.cursor = '';
        }
      }
    });

    // Click on 3D B Logo to Enter
    window.addEventListener('click', () => {
      if (appState === 'intro' && raycaster && emblemGroup) {
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(emblemGroup.children, true);
        if (hits.length > 0) {
          enterExperience();
        }
      }
    });

    // Click on "CLICK TO ENTER →" Button
    const btnEnter = document.getElementById('btn-enter');
    if (btnEnter) {
      btnEnter.addEventListener('click', enterExperience);
    }

    // Scroll Tracking
    window.addEventListener('scroll', updateScrollMetrics, { passive: true });

    // Header Scroll State
    const header = document.querySelector('.site-header');
    window.addEventListener('scroll', () => {
      if (!header) return;
      if (window.scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // --- 3D Interactive Service Cards System ---
  const servicesData = [
    {
      id: 1,
      title: 'Web Development',
      num: '01',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
      desc: 'High-performance, ultra-responsive modern web applications engineered with Next.js, WebGL, and scalable cloud architectures.',
      stacks: ['React', 'Next.js', 'TypeScript', 'Node.js', 'Tailwind', 'Three.js', 'Vercel Edge'],
      deliverables: ['Custom Web Applications', 'JAMstack & Headless CMS', 'High-Speed E-Commerce', 'Interactive 3D Showcases'],
    },
    {
      id: 2,
      title: 'Software Development',
      num: '02',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
      desc: 'Robust custom enterprise software, microservices architectures, and distributed systems tailored to unique business workflows.',
      stacks: ['Go', 'Python', 'Java', 'C# / .NET', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes'],
      deliverables: ['Enterprise ERP & CRM', 'API & Microservice Mesh', 'Automated Data Pipelines', 'Legacy Modernization'],
    },
    {
      id: 3,
      title: 'Mobile Applications',
      num: '03',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
      desc: 'Native and cross-platform mobile experiences for iOS and Android that deliver 60fps fluidity, intuitive UX, and secure offline sync.',
      stacks: ['Swift / SwiftUI', 'Kotlin', 'Flutter', 'React Native', 'Firebase', 'GraphQL'],
      deliverables: ['iOS App Development', 'Android App Development', 'Cross-Platform Unification', 'App Store Optimization'],
    },
    {
      id: 4,
      title: 'UI/UX Design',
      num: '04',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
      desc: 'Human-centered digital product interfaces, comprehensive design systems, and immersive prototypes built for delight and high conversion.',
      stacks: ['Figma', 'Design Tokens', 'Design Systems', 'Micro-Interactions', 'Prototyping', 'Accessibility (WCAG)'],
      deliverables: ['User Research & Wireframes', 'Design Systems & UI Kits', 'High-Fidelity Mockups', 'Interactive Prototypes'],
    },
    {
      id: 5,
      title: 'Cloud Solutions',
      num: '05',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>',
      desc: 'Resilient multi-cloud infrastructure, automated CI/CD pipelines, container orchestration, and cost-optimized serverless architectures.',
      stacks: ['AWS', 'Google Cloud (GCP)', 'Microsoft Azure', 'Terraform', 'Kubernetes', 'Cloudflare Workers'],
      deliverables: ['Cloud Migration & Auditing', 'Infrastructure as Code (IaC)', 'Zero-Downtime CI/CD', 'Cost & Scalability Optimization'],
    },
    {
      id: 6,
      title: 'AI & Automation',
      num: '06',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>',
      desc: 'Intelligent process automation, custom LLM integration, predictive analytics, and smart operational workflows that multiply team velocity.',
      stacks: ['OpenAI / Claude APIs', 'LangChain', 'Python AI', 'PyTorch', 'Vector Databases', 'RPA Automation'],
      deliverables: ['Custom LLM Applications', 'Intelligent Document Extraction', 'Predictive Intelligence Models', 'Automated Ops Bot Agents'],
    },
    {
      id: 7,
      title: 'IT Infrastructure',
      num: '07',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>',
      desc: 'Enterprise network engineering, zero-trust cybersecurity frameworks, secure VPN mesh, and mission-critical hardware topologies.',
      stacks: ['Zero Trust', 'Cisco / Fortinet', 'SD-WAN', 'IAM / Okta', 'SIEM Monitoring', 'SOC2 Compliance'],
      deliverables: ['Network Security Audits', 'Hybrid Office Topologies', 'Disaster Recovery Systems', 'Zero-Trust Access Control'],
    },
    {
      id: 8,
      title: 'Technology Support',
      num: '08',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>',
      desc: '24/7/365 proactive telemetry monitoring, guaranteed SLA response times, routine system health patching, and dedicated tier-3 engineers.',
      stacks: ['Datadog', 'Prometheus', 'PagerDuty', 'Grafana', '24/7 NOC', 'SLA Response'],
      deliverables: ['24/7 Monitoring & Alerting', 'Security Patch Management', 'Incident Response SLAs', 'Technical Helpdesk'],
    },
  ];

  function setupServiceCards() {
    const grid = document.getElementById('services-grid');
    if (!grid) return;

    // Render cards into grid
    grid.innerHTML = servicesData
      .map(
        (s) => `
      <div class="service-card" data-service-id="${s.id}">
        <div class="card-top">
          <span class="card-number">${s.num}</span>
          <div class="card-icon-wrap">${s.icon}</div>
        </div>
        <div class="card-body">
          <h3 class="card-title">${s.title}</h3>
          <p class="card-desc">${s.desc}</p>
        </div>
        <div class="card-footer">
          <span class="card-action-label">Explore Stack</span>
          <span class="card-arrow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </span>
        </div>
      </div>
    `
      )
      .join('');

    // Attach 3D cursor tilt & modal triggers
    const cards = grid.querySelectorAll('.service-card');
    cards.forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -9;
        const rotateY = ((x - centerX) / centerX) * 9;

        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });

      card.addEventListener('pointerleave', () => {
        card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0)';
      });

      card.addEventListener('click', () => {
        const id = parseInt(card.getAttribute('data-service-id'), 10);
        const data = servicesData.find((item) => item.id === id);
        if (data) openServiceModal(data);
      });
    });

    setupModalEvents();
  }

  // --- Modal Logic ---
  function openServiceModal(data) {
    const modalBackdrop = document.getElementById('service-modal-backdrop');
    if (!modalBackdrop) return;

    document.getElementById('modal-icon-container').innerHTML = data.icon;
    document.getElementById('modal-service-title').textContent = data.title;
    document.getElementById('modal-service-desc').textContent = data.desc;

    // Tech stack pills
    const stacksContainer = document.getElementById('modal-tech-stacks');
    stacksContainer.innerHTML = data.stacks.map((t) => `<span class="tech-badge">${t}</span>`).join('');

    // Deliverables list
    const deliverablesContainer = document.getElementById('modal-deliverables');
    deliverablesContainer.innerHTML = data.deliverables
      .map(
        (d, idx) => `
        <div class="process-step-item">
          <div class="step-num">DELIVERABLE 0${idx + 1}</div>
          <div class="step-name">${d}</div>
        </div>
      `
      )
      .join('');

    modalBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function setupModalEvents() {
    const modalBackdrop = document.getElementById('service-modal-backdrop');
    const closeBtn = document.getElementById('modal-close-btn');

    if (!modalBackdrop) return;

    function closeModal() {
      modalBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeModal();
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalBackdrop.classList.contains('active')) closeModal();
    });
  }

  // --- Interactive Contact Form ---
  function setupContactForm() {
    const form = document.getElementById('contact-form');
    const statusMsg = document.getElementById('form-status');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('.btn-submit');
      const origText = submitBtn.innerHTML;

      submitBtn.innerHTML = '<span>Encrypting & Sending...</span>';
      submitBtn.disabled = true;

      setTimeout(() => {
        submitBtn.innerHTML = origText;
        submitBtn.disabled = false;
        form.reset();

        if (statusMsg) {
          statusMsg.className = 'form-status success';
          statusMsg.textContent = 'Message received. A Blow Box technology partner will connect with you within 2 hours.';
          setTimeout(() => {
            statusMsg.className = 'form-status';
            statusMsg.textContent = '';
          }, 6000);
        }
      }, 1100);
    });
  }

  // --- Navigation & Smooth Scroll ---
  function setupNavigation() {
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach((link) => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (targetId === '#') return;
        const targetElem = document.querySelector(targetId);
        if (targetElem) {
          e.preventDefault();
          targetElem.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // Mobile Menu Toggle
    const mobileBtn = document.getElementById('mobile-toggle');
    const navPill = document.querySelector('.nav-pill');
    if (mobileBtn && navPill) {
      mobileBtn.addEventListener('click', () => {
        navPill.classList.toggle('open');
      });
    }
  }

  // Boot on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
