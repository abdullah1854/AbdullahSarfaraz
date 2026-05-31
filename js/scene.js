// scene.js — the persistent character stage.
//
// Abdullah's Higgsfield-rendered avatar lives here as compact textured cutouts:
//   • a STANDING gaze strip packed into one WebGL2 DataArrayTexture plane, falling
//     back to individual planes if the array upload cannot run, and
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
import { prefersReducedMotion, coarsePointer, BP } from './env.js?v=20260531-ui-audit';

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
  uniform vec2 uTexel;
  uniform vec3 uRimA;
  uniform vec3 uRimB;
  uniform float uRimStrength;
  varying vec2 vUv;
  void main() {
    vec4 tex = texture2D(uTex, vUv);
    float alpha = tex.a * uOpacity;
    if (alpha < 0.004) discard;
    float luma = dot(tex.rgb, vec3(0.2126, 0.7152, 0.0722));
    float aL = texture2D(uTex, vUv - vec2(uTexel.x, 0.0)).a;
    float aR = texture2D(uTex, vUv + vec2(uTexel.x, 0.0)).a;
    float aD = texture2D(uTex, vUv - vec2(0.0, uTexel.y)).a;
    float aU = texture2D(uTex, vUv + vec2(0.0, uTexel.y)).a;
    float edge = clamp(length(vec2(aR - aL, aU - aD)) * 3.4, 0.0, 1.0);
    float rim = pow(edge, 0.72) * smoothstep(0.01, 0.18, tex.a) * uRimStrength * uOpacity;
    vec3 rimColor = mix(uRimA, uRimB, smoothstep(0.05, 0.95, vUv.x));
    vec3 col = tex.rgb * 1.06 + tex.rgb * smoothstep(0.4, 1.0, luma) * 0.16;
    col += rimColor * rim;
    gl_FragColor = vec4(col, alpha);
  }
`;

const GAZE_ARRAY_VERT = /* glsl */ `
  // three injects position / uv / modelViewMatrix / projectionMatrix for a GLSL3
  // ShaderMaterial — redeclaring them throws "redefinition", so only the custom
  // varying is declared here.
  out vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const GAZE_ARRAY_FRAG = /* glsl */ `
  precision highp float;
  precision highp sampler2DArray;
  uniform sampler2DArray uTexArray;
  uniform float uFrame;
  uniform float uOpacity;
  uniform vec2 uTexel;
  uniform vec3 uRimA;
  uniform vec3 uRimB;
  uniform float uRimStrength;
  in vec2 vUv;
  out vec4 outColor;

  vec4 readFrame(vec2 uv) {
    return texture(uTexArray, vec3(vec2(uv.x, 1.0 - uv.y), uFrame));
  }

  void main() {
    vec4 tex = readFrame(vUv);
    float alpha = tex.a * uOpacity;
    if (alpha < 0.004) discard;
    float luma = dot(tex.rgb, vec3(0.2126, 0.7152, 0.0722));
    float aL = readFrame(vUv - vec2(uTexel.x, 0.0)).a;
    float aR = readFrame(vUv + vec2(uTexel.x, 0.0)).a;
    float aD = readFrame(vUv - vec2(0.0, uTexel.y)).a;
    float aU = readFrame(vUv + vec2(0.0, uTexel.y)).a;
    float edge = clamp(length(vec2(aR - aL, aU - aD)) * 3.4, 0.0, 1.0);
    float rim = pow(edge, 0.72) * smoothstep(0.01, 0.18, tex.a) * uRimStrength * uOpacity;
    vec3 rimColor = mix(uRimA, uRimB, smoothstep(0.05, 0.95, vUv.x));
    vec3 col = tex.rgb * 1.06 + tex.rgb * smoothstep(0.4, 1.0, luma) * 0.16;
    col += rimColor * rim;
    outColor = vec4(col, alpha);
  }
`;

const RIM_A = new THREE.Color('#5eead4');
const RIM_B = new THREE.Color('#ff4fd8');

function makePlane(texture, width, height) {
  const image = texture?.image || {};
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTex: { value: texture },
      uOpacity: { value: 0 },
      uTexel: { value: new THREE.Vector2(1 / (image.width || 1024), 1 / (image.height || 1024)) },
      uRimA: { value: RIM_A },
      uRimB: { value: RIM_B },
      uRimStrength: { value: 0.2 },
    },
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

function makeGazeArrayPlane(texture, width, height, texWidth, texHeight) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTexArray: { value: texture },
      uFrame: { value: 0 },
      uOpacity: { value: 0 },
      uTexel: { value: new THREE.Vector2(1 / texWidth, 1 / texHeight) },
      uRimA: { value: RIM_A },
      uRimB: { value: RIM_B },
      uRimStrength: { value: 0.2 },
    },
    vertexShader: GAZE_ARRAY_VERT,
    fragmentShader: GAZE_ARRAY_FRAG,
    glslVersion: THREE.GLSL3,
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
  // env.js capability queries are FUNCTIONS (re-read live) — call them at the sites
  // that care so an OS reduce-motion / pointer-type flip takes effect without reload.
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < BP.sm ? 1.65 : 2.5));
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
  const auraTexture = makeAuraTexture();
  const aura = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 4.2),
    new THREE.MeshBasicMaterial({
      map: auraTexture,
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

  const loadImage = (url) =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () => {
        if (!window.__abcvTexFailLogged) {
          console.info('[scene] one or more character textures failed to load — using graceful fallback (dev note)');
          window.__abcvTexFailLogged = true;
        }
        resolve(null);
      };
      img.src = url;
    });

  async function loadGazeArray(urls) {
    const gl = renderer.getContext();
    const hasWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
    if (!hasWebGL2) return null;
    const images = await Promise.all(urls.map((url) => loadImage(url)));
    const contiguous = [];
    for (const img of images) {
      if (!img) break;
      contiguous.push(img);
    }
    if (!contiguous.length) return null;

    const width = contiguous[0].naturalWidth || contiguous[0].width;
    const height = contiguous[0].naturalHeight || contiguous[0].height;
    if (!width || !height) return null;

    const canvas2d = document.createElement('canvas');
    canvas2d.width = width;
    canvas2d.height = height;
    const ctx = canvas2d.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    const layerSize = width * height * 4;
    const data = new Uint8Array(layerSize * contiguous.length);
    try {
      for (let i = 0; i < contiguous.length; i++) {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(contiguous[i], 0, 0, width, height);
        data.set(ctx.getImageData(0, 0, width, height).data, layerSize * i);
      }
    } catch (error) {
      console.warn('[scene] gaze DataArrayTexture upload preparation failed; falling back to individual planes.', error);
      return null;
    }

    const tex = new THREE.DataArrayTexture(data, width, height, contiguous.length);
    tex.format = THREE.RGBAFormat;
    tex.type = THREE.UnsignedByteType;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.unpackAlignment = 1;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy?.() || 1;
    tex.needsUpdate = true;
    return { texture: tex, count: contiguous.length, width, height };
  }

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
  const gazePlanes = [];           // fallback dense planes; normally empty when DataArrayTexture succeeds
  let gazeArrayPlane = null;       // primary standing pose: one WebGL2 array texture, one draw call
  let sitPlane = null;
  let K = 0;
  let centerIndex = 0;             // front/centre frame — used for reduced-motion lock
  let texturesReady = false;
  // Every successfully-loaded source texture (gaze frames + sit). On a WebGL context
  // restore the GPU-side copies are gone, so we re-flag these (plus the aura) for upload.
  const loadedTextures = [];

  const texturesPromise = (async () => {
    const [gazeArray, sit] = await Promise.all([
      loadGazeArray(GAZE_URLS),
      load('assets/character/portrait-sit.webp?v=3'),
    ]);

    if (gazeArray?.texture) {
      loadedTextures.push(gazeArray.texture);
      gazeArrayPlane = makeGazeArrayPlane(gazeArray.texture, STAND_W, STAND_H, gazeArray.width, gazeArray.height);
      gazeArrayPlane.position.y = 0.06;
      gazeArrayPlane.renderOrder = 2;
      group.add(gazeArrayPlane);
      K = gazeArray.count;
    } else {
      const results = await Promise.all(GAZE_URLS.map((url) => load(url)));
      // Keep loaded gaze frames IN ORDER. A failed middle frame would break the monotonic
      // yaw mapping, so we stop at the first gap (contiguous strip only).
      for (let i = 0; i < GAZE_URLS.length; i++) {
        const tex = results[i];
        if (!tex) break;             // contiguous-only: first gap ends the strip
        loadedTextures.push(tex);
        const p = makePlane(tex, STAND_W, STAND_H);
        p.position.y = 0.06;
        p.renderOrder = 2 + i;
        p.material.uniforms.uOpacity.value = 0;
        group.add(p);
        gazePlanes.push(p);
      }
      K = gazePlanes.length;
    }

    centerIndex = K > 0 ? Math.round((K - 1) / 2) : 0;
    if (sit) {
      loadedTextures.push(sit);
      sitPlane = makePlane(sit, SIT_W, SIT_H);
      sitPlane.position.y = -0.1;
      sitPlane.renderOrder = 1;
      group.add(sitPlane);
    }
    texturesReady = true;
    wake('textures');
  })().catch((error) => {
    console.warn('[scene] character texture setup failed; DOM content remains available.', error);
    texturesReady = true;
    wake('texture-error');
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
  const responsive = { stacked: false, small: false, verySmall: false, parkX: 1, sizeMul: 1, mouseMul: 1, heroX: 0, heroY: 0, heroDim: 1 };

  const startedAt = performance.now();
  const elapsed = () => (performance.now() - startedAt) / 1000;
  let raf = 0;
  let visible = true;
  let contextLost = false;
  let sleeping = false;
  let idleSettledAt = 0;
  let idleWakeTimer = 0;
  let staticDrawTimer = 0;

  // P2 aggressive idle: after the park/gaze/scroll inputs settle, we stop scheduling
  // requestAnimationFrame entirely. Pointer, scroll, section, resize, context restore,
  // or the rare hero micro-nudge wakes one frame path back up.
  const IDLE_EPS = 0.0016;            // transform epsilon (world units / opacity)
  const IDLE_MOUSE_EPS = 0.0008;      // gaze/cursor steadiness epsilon
  const IDLE_SLEEP_DELAY = 1.25;      // seconds of pixel-stable state before full rAF stop
  let idleMouseX = 0, idleMouseY = 0, idleScroll = 0;
  let idleGazeIndex = -1;
  let idlePrevX = NaN, idlePrevY = NaN, idlePrevScale = NaN, idlePrevSit = NaN, idlePrevDim = NaN;
  let lastMouseTX = 0, lastMouseTY = 0, lastScrollT = 0;
  let pointerVX = 0, pointerVY = 0, scrollV = 0;
  let idleGazeKick = 0;
  let nextMicroAt = 0;

  function clearIdleWakeTimer() {
    if (idleWakeTimer) {
      clearTimeout(idleWakeTimer);
      idleWakeTimer = 0;
    }
  }

  function clearStaticDrawTimer() {
    if (staticDrawTimer) {
      clearInterval(staticDrawTimer);
      staticDrawTimer = 0;
    }
  }

  function scheduleFrame() {
    if (raf || sleeping || contextLost || !visible || prefersReducedMotion()) return;
    raf = requestAnimationFrame(frame);
  }

  function wake() {
    sleeping = false;
    idleSettledAt = 0;
    clearIdleWakeTimer();
    if (prefersReducedMotion()) {
      if (visible && !contextLost) staticDraw();
      return;
    }
    scheduleFrame();
  }

  function scheduleHeroMicroWake(time) {
    clearIdleWakeTimer();
    if (currentSection !== 'hero' || prefersReducedMotion() || contextLost || !visible) return;
    const delay = Math.max(1.8, (nextMicroAt || time + 4) - time) * 1000;
    idleWakeTimer = setTimeout(() => {
      idleWakeTimer = 0;
      idleGazeKick = (Math.random() * 2 - 1) * 0.16;
      nextMicroAt = elapsed() + 4 + Math.random() * 4;
      wake();
    }, delay);
  }

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / h;
    // hardened frustum: clamp extremes (ultra-wide or tall) to keep character centered in frame across viewports.
    // NB: 720/1100 here are CAMERA-FRAMING thresholds (how tight the ortho frustum hugs the figure),
    // NOT the layout breakpoints — those are BP.* and govern park/scale/parallax below.
    let frustum = w < 720 ? 6.1 : w < 1100 ? 5.1 : 4.55;
    if (aspect > 2.35) frustum = Math.min(frustum, 4.35);
    if (aspect < 0.65) frustum = Math.max(frustum, 5.8);
    camera.left = (-frustum * aspect) / 2;
    camera.right = (frustum * aspect) / 2;
    camera.top = frustum / 2;
    camera.bottom = -frustum / 2;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w < BP.sm ? 1.65 : 2.5));
    renderer.setSize(w, h);

    // When CSS stacks the hero (<= BP.lg), desktop-sized character parks collide
    // with the text. Pull parks toward center, shrink/dim the figure, and damp
    // parallax so it reads as backdrop. Phones get the stronger version.
    const stacked = w <= BP.lg;
    const small = w < BP.sm;
    const verySmall = w < BP.xs;  // BP.xs (480) mirrors CSS @media (max-width:480px) for coordinated phone-scale framing
    responsive.stacked = stacked;
    responsive.small = small;
    responsive.verySmall = verySmall;
    responsive.parkX = verySmall ? 0.16 : small ? 0.2 : stacked ? 0.42 : (aspect > 2.1 ? 0.58 : 1);
    responsive.sizeMul = verySmall ? 0.7 : small ? 0.8 : stacked ? 0.76 : w < 1100 ? 0.91 : 1;
    responsive.mouseMul = verySmall ? 0.28 : small ? 0.42 : stacked ? 0.48 : 1;
    responsive.heroX = stacked && !small ? 1.45 : 0;
    responsive.heroY = verySmall ? -1.68 : small ? -1.12 : stacked ? -1.08 : 0;
    responsive.heroDim = verySmall ? 0.86 : small ? 0.88 : stacked ? 0.38 : 1;
    wake('resize');
  }

  function frame() {
    raf = 0;
    if (!visible || contextLost || sleeping) return;
    const time = elapsed();
    // env capabilities re-read live each frame (cheap matchMedia hit) so an OS toggle lands.
    const reduced = prefersReducedMotion();
    if (reduced) {
      staticDraw();
      return;
    }

    pointerVX = lerp(pointerVX, state.mouseTX - lastMouseTX, 0.28);
    pointerVY = lerp(pointerVY, state.mouseTY - lastMouseTY, 0.28);
    scrollV = lerp(scrollV, state.scrollT - lastScrollT, 0.24);
    lastMouseTX = state.mouseTX;
    lastMouseTY = state.mouseTY;
    lastScrollT = state.scrollT;
    idleGazeKick = lerp(idleGazeKick, 0, 0.045);

    state.mouseX = lerp(state.mouseX, state.mouseTX, 0.18);
    state.mouseY = lerp(state.mouseY, state.mouseTY, 0.18);
    state.scroll = lerp(state.scroll, state.scrollT, 0.08);

    if (coarsePointer() && !reduced) {
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

    // SCROLL-DRIVEN AVATAR blend REMOVED (2026-05-31): the ordered keyframe path assumed the six
    // sections were evenly spaced at u = 0, .2, .4, .6, .8, 1 of page scroll. They are NOT equal
    // height, so at the career viewport the global scroll fraction sampled BETWEEN the career park
    // (x:-2.68, seated) and the work park (x:1.48, standing) — continuously dragging the figure
    // toward centre and out of its seated pose, where it overlapped the "CAREER & EXPERIENCE"
    // heading and the timeline period column. The discrete per-section parks below are each tuned
    // to be collision-free; let the 0.09 settle lerp above own the transform. (If a scrub blend is
    // wanted later, anchor SCROLL_PATH to each section's real ScrollTrigger offset, not even sixths.)

    // On phones, recede the figure to an ambient backdrop in text-heavy sections
    // so the overlaid copy stays readable. More aggressive on very small.
    const heroStacked = responsive.stacked && currentSection === 'hero';
    const dimMul = heroStacked
      ? responsive.heroDim
      : responsive.small && currentSection === 'tech'
        ? (responsive.verySmall ? 0.5 : 0.58)
      : responsive.small && currentSection !== 'hero'
        ? (responsive.verySmall ? 0.28 : 0.4)
        : 1;
    const dim = state.dim * dimMul;

    // When the character is fully dimmed out (the tech/pearl-pit section), skip the
    // draw entirely instead of burning the GPU on an invisible frame.
    if (dim < 0.012 && target.dim < 0.02) {
      sleeping = true;
      return;
    }

    const float = Math.sin(time * 1.1) * 0.014;          // gentle idle breath (~2-3px), keeps the figure alive but crisp
    // GAZE vs POSITIONAL split (P3): the head-turn is driven by the RAW pointer (full -1..1)
    // so the face still turns to follow on phones; responsive.mouseMul (0.28/0.42) is meant
    // only to DAMP the positional body lean (so the parked figure doesn't slide off a small
    // screen) and must NOT flatten the head-turn. Keep the clamp so a wild value can't index
    // past the strip / over-tilt.
    const quietHero = currentSection === 'hero' && Math.abs(state.mouseX) < 0.22 && Math.abs(pointerVX) < 0.0016;
    if (!nextMicroAt) nextMicroAt = time + 3 + Math.random() * 3;
    if (quietHero && time > nextMicroAt) {
      idleGazeKick = (Math.random() * 2 - 1) * 0.14;
      nextMicroAt = time + 4 + Math.random() * 4;
    } else if (currentSection !== 'hero') {
      nextMicroAt = time + 4 + Math.random() * 4;
    }

    const gazeX = Math.max(-1, Math.min(1, state.mouseX + idleGazeKick));
    const gazeY = Math.max(-1, Math.min(1, state.mouseY));
    const mouseX = state.mouseX * responsive.mouseMul;   // positional lean only
    const mouseY = state.mouseY * responsive.mouseMul;   // positional lean only
    const secondaryX = Math.max(-0.045, Math.min(0.045, pointerVX * 0.34 + scrollV * 0.22));
    const secondaryY = Math.max(-0.035, Math.min(0.035, pointerVY * 0.18 - Math.abs(scrollV) * 0.08));
    // heroLean: 1 only when the figure is parked at the hero (state.x ≈ 0.05) AND standing.
    const heroLean = (1 - smoothstep(0.25, 1.0, Math.abs(state.x - 0.05))) * (1 - state.sit);
    // The cursor "follow" is carried by the crisp head-frame SWAP — NOT by sliding the figure.
    // A large horizontal lean translated this 2400px-tall texture sub-pixel every frame, which
    // softened the face WHILE moving (the "blurry when the cursor moves" report). Keep only a
    // whisper of lean so the body feels alive but the face stays pixel-crisp during motion.
    group.position.set(
      state.x * responsive.parkX + (heroStacked ? responsive.heroX : 0) + mouseX * (0.035 + 0.03 * heroLean) * state.follow + secondaryX,
      state.y + (heroStacked ? responsive.heroY : 0) + float + mouseY * 0.018 * state.follow + secondaryY,
      0
    );
    group.scale.setScalar(state.scale * responsive.sizeMul);
    group.rotation.y = 0;
    group.rotation.x = -mouseY * 0.008 * state.follow + secondaryY * 0.22;
    group.rotation.z = -secondaryX * 0.42;

    if (texturesReady) {
      const standDim = dim * (1 - state.sit);
      const sitDim = dim * state.sit;

      if (K >= 2) {
        // RAW gaze input (not the mouseMul-damped lean) so the head still turns fully on phones.
        const t = gazeX;
        const fTarget = ((t + 1) / 2) * (K - 1);
        const desired = Math.max(0, Math.min(K - 1, Math.round(fTarget)));
        if (state.gazeIndex < 0 || Math.abs(fTarget - state.gazeIndex) > 0.55) {
          state.gazeIndex = desired;
        }

        // Subtle vertical "look up / down" tilt on the active pair only — also a GAZE term, so
        // it reads the RAW pointer (gazeY), not the damped lean. Pure in-place rotation.x layered
        // on the group's base tilt → drift-safe (never moves the parked offset). Tiny magnitude so
        // it never fights the circular silhouette key. Reduced motion forces mouseY≈0 (setMouse
        // not firing) and never runs frame() anyway.
        const gazeTilt = -gazeY * 0.015;

        // Crisp one-frame portrait selection. Whole-scene easing keeps motion smooth,
        // while avoiding the double-exposure blur of overlapping face planes.
        if (gazeArrayPlane) {
          gazeArrayPlane.material.uniforms.uFrame.value = state.gazeIndex;
          gazeArrayPlane.material.uniforms.uOpacity.value = standDim;
          gazeArrayPlane.rotation.x = gazeTilt;
        } else {
          for (let i = 0; i < K; i++) {
            const p = gazePlanes[i];
            const active = i === state.gazeIndex;
            p.material.uniforms.uOpacity.value = active ? standDim : 0;
            p.rotation.x = active ? gazeTilt : 0;
          }
        }
      } else if (K === 1 && gazeArrayPlane) {
        gazeArrayPlane.material.uniforms.uFrame.value = 0;
        gazeArrayPlane.material.uniforms.uOpacity.value = standDim;
        gazeArrayPlane.rotation.x = -gazeY * 0.035;
      } else if (K === 1) {
        // Single frame loaded → it IS the stand pose; no flipping possible (fall back).
        gazePlanes[0].material.uniforms.uOpacity.value = standDim;
        gazePlanes[0].rotation.x = -gazeY * 0.035;         // gaze tilt → raw pointer (P3)
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

    // Full idle stop: once the visible transform, gaze, and input velocities are quiet for a
    // short window, do not even schedule the next rAF. The public setters below wake the scene.
    const stoppedMoving =
      Math.abs(state.x - idlePrevX) < IDLE_EPS &&
      Math.abs(state.y - idlePrevY) < IDLE_EPS &&
      Math.abs(state.scale - idlePrevScale) < IDLE_EPS &&
      Math.abs(state.sit - idlePrevSit) < IDLE_EPS &&
      Math.abs(state.dim - idlePrevDim) < IDLE_EPS;
    const inputSteady =
      Math.abs(gazeX - idleMouseX) < IDLE_MOUSE_EPS &&
      Math.abs(gazeY - idleMouseY) < IDLE_MOUSE_EPS &&
      Math.abs(state.scroll - idleScroll) < IDLE_EPS &&
      state.gazeIndex === idleGazeIndex;
    const velocityQuiet =
      Math.abs(pointerVX) < 0.0009 &&
      Math.abs(pointerVY) < 0.0009 &&
      Math.abs(scrollV) < 0.0009 &&
      Math.abs(idleGazeKick) < 0.002;
    idlePrevX = state.x; idlePrevY = state.y; idlePrevScale = state.scale;
    idlePrevSit = state.sit; idlePrevDim = state.dim;
    idleMouseX = gazeX;
    idleMouseY = gazeY;
    idleScroll = state.scroll;
    idleGazeIndex = state.gazeIndex;
    if (stoppedMoving && inputSteady && velocityQuiet) {
      idleSettledAt = idleSettledAt || time;
      if (time - idleSettledAt >= IDLE_SLEEP_DELAY) {
        sleeping = true;
        scheduleHeroMicroWake(time);
        return;
      }
      scheduleFrame();                          // skip GPU render during the settle grace
      return;
    }
    idleSettledAt = 0;

    renderer.render(scene, camera);
    scheduleFrame();
  }

  function applyReducedMotionPose() {
    const pose = target || states.hero;
    state.x = pose.x;
    state.y = pose.y;
    state.scale = pose.scale;
    state.sit = pose.sit;
    state.dim = pose.dim;
    state.follow = pose.follow ?? 1;
    state.mouseX = 0;
    state.mouseY = 0;
    state.mouseTX = 0;
    state.mouseTY = 0;
    pointerVX = 0;
    pointerVY = 0;
    scrollV = 0;
    idleGazeKick = 0;

    const heroStacked = responsive.stacked && currentSection === 'hero';
    const dimMul = heroStacked
      ? responsive.heroDim
      : responsive.small && currentSection === 'tech'
        ? (responsive.verySmall ? 0.5 : 0.58)
      : responsive.small && currentSection !== 'hero'
        ? (responsive.verySmall ? 0.28 : 0.4)
        : 1;
    const dim = state.dim * dimMul;
    const standDim = dim * (1 - state.sit);
    const sitDim = dim * state.sit;

    group.position.set(
      state.x * responsive.parkX + (heroStacked ? responsive.heroX : 0),
      state.y + (heroStacked ? responsive.heroY : 0),
      0
    );
    group.scale.setScalar(state.scale * responsive.sizeMul);
    group.rotation.set(0, 0, 0);

    if (gazeArrayPlane) {
      gazeArrayPlane.material.uniforms.uFrame.value = centerIndex;
      gazeArrayPlane.material.uniforms.uOpacity.value = standDim;
      gazeArrayPlane.rotation.x = 0;
    } else {
      for (let i = 0; i < gazePlanes.length; i++) {
        const p = gazePlanes[i];
        p.material.uniforms.uOpacity.value = i === centerIndex ? standDim : 0;
        p.rotation.x = 0;
      }
    }
    if (sitPlane) sitPlane.material.uniforms.uOpacity.value = sitDim;
    aura.material.opacity = dim * 0.3;
    aura.scale.setScalar(0.95 + state.sit * 0.12);
    camera.position.x = 0;
    camera.position.y = 0;
    camera.lookAt(0, 0, 0);
  }

  // A single static reduced-motion draw (no rAF). Pulled out so the context-restore handler
  // can re-issue it after the GPU drops the textures. Bounded so it can't spin forever if a
  // texture fails to load.
  function staticDraw() {
    clearStaticDrawTimer();
    let tries = 0;
    staticDrawTimer = setInterval(() => {
      tries += 1;
      if (!texturesReady && tries < 80) return;
      clearStaticDrawTimer();
      // prefers-reduced-motion: lock to the centre/front frame (no flipping) and
      // snap to the current section park without idle float or cursor lean.
      applyReducedMotionPose();
      renderer.render(scene, camera);
    }, 60);
  }

  const reducedMotionMql = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const onReducedMotionChange = () => {
    cancelAnimationFrame(raf);
    clearIdleWakeTimer();
    clearStaticDrawTimer();
    raf = 0;
    sleeping = false;
    if (!visible || contextLost) return;
    if (prefersReducedMotion()) staticDraw();
    else wake('motion-preference');
  };
  if (reducedMotionMql?.addEventListener) {
    reducedMotionMql.addEventListener('change', onReducedMotionChange);
  } else if (reducedMotionMql?.addListener) {
    reducedMotionMql.addListener(onReducedMotionChange);
  }

  // P1 WebGL context loss/restore. On loss the GPU-side resources are gone, so freeze the loop
  // (cancel rAF, stop ticking) and let the DOM stand alone; the rAF heartbeat would otherwise
  // keep "rendering" into a dead context. On restore, re-upload every texture (their GPU copies
  // were dropped), recompute the viewport, and resume whichever path matches the live env.
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();                       // ask the browser to attempt a restore
    contextLost = true;
    visible = false;                              // frame()'s early-out, belt-and-suspenders with the cancel
    cancelAnimationFrame(raf);
    clearIdleWakeTimer();
    clearStaticDrawTimer();
    raf = 0;
    document.documentElement.classList.add('no-webgl-scene');
  }, { passive: false });

  canvas.addEventListener('webglcontextrestored', () => {
    contextLost = false;
    sleeping = false;
    resize();
    // GPU-side texture copies were lost — flag every loaded source (gaze + sit) and the aura
    // for re-upload on the next render.
    for (const tex of loadedTextures) tex.needsUpdate = true;
    auraTexture.needsUpdate = true;
    try { renderer.compile(scene, camera); } catch (_) { /* compile can fail before textures finish; next render retries */ }
    document.documentElement.classList.remove('no-webgl-scene');
    visible = !document.hidden;
    if (prefersReducedMotion()) {
      staticDraw();
    } else {
      cancelAnimationFrame(raf);                  // guard against a stray scheduled frame
      raf = 0;
      wake('context-restored');                   // resume the live loop
    }
  }, { passive: false });

  resize();
  if (prefersReducedMotion()) {
    state.dim = 1;
    target = { ...states.hero };
    staticDraw();
  } else {
    wake('initial');
  }

  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    if (!visible) {
      cancelAnimationFrame(raf);
      clearIdleWakeTimer();
      clearStaticDrawTimer();
      raf = 0;
    } else if (prefersReducedMotion()) {
      staticDraw();
    } else {
      wake('visible');
    }
  });

  const api = {
    setScrollProgress(p) { state.scrollT = clamp01(p); wake('scroll'); },
    setSection(name) { currentSection = states[name] ? name : 'hero'; target = states[currentSection]; wake('section'); },
    revealTech(active) { if (active) { target = states.tech; wake('tech'); } },
    setMouse(nx, ny) {
      state.mouseTX = Math.max(-1, Math.min(1, nx));
      state.mouseTY = Math.max(-1, Math.min(1, ny));
      wake('mouse');
    },
    resize,
    ready: texturesPromise,
    dispose() {
      cancelAnimationFrame(raf);
      clearIdleWakeTimer();
      clearStaticDrawTimer();
      if (reducedMotionMql?.removeEventListener) {
        reducedMotionMql.removeEventListener('change', onReducedMotionChange);
      } else if (reducedMotionMql?.removeListener) {
        reducedMotionMql.removeListener(onReducedMotionChange);
      }
      // Walk the character group and release every GPU resource: each plane's geometry, its
      // material, and the source texture the material samples (gaze frames, sit, and the aura's
      // baked CanvasTexture). Then drop the renderer's own context. Fail-open: the aura/material
      // shapes differ (ShaderMaterial vs MeshBasicMaterial) so we read both uniform + map slots.
      group.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        const mat = obj.material;
        if (mat) {
          const tex = mat.uniforms?.uTex?.value || mat.uniforms?.uTexArray?.value || mat.map;
          if (tex && tex.dispose) tex.dispose();
          mat.dispose();
        }
      });
      if (auraTexture && auraTexture.dispose) auraTexture.dispose();   // belt-and-suspenders (also reached via aura.material.map)
      renderer.dispose();
    },
  };
  return api;
}
