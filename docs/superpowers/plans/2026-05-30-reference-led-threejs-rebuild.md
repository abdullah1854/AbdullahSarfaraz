# Reference-Led Three.js Portfolio Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild ABCV from a generic orb/starfield portfolio into a character-led Three.js portfolio aligned with the kabhishek18 reference grammar and Abdullah's identity.

**Architecture:** Keep the static HTML/CSS/ES-module scaffold. Replace the visual language in place: sparse Geist typography, fixed chrome, one persistent Three.js character scene, section-specific scroll states, glowing career timeline, carousel work section, pearl tech balls, and sparse uncarded contact.

**Tech Stack:** Static HTML, CSS, Three.js, GSAP/ScrollTrigger, Matter.js, browser verification on `http://127.0.0.1:5173`.

---

### Task 1: Page Shell And Content Contract

**Files:**
- Modify: `index.html`
- Modify: `js/content.js`
- Modify: `js/main.js`

- [ ] Replace the current hero/content shell with reference-aligned sections: hero, about, career, work, tech, contact.
- [ ] Keep all visible content sourced from `CONTENT`.
- [ ] Add carousel controls and no-card contact markup.
- [ ] Verify DOM renders meaningful content before WebGL loads.

### Task 2: Reference-Led Design System

**Files:**
- Modify: `css/styles.css`

- [ ] Retoken to Geist, `#050810`, `#0a0e17`, `#5eead4`, muted white, and magenta rim accents.
- [ ] Rebuild fixed nav, centered website link, right nav, left social rail, and fixed resume button.
- [ ] Remove glass cards, starfield clutter, hero paragraph, and orb-specific styling.
- [ ] Build sparse layouts for hero/about/career/work/tech/contact.

### Task 3: Character-Led Three.js Scene

**Files:**
- Modify: `js/scene.js`

- [ ] Replace orb/starfield with one persistent character stage.
- [ ] Use Three.js primitives for a stylized Abdullah avatar: head, cap, hoodie/body, face hints, rim lighting, desk, monitor, keyboard, and mug.
- [ ] Drive scene state from scroll: hero standing/bust, about/work desk posture, tech/contact reduced background presence.
- [ ] Keep the scene fail-open if Three.js extras fail.
**Accepted deviation (2026-05-31 amendment)**: 2D-plane + relaxed luma-key shader + states (with relaxed vignette/circleMask for edge integrity) is the canonical path for this identity/asset fidelity + mobile performance. Fresh hooded character renders confirm reference grammar delivery. Stakeholder acceptance noted in review file.

### Task 4: Motion And Interaction

**Files:**
- Modify: `js/animations.js`
- Modify: `js/main.js`

- [ ] Rebuild loader to pale marquee plus black pill progress.
- [ ] Add duplicate-slide hover treatment for nav/resume/social text where applicable.
- [ ] Add work carousel state and arrows/dots.
- [ ] Keep scroll-driven active nav and reduced-motion fallback.

### Task 5: Tech Pit And Contact Flow

**Files:**
- Modify: `js/techstack.js`
- Modify: `css/styles.css`

- [ ] Retune Matter balls to pearl-white glossy balls with brand labels.
- [ ] Let the tech stack visually bleed toward the contact section.
- [ ] Rebuild contact as sparse columns with no cards.
- [ ] Verify all long text wraps cleanly on desktop/tablet/mobile.

### Task 6: Verification

**Files:**
- No committed artifacts unless explicitly requested.

- [ ] Run `node --check` for all JS files.
- [ ] Verify `curl -I http://127.0.0.1:5173` returns 200.
- [ ] Browser-check desktop and mobile: page identity, nonblank render, no overlay, console health, screenshot evidence, nav/scroll interaction, carousel interaction, tech drag.
- [ ] Compare against reference screenshots and approved generated concepts for at least: hero grammar, nav chrome, character identity, timeline, carousel, tech/contact, mobile collapse.
