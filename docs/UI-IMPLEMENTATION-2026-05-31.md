# ABCV Portfolio — UI Audit Implementation (2026-05-31)

Branch before merge: `feat/techstack-avatar-cursor`. No build step; verified by
loading the local site in Chrome/CDP at desktop, tablet, and phone-sized viewports,
checking console/runtime state, and running JS syntax checks across all modules.

## What shipped

**New shared module** — `js/env.js`: `prefersReducedMotion()`, `coarsePointer()`,
`finePointer()` (live-reading functions, no longer captured once at module-eval) and
canonical `BP = {xs:480, sm:760, md:900, lg:1024}`. Consumed by main/scene/animations/techstack.

**index.html** — `viewport-fit=cover`; Geist Mono added to both font links; 3 low-priority
neighbour-frame preloads; carousel a11y (`aria-live` off `#work-viewport`, dedicated
`#carousel-status` live region + `#carousel-howto` + `aria-keyshortcuts`/`aria-describedby`);
`#hero-badge`; JSON-LD `jobTitle`→"Manager, IT System" + `disambiguatingDescription` +
`hasOccupation` + enriched `worksFor`; `og:locale`, `twitter:image:alt`; web manifest;
`<noscript>` crawlable hero block; version token unified to `?v=20260531-ui-audit`.

**css/styles.css** — `-webkit-backdrop-filter` on all 5 sites + `@supports` opacity
fallback for the two readability-critical glass surfaces; `100vh`/`100dvh` pair on
`.section`/`.hero`; `.no-webgl-scene #webgl{display:none}`; 901–1024 hero/stats rescue;
gradient reserved (stat values now solid, accents demoted except timeline);
h1↔h2 scale widened ~1.25×; **magenta given the active/current state** (nav `.is-active`);
`:active` press beats on `.work-dot`/`.nav__link`; `env(safe-area-inset-bottom)` extended;
`--font-mono` token applied to label/number register; **film-grain + vignette** `body::after`;
`.cursor-reticle`; `.hero__badge` + `.contact-cta` + `.contact-col__note`.

**js/content.js** — de-duplicated "50%" (now one canonical claim); softened the unsupported
60%/40% numerics to qualitative outcomes; "15+ certs" reconciled via a "selection from 15+"
note; project intro covers personal + enterprise; "24h"→"usually replies within a day";
`techSubheading` split from device-adaptive `techHint` (now `{fine, touch}`); CTA fields.

**js/main.js** — env.js seam; tokens unified (fixes the duplicate content.js fetch);
`go(i, announce)` carousel announcements (user actions only); hero badge + primary
`.contact-cta` (mailto + encoded subject); additive `.cursor-reticle` (fine-pointer,
non-reduced-motion); `ICONS`→`SVG_ICONS`; narrowed import vs init catches; "(opens in new tab)" cues.

**js/animations.js** — env.js seam; reveals differentiated by role (headings lead, body
follows with stagger); hero parallax bumped from ±7px to a perceptible ±16–22px.

**js/scene.js** — env.js seam; **P1 WebGL context loss → restore** (cancel rAF + restore
handler re-uploads textures); idle-skip render gate (now realized everywhere, not just at
endpoints); gaze head-turn phone fix (raw mouseX to gaze, damping only on lean); `dispose()`
frees GPU resources; Rec.709 luma; `BP` breakpoints.

> **Reverted (2026-05-31, same day):** the **scroll-driven avatar keyframe blend** was removed.
> It assumed the six sections were evenly spaced at u = 0,.2,.4,.6,.8,1 of *page* scroll, but they
> are not equal height — so at the career viewport the global scroll fraction sampled *between* the
> career park (`x:-2.68`, seated) and the work park (`x:+1.48`, standing). At blend weight 0.18 vs the
> per-section settle lerp's 0.09, it overpowered the park and dragged the figure to centre-left,
> standing, over the "CAREER & EXPERIENCE" heading and the timeline. The discrete per-section parks
> are each tuned to be collision-free; the settle lerp now solely owns the transform.

**js/techstack.js** — env.js seam; tokens unified; touch swipe-vs-grab threshold (vertical
scroll no longer eaten); burst + touch-wake scoped to the tech section; narrow-viewport
wordmark floor; device-adaptive hint copy; **data-constellation** links between marbles.

## Two bugs fixed in the in-progress `DataArrayTexture` gaze-atlas rewrite

(The texture-atlas optimization — audit item #10 — was implemented concurrently as a
WebGL2 `DataArrayTexture` + rim-light shader. It crashed `createScene()`; both fixed:)
1. The texture loader async IIFE was never invoked: `(async () => {...})` `.catch(...)` →
   `.catch is not a function`. Fixed to `(async () => {...})().catch(...)`.
2. The GLSL3 gaze-array vertex shader redeclared `position`/`uv`/`modelViewMatrix`/
   `projectionMatrix`, which three injects for a `ShaderMaterial` → `'redefinition'` compile
   error. Removed the redeclarations.

## Verified in-browser (desktop, Chrome)
Zero console errors across hero / tech / contact. Character renders (new rim-lit avatar);
hero badge pill, solid stat values, Geist Mono labels, cursor reticle (centered + grab state),
tech marbles + device hint, contact CTA, magenta active nav, certs note, softened status — all live.

## Deferred (with reasons)
- **Self-host CDN libs + SRI** (audit #2): gsap/ScrollTrigger ESM builds have internal
  relative imports; naive single-file vendoring breaks the whole experiential layer, and there's
  no bundler here to do it safely. Versions are pinned. Needs a proper vendoring step.
- **apple-touch-icon PNG**: needs a real 180×180 raster (no image tooling available); manifest
  + SVG favicon shipped.

## Latest mobile verification

True phone-width render was verified at 390x844 after the follow-up mobile pass:
the Work section now starts near the top of the viewport, uses a compact card, and
moves project selection into a horizontal scroll-snap rail. The Techstack section
uses a categorized chip fallback on phone/touch devices, leaving the physics canvas
for desktop/fine-pointer devices.

## Note
`three` was bumped 0.160 → 0.184 alongside the array-texture work (external change; left as-is).
This introduces a non-blocking `THREE.Clock` deprecation warning (Clock still functions).
