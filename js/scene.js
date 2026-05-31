// scene.js — the persistent character stage.
//
// Abdullah's Higgsfield-rendered avatar lives here as a set of textured planes:
//   • a STANDING gaze set (look-left / look-front / look-right) that switches crisply
//     with the cursor so the character follows the pointer without face ghosting, and
//   • a SITTING-at-desk pose that swaps in for the career section (the kabhishek18
//     "the character moves with the story" beat).
//
// Each render is generated on a PURE BLACK background with cyan/magenta rim light,
// so a luma-key + edge-feather shader drops the background and the lit silhouette
// reads as a real, glowing subject — not a photo pasted on a rectangle. A soft
// additive aura seats the character into the scene's lighting.
//
// The scene is fail-open: if textures or WebGL don't load, nothing throws and the
// DOM content stands on its own.

import * as THREE from 'three';

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (e0, e1, x) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

const CHAR_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// The character frames are now AI-matted at the source (rembg human-seg, see
// tools/matte step / assets/character/_pre_matte_backup) so each WebP carries a
// real, clean alpha — the lit studio "box" that used to read as a shady rectangle
// is gone before the pixel ever reaches here. So the shader simply trusts that
// alpha (no luma keying, which would only nibble the soft matte edge) and lifts
// the figure's highlights a touch so the cyan/magenta rim pops on the dark page.
const CHAR_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uTex;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec4 tex = texture2D(uTex, vUv);
    float alpha = tex.a * uOpacity;
    if (alpha < 0.004) discard;
    float luma = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
    vec3 col = tex.rgb * 1.06 + tex.rgb * smoothstep(0.4, 1.0, luma) * 0.16;
    gl_FragColor = vec4(col, alpha);
  }
`;

function makePlane(texture, width, height) {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTex: { value: texture }, uOpacity: { value: 0 } },
    vertexShader: CHAR_VERT,
    fragmentShader: CHAR_FRAG,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.frustumCulled = false;
  return mesh;
}

// Radial cyan→blue→magenta aura baked to a canvas, blended additively behind the
// figure. The falloff is a GAUSSIAN core × a smooth outer cutoff window, so the
// alpha eases continuously to exactly zero (with a transparent margin before the
// texture edge) — no visible oval boundary. It reads as ambient light around the
// character rather than a disc. The alpha is dithered to kill 8-bit banding in the
// long, dark additive gradient.
function makeAuraTexture() {
  const SIZE = 768;
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  const ctx = c.getContext('2d');
  const cx = SIZE * 0.5, cy = SIZE * 0.48, R = SIZE * 0.5;
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);

  const cyan = [94, 234, 212], blue = [96, 165, 250], magenta = [255, 79, 216];
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const hueAt = (p) => (p < 0.5 ? mix(cyan, blue, p / 0.5) : mix(blue, magenta, (p - 0.5) / 0.5));
  const PEAK = 0.36, SIGMA = 0.32, STOPS = 48;
  for (let i = 0; i <= STOPS; i++) {
    const p = i / STOPS;
    // Gaussian (zero-derivative tail = no inner edge) × smooth cutoff (exact-zero
    // transparent margin = no plane-edge seam).
    const a = PEAK * Math.exp(-(p * p) / (2 * SIGMA * SIGMA)) * (1 - smoothstep(0.62, 0.96, p));
    const [r, gg, b] = hueAt(Math.min(1, p / 0.85));
    g.addColorStop(p, `rgba(${r},${gg},${b},${a.toFixed(4)})`);
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // dither the alpha channel a touch to break concentric banding in the falloff
  try {
    const img = ctx.getImageData(0, 0, SIZE, SIZE);
    const d = img.data;
    for (let i = 3; i < d.length; i += 4) {
      d[i] = Math.max(0, Math.min(255, d[i] + (Math.random() * 2 - 1) * 2));
    }
    ctx.putImageData(img, 0, 0);
  } catch (_) { /* readback unavailable → the smooth gradient stands on its own */ }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

export function createScene(canvas) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    document.documentElement.classList.add('no-webgl-scene');
  }, { passive: false });

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.65 : 2.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 100);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);

  // The character group — positioned/scaled per scroll section; planes inside it
  // carry the per-pose opacity (gaze blend + standing↔sitting cross-fade).
  const group = new THREE.Group();
  scene.add(group);

  // aura behind everything
  const aura = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 4.2),
    new THREE.MeshBasicMaterial({
      map: makeAuraTexture(),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    })
  );
  aura.position.set(0, 0.1, -0.5);
  aura.renderOrder = 0;
  group.add(aura);

  // both poses now render at 1792×2400 (3:4) — a matched set, so the standing↔sitting
  // cross-fade keeps identical scale. The 2K frames the subject a touch smaller, so
  // the planes run a little larger to fill the hero.
  const STAND_H = 4.5;
  const STAND_W = STAND_H * (834 / 1112);   // gaze frames are 834×1112 (3:4)
  const SIT_H = 4.05;
  const SIT_W = SIT_H * (1792 / 2400);       // sit render is 1792×2400

  const loader = new THREE.TextureLoader();
  const load = (url) =>
    new Promise((resolve) => {
      loader.load(
        url,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          // Mipmaps + trilinear: the plane renders smaller than the source (1112px → ~800px),
          // so without a mip chain the minification aliases and shimmers as anything moves.
          // WebGL2 (Three's default) supports NPOT mipmaps, and max anisotropy keeps it crisp.
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.anisotropy = renderer.capabilities.getMaxAnisotropy?.() || 1;
          tex.needsUpdate = true;
          resolve(tex);
        },
        undefined,
        () => {
          if (!window.__abcvTexFailLogged) {
            console.info('[scene] one or more character textures failed to load — using graceful fallback (dev note)');
            window.__abcvTexFailLogged = true;
          }
          resolve(null);
        }
      );
    });

  // ---- gaze flipbook ---------------------------------------------------------
  // Dense ordered yaw strip: 13 frames, left → front → right, extracted from a single
  // body-locked Seedance head-turn (834×1112, ~60KB each). Only ONE frame is visible at a
  // time (crisp snap, no cross-fade) so the face never ghosts, and 13 small steps read as a
  // smooth continuous turn rather than the old 3-pose jump.
  const GAZE_URLS = [
    'assets/character/head-00.webp?v=4',
    'assets/character/head-01.webp?v=4',
    'assets/character/head-02.webp?v=4',
    'assets/character/head-03.webp?v=4',
    'assets/character/head-04.webp?v=4',
    'assets/character/head-05.webp?v=4',
    'assets/character/head-06.webp?v=4',
    'assets/character/head-07.webp?v=4',
    'assets/character/head-08.webp?v=4',
    'assets/character/head-09.webp?v=4',
    'assets/character/head-10.webp?v=4',
    'assets/character/head-11.webp?v=4',
    'assets/character/head-12.webp?v=4',
  ];
  const gazePlanes = [];           // dense, in yaw order; gazePlanes.length === K
  let sitPlane = null;
  let K = 0;
  let centerIndex = 0;             // front/centre frame — used for reduced-motion lock
  let texturesReady = false;

  const texturesPromise = Promise.all([
    ...GAZE_URLS.map((url) => load(url)),
    load('assets/character/portrait-sit.webp?v=3'),
  ]).then((results) => {
    const sit = results[GAZE_URLS.length];
    // Keep loaded gaze frames IN ORDER. A failed middle frame would break the monotonic
    // yaw mapping, so we stop at the first gap (contiguous strip only).
    for (let i = 0; i < GAZE_URLS.length; i++) {
      const tex = results[i];
      if (!tex) break;             // contiguous-only: first gap ends the strip
      const p = makePlane(tex, STAND_W, STAND_H);
      p.position.y = 0.06;
      // renderOrder ascends with index so the painter's order is deterministic and the
      // 2-frame source-over composite is stable (no flicker as the active pair shifts).
      p.renderOrder = 2 + i;
      p.material.uniforms.uOpacity.value = 0;
      group.add(p);
      gazePlanes.push(p);
    }
    K = gazePlanes.length;
    centerIndex = K > 0 ? Math.round((K - 1) / 2) : 0;
    if (sit) { sitPlane = makePlane(sit, SIT_W, SIT_H); sitPlane.position.y = -0.1; sitPlane.renderOrder = 1; group.add(sitPlane); }
    texturesReady = true;
  });

  // ---- per-section stage states --------------------------------------------
  // x/y in world units, scale multiplies the base plane, sit = standing↔sitting
  // cross-fade (0 standing, 1 sitting), dim = overall character presence, follow
  // controls how much the parked body drifts with the cursor in that section.
  const states = {
    hero: { x: 0.05, y: -0.04, scale: 0.97, sit: 0, dim: 1.0, follow: 1.0 },
    about: { x: -2.05, y: -0.03, scale: 0.78, sit: 0, dim: 0.38, follow: 0.8 },
    career: { x: -2.68, y: -0.62, scale: 0.76, sit: 1, dim: 0.58, follow: 0.75 },  // extra clearance + lower presence so timeline text/glow line read cleanly without overlap or ring competition
    work: { x: 1.48, y: 0.08, scale: 0.62, sit: 0, dim: 0.22, follow: 0.75 },  // further receded + left for elegant non-competing share with floating card lower body
    tech: { x: 0.32, y: -0.48, scale: 0.66, sit: 0, dim: 0.34, follow: 1.65 },
    contact: { x: 1.35, y: -0.01, scale: 0.62, sit: 0, dim: 0.26, follow: 0.75 },
  };

  const state = {
    mouseX: 0, mouseY: 0, mouseTX: 0, mouseTY: 0,
    scroll: 0, scrollT: 0,
    x: 0.05, y: -0.04, scale: 0.97, sit: 0, dim: 0, follow: 1,  // aligned to current states.hero after polish tuning
    gazeIndex: -1,  // held crisp frame index; -1 = uninitialised → snaps to first target
  };
  let target = { ...states.hero };
  let currentSection = 'hero';

  // responsive park/scale factors, recomputed in resize()
  const responsive = { small: false, verySmall: false, parkX: 1, sizeMul: 1, mouseMul: 1, heroY: 0, heroDim: 1 };

  const clock = new THREE.Clock();
  let raf = 0;
  let visible = true;

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / h;
    // hardened frustum: clamp extremes (ultra-wide or tall) to keep character centered in frame across viewports
    let frustum = w < 720 ? 6.1 : w < 1100 ? 5.1 : 4.55;
    if (aspect > 2.35) frustum = Math.min(frustum, 4.35);
    if (aspect < 0.65) frustum = Math.max(frustum, 5.8);
    camera.left = (-frustum * aspect) / 2;
    camera.right = (frustum * aspect) / 2;
    camera.top = frustum / 2;
    camera.bottom = -frustum / 2;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w < 760 ? 1.65 : 2.5));
    renderer.setSize(w, h);

    // On phones the section-park x offsets (tuned for the wide desktop camera)
    // would shove the figure off-screen, so pull parks toward center, shrink it,
    // and damp the (touch-absent) mouse parallax. Also tame ultra-wide.
    const small = w < 760;
    const verySmall = w < 480;  // aligned with CSS @media (max-width:480px) for coordinated phone-scale framing
    responsive.small = small;
    responsive.verySmall = verySmall;
    responsive.parkX = small ? (verySmall ? 0.16 : 0.2) : (aspect > 2.1 ? 0.58 : 1);
    responsive.sizeMul = verySmall ? 0.7 : small ? 0.8 : w < 1100 ? 0.91 : 1;
    responsive.mouseMul = verySmall ? 0.28 : small ? 0.42 : 1;
    responsive.heroY = verySmall ? -1.68 : small ? -1.12 : 0;
    responsive.heroDim = verySmall ? 0.86 : small ? 0.88 : 1;
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    const time = clock.getElapsedTime();

    state.mouseX = lerp(state.mouseX, state.mouseTX, 0.18);
    state.mouseY = lerp(state.mouseY, state.mouseTY, 0.18);
    state.scroll = lerp(state.scroll, state.scrollT, 0.08);

    if (coarsePointer && !reducedMotion) {
      // Phones have no persistent cursor, so give the same gaze system a gentle
      // autonomous target; touchmove still overrides it immediately.
      state.mouseTX = lerp(state.mouseTX, Math.sin(time * 0.42) * 0.42, 0.015);
      state.mouseTY = lerp(state.mouseTY, Math.sin(time * 0.33 + 0.8) * 0.22, 0.015);
    }

    state.x = lerp(state.x, target.x, 0.09);
    state.y = lerp(state.y, target.y, 0.09);
    state.scale = lerp(state.scale, target.scale, 0.09);
    state.sit = lerp(state.sit, target.sit, 0.09);
    state.dim = lerp(state.dim, target.dim, 0.08);
    state.follow = lerp(state.follow, target.follow ?? 1, 0.08);

    // On phones, recede the figure to an ambient backdrop in text-heavy sections
    // so the overlaid copy stays readable. More aggressive on very small.
    const heroMobile = responsive.small && currentSection === 'hero';
    const dimMul = heroMobile
      ? responsive.heroDim
      : responsive.small && currentSection === 'tech'
        ? (responsive.verySmall ? 0.5 : 0.58)
      : responsive.small && currentSection !== 'hero'
        ? (responsive.verySmall ? 0.28 : 0.4)
        : 1;
    const dim = state.dim * dimMul;

    // When the character is fully dimmed out (the tech/pearl-pit section), skip the
    // draw entirely instead of burning the GPU on an invisible frame.
    if (dim < 0.012 && target.dim < 0.02) return;

    const float = Math.sin(time * 1.1) * 0.014;          // gentle idle breath (~2-3px), keeps the figure alive but crisp
    const mouseX = state.mouseX * responsive.mouseMul;
    const mouseY = state.mouseY * responsive.mouseMul;
    // heroLean: 1 only when the figure is parked at the hero (state.x ≈ 0.05) AND standing.
    const heroLean = (1 - smoothstep(0.25, 1.0, Math.abs(state.x - 0.05))) * (1 - state.sit);
    // The cursor "follow" is carried by the crisp head-frame SWAP — NOT by sliding the figure.
    // A large horizontal lean translated this 2400px-tall texture sub-pixel every frame, which
    // softened the face WHILE moving (the "blurry when the cursor moves" report). Keep only a
    // whisper of lean so the body feels alive but the face stays pixel-crisp during motion.
    group.position.set(
      state.x * responsive.parkX + mouseX * (0.035 + 0.03 * heroLean) * state.follow,
      state.y + (heroMobile ? responsive.heroY : 0) + float + mouseY * 0.018 * state.follow,
      0
    );
    group.scale.setScalar(state.scale * responsive.sizeMul);
    group.rotation.y = 0;
    group.rotation.x = -mouseY * 0.008 * state.follow;

    if (texturesReady) {
      const standDim = dim * (1 - state.sit);
      const sitDim = dim * state.sit;

      if (K >= 2) {
        const t = Math.max(-1, Math.min(1, mouseX));
        const fTarget = ((t + 1) / 2) * (K - 1);
        const desired = Math.max(0, Math.min(K - 1, Math.round(fTarget)));
        if (state.gazeIndex < 0 || Math.abs(fTarget - state.gazeIndex) > 0.55) {
          state.gazeIndex = desired;
        }

        // Subtle mouseY vertical "look up / down" tilt on the active pair only. Pure in-place
        // rotation.x layered on the group's base tilt → drift-safe (never moves the parked
        // offset). Tiny magnitude so it never fights the circular silhouette key. Reduced
        // motion already forces mouseY≈0 via setMouse not firing, but we still gate it below.
        const gazeTilt = -mouseY * 0.015;

        // Crisp one-frame portrait selection. Whole-scene easing keeps motion smooth,
        // while avoiding the double-exposure blur of overlapping face planes.
        for (let i = 0; i < K; i++) {
          const p = gazePlanes[i];
          const active = i === state.gazeIndex;
          p.material.uniforms.uOpacity.value = active ? standDim : 0;
          p.rotation.x = active ? gazeTilt : 0;
        }
      } else if (K === 1) {
        // Single frame loaded → it IS the stand pose; no flipping possible (fall back).
        gazePlanes[0].material.uniforms.uOpacity.value = standDim;
        gazePlanes[0].rotation.x = -mouseY * 0.035;        // keep the subtle vertical tilt
      }
      // K === 0 → no stand planes exist; nothing to write (fail-open, DOM stands alone).

      if (sitPlane) sitPlane.material.uniforms.uOpacity.value = sitDim;
    }

    aura.material.opacity = dim * (0.3 + Math.sin(time * 0.9) * 0.03);
    aura.scale.setScalar(0.95 + state.sit * 0.12);

    // Camera stays LOCKED. Panning the orthographic camera with the cursor slid the entire
    // render sub-pixel every frame and softened the high-detail face. The crisp head-frame
    // swap is the only follow signal now, so every rendered frame is pixel-stable and sharp.
    camera.position.x = 0;
    camera.position.y = 0;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  resize();
  if (reducedMotion) {
    state.dim = 1;
    target = { ...states.hero };
    // single static draw once textures arrive (bounded so it can't spin forever
    // if a texture fails to load)
    let tries = 0;
    const once = setInterval(() => {
      tries += 1;
      if (!texturesReady && tries < 80) return;
      clearInterval(once);
      // prefers-reduced-motion: lock to the centre/front frame (no flipping). centerIndex
      // is the middle of the loaded strip; if a single frame loaded it's index 0; if none
      // loaded, K===0 and we draw the aura alone (fail-open).
      if (K > 0) gazePlanes[centerIndex].material.uniforms.uOpacity.value = 1;
      aura.material.opacity = 0.5;
      renderer.render(scene, camera);
    }, 60);
  } else {
    frame();
  }

  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

  const api = {
    setScrollProgress(p) { state.scrollT = clamp01(p); },
    setSection(name) { currentSection = states[name] ? name : 'hero'; target = states[currentSection]; },
    revealTech(active) { if (active) target = states.tech; },
    setMouse(nx, ny) {
      state.mouseTX = Math.max(-1, Math.min(1, nx));
      state.mouseTY = Math.max(-1, Math.min(1, ny));
    },
    resize,
    ready: texturesPromise,
    dispose() {
      cancelAnimationFrame(raf);
      renderer.dispose();
    },
  };
  return api;
}
