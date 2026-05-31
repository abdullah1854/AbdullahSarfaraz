// =============================================================================
//  techstack.js — kabhishek18.com-style pearl-white physics "ball-pit".
//
//  Each tech is a PEARL-WHITE glossy marble carrying a brand-colour logo/monogram
//  and a crisp dark wordmark. matter-js runs the physics; the marbles drop into a
//  loose cluster INSIDE the visible panel and can be grabbed, flung, or burst.
//
//  PERFORMANCE: each marble's appearance is static (only its position moves), so
//  we render it ONCE to an offscreen sprite and just blit that sprite per frame.
//  This keeps the look rich while the per-frame cost is ~one drawImage per ball
//  (the previous build re-rendered ~6 gradients per ball per frame → scroll jank).
//
//  Accessibility: the canvas is decorative (aria-hidden); the real screen-reader
//  copy of the stack is a `.visually-hidden` list in the DOM (owned by the markup).
//
//  Fail-safe ladder (the section ALWAYS communicates the stack):
//    • prefers-reduced-motion  → static chip list, no physics.
//    • matter-js fails to load → static chip list.
//    • no canvas / no 2d ctx   → static chip list.
// =============================================================================

import { CONTENT } from './content.js';

// ---- colour helpers ---------------------------------------------------------
function rgb(hex) {
  const h = (hex || '#9aa1b2').replace('#', '');
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(f, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function tint(hex, amt) {
  const { r, g, b } = rgb(hex);
  const to = amt < 0 ? 0 : 255;
  const p = Math.abs(amt);
  return `rgb(${Math.round(r + (to - r) * p)},${Math.round(g + (to - g) * p)},${Math.round(b + (to - b) * p)})`;
}
function seededUnit(seed) {
  const x = Math.sin(seed * 997.3 + 17.7) * 10000;
  return x - Math.floor(x);
}
function roundRect(ctx, x, y, w, h, rad) {
  const r = Math.min(rad, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Use the one webfont the page actually loads (Geist) so canvas labels match the
// rest of the site instead of silently falling back to a system font.
const MARK_FONT = (px, w) => `${w || 800} ${px}px "Geist", system-ui, -apple-system, sans-serif`;
const WORD_FONT = (px, w) => `${w || 700} ${px}px "Geist", system-ui, -apple-system, sans-serif`;

// ---- a small, recognisable vector logo set ---------------------------------
//  Each painter draws a brand mark centred at (cx,cy) within a box of size `s`.
const ICONS = {
  react(ctx, cx, cy, s, c) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = c;
    ctx.lineWidth = Math.max(1.3, s * 0.055);
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 3);
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.5, s * 0.19, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },
  ts(ctx, cx, cy, s, c) {
    const a = s * 0.84;
    roundRect(ctx, cx - a / 2, cy - a / 2, a, a, s * 0.14);
    ctx.fillStyle = c;
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = MARK_FONT(s * 0.44);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TS', cx, cy + s * 0.03);
  },
  node(ctx, cx, cy, s, c) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = c;
    ctx.lineWidth = Math.max(1.4, s * 0.07);
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 3;
      const px = Math.cos(a) * s * 0.46;
      const py = Math.sin(a) * s * 0.46;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = c;
    ctx.font = MARK_FONT(s * 0.32);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', 0, s * 0.02);
    ctx.restore();
  },
  db(ctx, cx, cy, s, c) {
    const w = s * 0.58;
    const h = s * 0.6;
    const ry = s * 0.13;
    ctx.save();
    ctx.fillStyle = c;
    ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
    ctx.beginPath();
    ctx.ellipse(cx, cy + h / 2, w / 2, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, cy - h / 2, w / 2, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = tint(c, 0.4);
    ctx.fill();
    ctx.restore();
  },
};

function iconId(label) {
  const k = (label || '').toLowerCase();
  if (k.includes('typescript')) return 'ts';
  if (k.includes('react')) return 'react';
  if (k.includes('node')) return 'node';
  if (k.includes('sql')) return 'db';
  return null;
}

function monogram(label) {
  const map = {
    python: 'Py', pyspark: 'Sp', 'ms fabric': 'Fa', 'd365 f&o': '365',
    azure: 'Az', odata: 'OD', docker: 'Dk', 'llm · agents': 'AI',
  };
  const k = (label || '').toLowerCase();
  if (map[k]) return map[k];
  const w = (label || '').replace(/[·.&]/g, ' ').split(/\s+/).filter(Boolean);
  return (w.length > 1 ? w.map((s) => s[0]).join('') : (label || '?').slice(0, 2))
    .toUpperCase()
    .slice(0, 3);
}

export async function initTechPit() {
  const wrap = document.getElementById('techpit');
  const canvas = document.getElementById('techpit-canvas');
  const legend = document.getElementById('tech-legend');
  const techs = CONTENT.techstack || [];

  if (!wrap || !canvas || !techs.length) { showFallback(legend, techs, wrap); return; }

  canvas.setAttribute('aria-hidden', 'true');
  canvas.setAttribute('role', 'presentation');

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    showFallback(legend, techs, wrap);
    return;
  }

  let Matter;
  try {
    const mod = await import('matter-js');
    Matter = mod.default || mod;
    if (!Matter || !Matter.Engine) throw new Error('matter-js missing Engine');
  } catch (e) {
    console.warn('[techpit] matter-js unavailable — using chip-list fallback.', e);
    showFallback(legend, techs, wrap);
    return;
  }

  const { Engine, World, Bodies, Body } = Matter;
  const wake = (body) => { if (Matter.Sleeping) Matter.Sleeping.set(body, false); else body.isSleeping = false; };

  const ctx = canvas.getContext('2d');
  if (!ctx) { showFallback(legend, techs, wrap); return; }

  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const FONT = (px) => `700 ${px}px "Geist", system-ui, -apple-system, sans-serif`;
  const RESTITUTION = 0.58, THROW_SCALE = 0.92, MAX_THROW = 30, MAX_SPEED = 30;

  let W = Math.max(1, wrap.clientWidth || 800);
  let H = Math.max(1, wrap.clientHeight || 520);

  const engine = Engine.create();
  engine.gravity.y = 0.28;        // soft gravity; home springs below keep the cluster readable
  engine.enableSleeping = false;
  // More solver passes → touching marbles in the cluster rest steadily instead of
  // micro-jittering against each other (cheap at ~12 bodies, real smoothness win).
  engine.positionIterations = 8;  // default 6
  engine.velocityIterations = 6;  // default 4
  const world = engine.world;

  const sizeScale = () => Math.min(1, Math.max(0.6, Math.min(W, H) / 540));
  function radiusFor(label) {
    ctx.font = FONT(16);
    const tw = ctx.measureText(label.replace(' · ', ' ')).width;
    const longLabelBoost = label.length >= 10 ? 12 : 0;
    return Math.max(50, Math.min(112, tw / 1.45 + 46 + longLabelBoost)) * sizeScale();
  }

  // ---- sprite cache: render one pearl marble (+logo+wordmark) per ball -------
  function buildSprite(b) {
    const r = b.r;
    const pad = Math.ceil(r * 0.42);          // room for the soft drop shadow
    const size = Math.ceil((r + pad) * 2);
    const cv = document.createElement('canvas');
    cv.width = Math.round(size * dpr);
    cv.height = Math.round(size * dpr);
    const c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cx = r + pad, cy = r + pad;

    // soft contact shadow baked under the marble
    const sg = c.createRadialGradient(cx, cy + r * 0.92, 0, cx, cy + r * 0.92, r * 1.15);
    sg.addColorStop(0, 'rgba(2,4,10,0.32)');
    sg.addColorStop(1, 'rgba(2,4,10,0)');
    c.fillStyle = sg;
    c.beginPath();
    c.ellipse(cx, cy + r * 0.95, r * 0.86, r * 0.3, 0, 0, Math.PI * 2);
    c.fill();

    const lx = cx - r * 0.4, ly = cy - r * 0.44;

    // pearl body
    c.save();
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.shadowColor = 'rgba(0,0,0,0.4)';
    c.shadowBlur = 16;
    c.shadowOffsetY = r * 0.1;
    const g = c.createRadialGradient(lx, ly, r * 0.04, cx, cy, r * 1.06);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.18, '#fbfafe');
    g.addColorStop(0.46, '#edeef5');
    g.addColorStop(0.72, '#d3d7e2');
    g.addColorStop(0.9, '#b6bcca');
    g.addColorStop(1, '#9aa1b2');
    c.fillStyle = g;
    c.fill();
    c.restore();

    // shading + accent + sheen, clipped to the sphere
    c.save();
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.clip();

    const ao = c.createRadialGradient(lx, ly, r * 0.25, lx, ly, r * 1.5);
    ao.addColorStop(0, 'rgba(15,18,30,0)');
    ao.addColorStop(0.7, 'rgba(15,18,30,0)');
    ao.addColorStop(1, 'rgba(15,18,30,0.45)');
    c.fillStyle = ao;
    c.fillRect(cx - r, cy - r, r * 2, r * 2);

    if (b.patch) {
      c.globalAlpha = 0.38;
      const pg = c.createRadialGradient(cx + r * 0.55, cy + r * 0.55, r * 0.06, cx + r * 0.55, cy + r * 0.55, r * 1.05);
      pg.addColorStop(0, b.accent);
      pg.addColorStop(0.6, b.accent);
      pg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = pg;
      c.fillRect(cx - r, cy - r, r * 2, r * 2);
      c.globalAlpha = 1;
    }

    const sh = c.createRadialGradient(cx - r * 0.34, cy - r * 0.4, 0, cx - r * 0.34, cy - r * 0.4, r * 0.5);
    sh.addColorStop(0, 'rgba(255,255,255,0.85)');
    sh.addColorStop(0.5, 'rgba(255,255,255,0.16)');
    sh.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = sh;
    c.beginPath();
    c.ellipse(cx - r * 0.34, cy - r * 0.4, r * 0.3, r * 0.22, -0.5, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // crisp hotspot
    c.fillStyle = 'rgba(255,255,255,0.95)';
    c.beginPath();
    c.ellipse(cx - r * 0.3, cy - r * 0.34, r * 0.085, r * 0.06, -0.5, 0, Math.PI * 2);
    c.fill();

    // rim
    c.lineWidth = Math.max(1, r * 0.02);
    c.strokeStyle = 'rgba(255,255,255,0.1)';
    c.beginPath();
    c.arc(cx, cy, r - 0.5, 0, Math.PI * 2);
    c.stroke();

    // brand mark
    const painter = b.icon && ICONS[b.icon];
    const markCY = cy - r * 0.18;
    if (painter) {
      painter(c, cx, markCY, r * 0.62, b.accent);
    } else {
      let fs = r * 0.5;
      c.font = MARK_FONT(fs);
      while (c.measureText(b.mono).width > r * 1.0 && fs > 10) { fs -= 1; c.font = MARK_FONT(fs); }
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = b.accent;
      c.fillText(b.mono, cx, markCY);
    }

    // wordmark (dark ink, wraps if long)
    const label = b.label.replace(' · ', ' ');
    const words = label.split(' ');
    const lines = label.length > 10 && words.length > 1
      ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')]
      : [label];
    let fs = r * 0.26;
    const maxW = r * 1.5;
    do {
      c.font = WORD_FONT(fs, 800);
      if (Math.max(...lines.map((l) => c.measureText(l).width)) <= maxW) break;
      fs -= 1;
    } while (fs > 9);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    // No white stroke: on a pearl-white marble the dark ink already has high contrast,
    // and a semi-opaque outline only blurs the glyph edges. Crisp dark fill instead.
    c.fillStyle = '#10131c';
    const lh = fs * 1.04;
    const baseY = cy + r * 0.42 - (lines.length - 1) * lh * 0.5;
    lines.forEach((ln, i) => {
      c.fillText(ln, cx, baseY + i * lh);
    });

    b.sprite = cv;
    b.spriteSize = size;
    b.spritePad = pad;
  }

  // ---- balls -----------------------------------------------------------------
  const balls = [];
  function homeFor(index, radius) {
    const cols = W < 520 ? 2 : W < 820 ? 3 : 4;
    const rows = Math.ceil(techs.length / cols);
    const col = index % cols;
    const row = Math.floor(index / cols);
    const xRatio = cols === 1 ? 0.5 : 0.13 + (col / (cols - 1)) * 0.74;
    const yRatio = rows === 1 ? 0.5 : 0.24 + (row / (rows - 1)) * 0.48;
    const jitterX = (seededUnit(index + 1) - 0.5) * W * 0.035;
    const jitterY = (seededUnit(index + 31) - 0.5) * H * 0.03;
    return {
      x: Math.min(Math.max(W * xRatio + jitterX, radius), W - radius),
      y: Math.min(Math.max(H * yRatio + jitterY, radius), H - radius),
    };
  }

  function buildBalls() {
    balls.forEach((b) => World.remove(world, b.body));
    balls.length = 0;
    techs.forEach((tch, i) => {
      const r = radiusFor(tch.label);
      const home = homeFor(i, r);
      const x = home.x;
      const y = home.y;
      const body = Bodies.circle(x, y, r, {
        restitution: RESTITUTION, friction: 0.05, frictionAir: 0.032, density: 0.0016, slop: 0.02,
      });
      Body.setVelocity(body, { x: (seededUnit(i + 11) - 0.5) * 2.2, y: (seededUnit(i + 21) - 0.5) * 1.4 });
      const b = {
        body, label: tch.label, accent: tch.accent || '#9aa1b2', r,
        home,
        phase: seededUnit(i + 41) * Math.PI * 2,
        icon: iconId(tch.label), mono: monogram(tch.label), patch: i % 3 === 1,
        sprite: null, spriteSize: 0, spritePad: 0,
        scale: 1, px: x, py: y,   // scale = eased focus zoom; px/py = last physics-tick pos (render interp)
      };
      buildSprite(b);
      World.add(world, body);
      balls.push(b);
    });
  }

  // ---- walls (floor raised so the settled cluster stays inside the panel) -----
  let walls = [];
  function buildWalls() {
    walls.forEach((w) => World.remove(world, w));
    const thick = 240;
    const opt = { isStatic: true, restitution: 0.4, friction: 0.05 };
    const floorTop = Math.min(H - 8, Math.round(H * 0.82));
    walls = [
      Bodies.rectangle(W / 2, floorTop + thick / 2, W + thick * 2, thick, opt), // floor
      Bodies.rectangle(-thick / 2, H / 2, thick, H * 4, opt),                    // left
      Bodies.rectangle(W + thick / 2, H / 2, thick, H * 4, opt),                 // right
      Bodies.rectangle(W / 2, -thick / 2, W + thick * 2, thick, opt),            // ceiling (flings stay in)
    ];
    World.add(world, walls);
  }

  function sizeCanvas() {
    W = Math.max(1, wrap.clientWidth);
    H = Math.max(1, wrap.clientHeight);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // smooth the per-frame scaled sprite blits (hover pop + sub-pixel motion)
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }

  sizeCanvas();
  buildWalls();
  // Canvas bakes the active font into each cached sprite, so wait for Geist before the
  // first build (race a timeout so a slow/blocked font never hangs the section).
  try {
    await Promise.race([
      document.fonts && document.fonts.load
        ? Promise.all([document.fonts.load('800 24px "Geist"'), document.fonts.load('700 18px "Geist"')])
        : Promise.resolve(),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
  } catch (e) { /* fall back to whatever font is resolved */ }
  buildBalls();
  // If the race timed out before Geist arrived, rebuild the sprites once it settles so
  // the labels are never stuck on the fallback face.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { balls.forEach(buildSprite); }).catch(() => {});
  }

  // ---- radial burst (click/tap on empty space) -------------------------------
  function burst(px, py, strength) {
    const R = Math.max(W, H) * 0.55;
    for (const b of balls) {
      const dx = b.body.position.x - px, dy = b.body.position.y - py;
      const d = Math.hypot(dx, dy) || 0.01;
      const f = Math.max(0, 1 - d / R);
      if (f <= 0) continue;
      wake(b.body);
      const imp = strength * f * f;
      const v = b.body.velocity;
      Body.setVelocity(b.body, {
        x: Math.max(-MAX_THROW, Math.min(MAX_THROW, v.x + (dx / d) * imp)),
        y: Math.max(-MAX_THROW, Math.min(MAX_THROW, v.y + (dy / d) * imp - imp * 0.35)),
      });
    }
  }

  // ---- pointer: grab/throw (mouse + touch) + stir + click-burst ---------------
  canvas.style.touchAction = 'pan-y';
  let drag = null, hoverBall = null;
  const pointer = { x: 0, y: 0, inside: false };

  function toLocal(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (W / rect.width), y: (e.clientY - rect.top) * (H / rect.height) };
  }
  function ballAt(p) {
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      const dx = b.body.position.x - p.x, dy = b.body.position.y - p.y;
      if (dx * dx + dy * dy <= (b.r + 6) * (b.r + 6)) return b;
    }
    return null;
  }
  canvas.addEventListener('pointerdown', (e) => {
    const p = toLocal(e); pointer.x = p.x; pointer.y = p.y; pointer.inside = true;
    const b = ballAt(p);
    if (!b) { if (finePointer) burst(p.x, p.y, 24); return; }
    e.preventDefault();
    drag = { ball: b, offX: b.body.position.x - p.x, offY: b.body.position.y - p.y, tx: b.body.position.x, ty: b.body.position.y, vx: 0, vy: 0, id: e.pointerId, gx: p.x, gy: p.y, moved: false };
    wake(b.body);
    try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = toLocal(e); pointer.x = p.x; pointer.y = p.y; pointer.inside = true;
    if (drag && e.pointerId === drag.id) {
      e.preventDefault();
      if (Math.hypot(p.x - drag.gx, p.y - drag.gy) > 6) drag.moved = true;
      const nx = p.x + drag.offX, ny = p.y + drag.offY;
      drag.vx = nx - drag.tx; drag.vy = ny - drag.ty; drag.tx = nx; drag.ty = ny;
    } else if (finePointer) { hoverBall = ballAt(p); }
  });
  function endDrag(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    const b = drag.ball; wake(b.body);
    if (!drag.moved) {
      Body.setVelocity(b.body, { x: (Math.random() - 0.5) * 6, y: -11 });
      burst(b.body.position.x, b.body.position.y, 13);
    } else {
      Body.setVelocity(b.body, {
        x: Math.max(-MAX_THROW, Math.min(MAX_THROW, drag.vx * THROW_SCALE)),
        y: Math.max(-MAX_THROW, Math.min(MAX_THROW, drag.vy * THROW_SCALE)),
      });
    }
    try { canvas.releasePointerCapture(drag.id); } catch (_) { /* ignore */ }
    drag = null;
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', () => { pointer.inside = false; if (!drag) hoverBall = null; });

  // ---- render: blit each cached sprite at its INTERPOLATED position -----------
  // Positions are lerped between the last two physics ticks (alpha = leftover
  // accumulator fraction), so motion stays buttery and refresh-rate-independent —
  // a 120/144Hz screen shows true in-between frames instead of 60Hz snapping.
  // The grabbed ball is drawn at its live position (zero interpolation lag).
  function draw(alpha = 1) {
    ctx.clearRect(0, 0, W, H);
    for (const b of balls) {
      const dragging = drag && drag.ball === b;
      const focused = dragging || b === hoverBall;
      // ease the focus zoom instead of snapping 1 → 1.08 (no pop)
      b.scale += ((focused ? 1.08 : 1) - b.scale) * 0.22;
      const x = dragging ? b.body.position.x : b.px + (b.body.position.x - b.px) * alpha;
      const y = dragging ? b.body.position.y : b.py + (b.body.position.y - b.py) * alpha;
      const half = (b.r + b.spritePad) * b.scale;
      ctx.drawImage(b.sprite, x - half, y - half, half * 2, half * 2);
    }
  }

  // ---- ambient + cursor stir --------------------------------------------------
  let t = 0;
  const STIR_RADIUS = () => Math.max(150, Math.min(W, H) * 0.36);
  function applyForces() {
    const R = STIR_RADIUS();
    for (const b of balls) {
      if (drag && drag.ball === b) continue;
      const body = b.body, pos = body.position, m = body.mass;
      const sx = Math.cos(t * 0.6 + b.phase) * 0.00022;
      const sy = Math.sin(t * 0.5 + b.phase * 1.3) * 0.00012;
      Body.applyForce(body, pos, { x: sx * m * b.r, y: sy * m * b.r });
      const homeDx = b.home.x - pos.x;
      const homeDy = b.home.y - pos.y;
      Body.applyForce(body, pos, { x: homeDx * 0.0000024 * m, y: homeDy * 0.0000024 * m });
      if (pointer.inside) {
        const dx = pos.x - pointer.x, dy = pos.y - pointer.y;
        const d = Math.hypot(dx, dy);
        if (d < R && d > 0.01) {
          const f = (1 - d / R);
          const push = f * f * 0.02 * m;
          Body.applyForce(body, pos, { x: (dx / d) * push, y: (dy / d) * push });
        }
      }
    }
  }

  // ---- loop + lifecycle -------------------------------------------------------
  // Fixed-timestep accumulator: physics always advances in constant 1/60s ticks
  // (deterministic, no variable-dt jitter), and rendering interpolates between
  // ticks. Same feel on 60Hz, but silky in-between frames on 120/144Hz — the old
  // variable-dt loop both ran ~2× too fast and snapped on high-refresh displays.
  const FIXED_DT = 1000 / 60;   // physics tick; matches Matter's gravity calibration
  const MAX_SUBSTEPS = 5;        // cap catch-up after a stall (no spiral-of-death)
  let raf = 0, running = false, last = 0, acc = 0;

  function step(dt) {
    applyForces();
    Engine.update(engine, dt);
    if (drag) {
      Body.setPosition(drag.ball.body, { x: drag.tx, y: drag.ty });
      Body.setVelocity(drag.ball.body, { x: 0, y: 0 });
    }
    for (const b of balls) {
      const v = b.body.velocity, s = Math.hypot(v.x, v.y);
      if (s > MAX_SPEED) Body.setVelocity(b.body, { x: (v.x / s) * MAX_SPEED, y: (v.y / s) * MAX_SPEED });
    }
  }

  function frame(now) {
    if (!running) return;
    let elapsed = now - last; last = now;
    if (!(elapsed > 0)) elapsed = FIXED_DT;
    elapsed = Math.min(elapsed, 250);   // ignore huge gaps (tab refocus / GC pause)
    acc += elapsed;
    t += elapsed / 1000;                // ambient stir runs on wall-clock time

    let steps = 0;
    while (acc >= FIXED_DT && steps < MAX_SUBSTEPS) {
      // snapshot pre-step positions → render lerps from here to the post-step pos
      for (const b of balls) { b.px = b.body.position.x; b.py = b.body.position.y; }
      step(FIXED_DT);
      acc -= FIXED_DT;
      steps++;
    }
    if (steps === MAX_SUBSTEPS) acc = 0;  // drop backlog after a long stall

    draw(acc / FIXED_DT);                 // interpolate the leftover tick fraction
    raf = requestAnimationFrame(frame);
  }
  function start() { if (running) return; running = true; last = performance.now(); acc = 0; raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  draw();

  function onScreen() {
    const rect = wrap.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting && !document.hidden ? start() : stop()));
    }, { threshold: 0.06 }).observe(wrap);
  } else { start(); }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else if (onScreen()) start();
  });

  // ---- resize (radii change → rebuild walls + sprites) ------------------------
  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      sizeCanvas();
      buildWalls();
      balls.forEach((b, i) => {
        const nr = radiusFor(b.label);
        if (Math.abs(nr - b.r) > 1) { b.r = nr; buildSprite(b); }
        b.home = homeFor(i, b.r);
        const p = b.body.position;
        const nx = Math.min(Math.max(p.x, b.r), W - b.r);
        const ny = Math.min(Math.max(p.y, b.r), H - b.r);
        if (nx !== p.x || ny !== p.y) Body.setPosition(b.body, { x: nx, y: ny });
        b.px = b.body.position.x; b.py = b.body.position.y; // resync interp snapshot (no streak)
      });
      draw(1);
    }, 150);
  });
}

// ---- no-physics fallback ----------------------------------------------------
function showFallback(legend, techs, wrap) {
  if (wrap) wrap.style.display = 'none';
  if (!legend || !techs || !techs.length) return;
  legend.classList.add('is-fallback');
  legend.innerHTML = techs
    .map((t) => `<span class="tech__chip"><i style="background:${t.accent};box-shadow:0 0 10px ${t.accent}"></i>${t.label}</span>`)
    .join('');
}
