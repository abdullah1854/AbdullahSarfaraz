# Abdullah Sarfaraz — Character-Led Portfolio

A single-page, **Three.js** portfolio inspired by the layout of kabhishek18.com,
rebuilt around Abdullah Sarfaraz (Solutions Architect & AI Engineer).

Dark #050810 base · cyan #5eead4 + magenta #ff4fd8 accents · Geist uppercase type ·
persistent reactive 2D-plane Higgsfield character (luma-key + aura) as visual anchor
with section-specific states; glowing timeline; pearl tech ball-pit; sparse contact.
All tuned for scroll-reactive motion and reference grammar fidelity.

## Run it

No build step. Any static server works (ES modules need http://, not file://):

```bash
# option A — Python (already on macOS)
cd "ABCV" && python3 -m http.server 5173
# open http://localhost:5173

# option B — Node
cd "ABCV" && npx serve -l 5173
```

## Stack

- **three.js 0.160** (ESM via jsdelivr importmap) — scene, custom GLSL shader, UnrealBloom
- **GSAP + ScrollTrigger** — scroll-driven reveals & scene control
- **Matter.js 0.20** — draggable, physics-based tech stack ball-pit
- Native browser scrolling — avoids layout conflicts while keeping anchor navigation simple
- Google Fonts: Sora, Space Grotesk, Inter

External ESM dependencies are loaded through the importmap in `index.html`. Every
add-on (RoomEnvironment, EffectComposer/Bloom, GSAP, Matter.js) is wrapped in a
fail-safe — if a CDN module doesn't load, the site degrades gracefully instead
of breaking.

## Edit your content

Everything lives in **`js/content.js`** — name, roles, career timeline,
projects, tech stack and contact. Change values there and reload; the DOM and
the 3D scene both update.

A few fields worth personalising:
- `brand.resumeUrl` → link to your resume PDF (currently `#`)
- `contact.education` → your real degree / institution
- `experience[*].period` → confirm exact year ranges

## Files

```
index.html         markup shell + importmap + Google Fonts
css/styles.css     design system (colors, type, layout, responsive, a11y utilities)
js/content.js      ← all editable content (single source of truth)
js/scene.js        three.js scene: AI core shader, particles, postprocessing
js/animations.js   GSAP ScrollTrigger reveals, nav state, scene driving
js/techstack.js    Matter.js bouncy-ball tech stack with chip fallback
js/main.js         renders content into the shell, boots scene + animations + ball-pit
```
