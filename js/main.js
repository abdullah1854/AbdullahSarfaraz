// main.js — render CONTENT into the static shell, then boot the character scene,
// scroll motion, pearl tech pit, and the work carousel. The DOM is rendered FIRST
// so the page is meaningful before any WebGL loads (and even if it never does).

import { CONTENT } from './content.js?v=20260531-techstack-layout';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ----------------------------------------------------------------- icons -- */
const ICONS = {
  github:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.22-3.37-1.22-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z"/></svg>',
  linkedin:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.64h.05c.53-1 1.83-2.06 3.76-2.06C20.6 8.58 22 10.2 22 13.5V21h-4v-6.6c0-1.57-.03-3.6-2.2-3.6-2.2 0-2.54 1.72-2.54 3.49V21H9V9Z"/></svg>',
  twitter:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.96 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.01 4.13H5.05l12.03 15.64Z"/></svg>',
  email:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/></svg>',
  website:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18"/></svg>',
  arrowL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
  arrowR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
};
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ------------------------------------------------------------- rendering -- */
function renderChrome() {
  const header = document.getElementById('nav');
  if (header) {
    header.appendChild(el(`<a class="brand" href="#hero" aria-label="${esc(CONTENT.brand.name)} — home">${esc(CONTENT.brand.initials)}</a>`));
    header.appendChild(el(`<a class="site-link" href="${esc(CONTENT.social.find((s) => s.type === 'website')?.url || '#')}" target="_blank" rel="noopener">${esc(CONTENT.brand.siteLinkText || 'abdullahsarfaraz.cloud')}</a>`));
    const nav = el('<nav class="nav" aria-label="Primary"></nav>');
    CONTENT.nav.forEach((item) => nav.appendChild(el(`<a class="nav__link" href="${esc(item.target)}">${esc(item.label)}</a>`)));
    header.appendChild(nav);
  }

  const rail = document.getElementById('social-rail');
  if (rail) {
    CONTENT.social.forEach((s) => {
      rail.appendChild(el(`<a class="social-rail__link" href="${esc(s.url)}" target="_blank" rel="noopener" aria-label="${esc(s.label)} (opens in new tab)">${ICONS[s.type] || ICONS.website}</a>`));
    });
  }

  const resume = document.getElementById('resume-link');
  if (resume) {
    const resumeLabel = CONTENT.brand.resumeLabel || 'Resume';
    resume.href = CONTENT.brand.resumeUrl || '#';
    resume.innerHTML = `${esc(resumeLabel)} <i aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M7 17 17 7M9 7h8v8"/></svg></i>`;
    resume.setAttribute('aria-label', `${resumeLabel} (opens in new tab)`);
  }
}

function renderHero() {
  const eyebrow = document.querySelector('.hero__eyebrow');
  if (eyebrow) eyebrow.textContent = CONTENT.hero.greeting;

  const name = document.querySelector('.hero__name');
  if (name) {
    name.innerHTML = CONTENT.hero.name
      .map((line) => `<span class="hero__name-line"><span>${esc(line)}</span></span>`)
      .join('');
  }

  const roleTop = document.querySelector('.hero__role-top');
  if (roleTop) roleTop.textContent = CONTENT.hero.roleTop;
  const roleBig = document.querySelector('.hero__role-big');
  if (roleBig) roleBig.textContent = CONTENT.hero.roleBig;

  const subtitle = document.getElementById('hero-subtitle');
  if (subtitle && CONTENT.hero.subtitle) subtitle.textContent = CONTENT.hero.subtitle;

  const stats = document.getElementById('hero-stats');
  if (stats && Array.isArray(CONTENT.hero.stats)) {
    stats.innerHTML = CONTENT.hero.stats
      .map((s) => `<div class="hero__stat"><span class="hero__stat-value">${esc(s.value)}</span><span class="hero__stat-label">${esc(s.label)}</span></div>`)
      .join('');
  }

  const ticker = document.getElementById('hero-ticker');
  if (ticker) {
    const items = (CONTENT.hero.marquee || []).map((m) => `<span>${esc(m)}</span>`).join('');
    ticker.innerHTML = `<div class="hero__ticker-track">${items}${items}</div>`;
  }
}

function renderAbout() {
  const kicker = document.querySelector('#about .section-kicker');
  if (kicker) kicker.textContent = CONTENT.about.eyebrow;
  const h2 = document.querySelector('#about .about__copy h2');
  if (h2) h2.textContent = CONTENT.about.title;
  const p = document.querySelector('#about .about__copy p');
  if (p) p.textContent = CONTENT.about.body;
  const facts = document.querySelector('#about .about__facts');
  if (facts) facts.innerHTML = (CONTENT.about.facts || []).map((f) => `<span>${esc(f)}</span>`).join('');
}

function renderCareer() {
  const title = document.getElementById('career-title');
  if (title) title.textContent = (CONTENT.careerHeading || ['Career']).join(' ');
  const items = document.getElementById('timeline-items');
  if (!items) return;
  items.innerHTML = (CONTENT.experience || [])
    .map((org) => {
      const roles = org.roles || [];
      // A card "mixes" employers when a role names a company different from the card header
      // (the merged short-stint cards). Only then do we tag each role with its real company,
      // so a merged card never misrepresents who the role was actually with.
      const mixed = roles.some((r) => r.company && r.company !== org.company);
      const rolesHTML = roles
        .map((role) => {
          const orgTag = mixed && role.company
            ? `<span class="tl-role__org">${esc(role.company)}</span>`
            : '';
          const meta = [role.period, role.duration].filter(Boolean).map(esc).join(' · ');
          const points = (role.points || []).map((p) => `<li>${esc(p)}</li>`).join('');
          return `
            <div class="tl-role">
              <div class="tl-role__head">
                <span class="tl-role__title">${esc(role.title)}</span>
                ${orgTag}
              </div>
              ${meta ? `<div class="tl-role__meta">${meta}</div>` : ''}
              ${points ? `<ul class="tl-role__points">${points}</ul>` : ''}
            </div>`;
        })
        .join('');
      return `
        <article class="tl-item" data-reveal>
          <div class="tl-item__period">${esc(org.period || '')}</div>
          <div class="tl-item__body">
            <div class="tl-item__org-head">
              <h3 class="tl-item__org">${esc(org.company)}</h3>
              ${org.location ? `<span class="tl-item__loc">${esc(org.location)}</span>` : ''}
              ${org.current ? '<span class="tl-item__badge">Current</span>' : ''}
            </div>
            <div class="tl-roles">${rolesHTML}</div>
          </div>
        </article>`;
    })
    .join('');
}

function renderWork() {
  const title = document.getElementById('work-title');
  if (title) title.textContent = CONTENT.projectsHeading;
  const intro = document.getElementById('work-intro');
  if (intro) intro.textContent = CONTENT.projectsIntro;
  const all = document.getElementById('work-all');
  if (all) { all.href = CONTENT.projectsAllUrl || '#'; all.innerHTML = `All projects <span aria-hidden="true">↗</span>`; }

  const viewport = document.getElementById('work-viewport');
  if (viewport) {
    const slides = CONTENT.projects
      .map(
        (proj) => `
        <div class="work-slide">
          <article class="work-card">
            <div class="work-card__top">
              <div>
                <div class="work-card__type">${esc(proj.type)}</div>
                <h3 class="work-card__title">${esc(proj.title)}</h3>
              </div>
              <div class="work-card__num">${esc(proj.number)}</div>
            </div>
            <p class="work-card__desc">${esc(proj.description)}</p>
            <ul class="work-card__points">${(proj.points || []).map((pt) => `<li>${esc(pt)}</li>`).join('')}</ul>
            <div class="work-card__stack">${esc(proj.stack)}</div>
          </article>
        </div>`
      )
      .join('');
    viewport.innerHTML = `<div class="work-track" id="work-track">${slides}</div>`;
  }

  const prev = document.getElementById('project-prev');
  if (prev) prev.innerHTML = ICONS.arrowL;
  const next = document.getElementById('project-next');
  if (next) next.innerHTML = ICONS.arrowR;

  const dots = document.getElementById('project-dots');
  if (dots) {
    dots.innerHTML = CONTENT.projects
      .map((_, i) => `<button class="work-dot${i === 0 ? ' is-active' : ''}" type="button" aria-label="Go to project ${i + 1}"></button>`)
      .join('');
  }
}

function renderTech() {
  const title = document.getElementById('tech-title');
  if (title) title.textContent = CONTENT.techHeading;
  const sub = document.getElementById('tech-subheading');
  if (sub) sub.textContent = CONTENT.techSubheading;
  // Screen-reader equivalent of the decorative pearl ball-pit: a real list of the stack.
  const srList = document.getElementById('tech-sr-list');
  if (srList) srList.innerHTML = (CONTENT.techstack || []).map((t) => `<li>${esc(t.label)}</li>`).join('');
}

function renderContact() {
  const title = document.getElementById('contact-title');
  if (title) title.textContent = CONTENT.contact.heading;
  const lead = document.getElementById('contact-lead');
  if (lead) lead.textContent = CONTENT.contact.lead;

  const grid = document.getElementById('contact-grid');
  const c = CONTENT.contact;
  if (grid) {
    grid.innerHTML = `
      <a class="contact-email" href="mailto:${esc(c.email)}" data-reveal>${esc(c.email)}</a>
      <div class="contact-cols">
        <div class="contact-col">
          <h3>Certified</h3>
          <ul>${(c.certifications || []).map((cert) => `<li><span>${esc(cert)}</span></li>`).join('')}</ul>
        </div>
        <div class="contact-col">
          <h3>Currently</h3>
          <ul>
            <li><span>${esc(c.current)}</span></li>
            <li><span>${esc(c.location)}</span></li>
            <li><span>${esc(c.status)}</span></li>
          </ul>
        </div>
        <div class="contact-col">
          <h3>Elsewhere</h3>
          <ul>
            ${CONTENT.social.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} <span aria-hidden="true">↗</span></a></li>`).join('')}
          </ul>
        </div>
      </div>`;
  }

  const footer = document.getElementById('footer');
  if (footer) {
    footer.innerHTML = `<span>${esc(CONTENT.footer.text)}</span><span>© ${new Date().getFullYear()}</span>`;
  }
}

/* -------------------------------------------------------------- carousel -- */
function initCarousel() {
  const track = document.getElementById('work-track');
  const dots = Array.from(document.querySelectorAll('#project-dots .work-dot'));
  const prev = document.getElementById('project-prev');
  const next = document.getElementById('project-next');
  if (!track) return;
  const count = CONTENT.projects.length;
  let index = 0;
  let timer = 0;

  const slides = Array.from(track.children);
  const go = (i) => {
    index = (i + count) % count;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, di) => {
      const on = di === index;
      d.classList.toggle('is-active', on);
      d.setAttribute('aria-current', on ? 'true' : 'false');
    });
    // keep off-screen slides out of the tab order / AT tree
    slides.forEach((s, si) => s.toggleAttribute('inert', si !== index));
  };
  const stop = () => clearInterval(timer);
  const play = () => {
    if (prefersReducedMotion) return;
    stop();
    timer = setInterval(() => go(index + 1), 5200);
  };

  prev && prev.addEventListener('click', () => { go(index - 1); play(); });
  next && next.addEventListener('click', () => { go(index + 1); play(); });
  dots.forEach((d, di) => d.addEventListener('click', () => { go(di); play(); }));

  const carousel = document.getElementById('work-carousel');
  if (carousel) {
    carousel.addEventListener('pointerenter', stop);
    carousel.addEventListener('pointerleave', play);
    // WCAG 2.2.2: pause auto-rotation while a control inside has focus
    carousel.addEventListener('focusin', stop);
    carousel.addEventListener('focusout', play);
    carousel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { go(index + 1); play(); }
      else if (e.key === 'ArrowLeft') { go(index - 1); play(); }
    });
  }
  // stop the timer (and its transform writes) when the tab/section isn't visible
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else play(); });
  if ('IntersectionObserver' in window && carousel) {
    new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? play() : stop()));
    }, { threshold: 0.2 }).observe(carousel);
  }

  // touch swipe + pause-on-touch (pointerenter/leave don't fire reliably on touch)
  let sx = 0, sy = 0, swiping = false;
  const vp = document.getElementById('work-viewport');
  if (vp) {
    vp.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; swiping = true; stop(); });
    vp.addEventListener('pointerup', (e) => {
      if (!swiping) return;
      swiping = false;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { dx < 0 ? go(index + 1) : go(index - 1); }
      play();
    });
    vp.addEventListener('pointercancel', () => { swiping = false; play(); });
  }

  go(0);
  play();
}

/* ---------------------------------------------------------------- loader -- */
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runLoader(readyPromise = Promise.resolve()) {
  const loader = document.getElementById('loader');
  const percent = document.getElementById('loader-percent');
  const bar = document.querySelector('.loader__bar > span');
  if (!loader) return;
  const setProgress = (value) => {
    if (percent) percent.textContent = `${Math.round(value)}%`;
    if (bar) bar.style.width = `${value}%`;
  };

  if (prefersReducedMotion) {
    Promise.resolve(readyPromise).finally(() => {
      setProgress(100);
      loader.classList.add('is-done');
    });
    return;
  }

  let p = 0;
  let finishing = false;
  const tick = () => {
    if (finishing) return;
    p = Math.min(88, p + Math.random() * 10 + 5);
    setProgress(p);
    setTimeout(tick, 110);
  };
  tick();

  Promise.all([Promise.resolve(readyPromise).catch(() => {}), wait(760)]).then(() => {
    finishing = true;
    setProgress(100);
    setTimeout(() => { loader.classList.add('is-done'); }, 260);
  });
}

/* ------------------------------------------------------------ smooth nav -- */
function initSmoothScroll() {
  document.addEventListener('click', (event) => {
    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    event.preventDefault();
    // Prefer Lenis (set up in animations.js) so programmatic jumps share the same
    // inertia/easing as wheel scrolling; fall back to native smooth scroll.
    const lenis = window.__lenis;
    if (lenis && !prefersReducedMotion) {
      lenis.scrollTo(target, { offset: 0, duration: 1.2 });
    } else {
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    }
  });
}

/* ------------------------------------------------------------------ boot -- */
async function boot() {
  // Each render is isolated: a single missing CONTENT field can't abort the whole boot
  // (which would otherwise kill the scene, carousel, tech pit, and leave the loader stuck).
  const safe = (fn, label) => { try { fn(); } catch (e) { console.warn(`[main] ${label} failed`, e); } };
  safe(renderChrome, 'renderChrome');
  safe(renderHero, 'renderHero');
  safe(renderAbout, 'renderAbout');
  safe(renderCareer, 'renderCareer');
  safe(renderWork, 'renderWork');
  safe(renderTech, 'renderTech');
  safe(renderContact, 'renderContact');
  safe(initCarousel, 'initCarousel');
  safe(initSmoothScroll, 'initSmoothScroll');
  let releaseLoader = () => {};
  const loaderGate = new Promise((resolve) => { releaseLoader = resolve; });
  runLoader(loaderGate);

  // Warm matter-js in parallel with the WebGL scene so tech-pit init never blocks scroll.
  const matterWarm = import('matter-js').catch(() => {});

  let scene = null;
  try {
    const canvas = document.getElementById('webgl');
    const supportsWebgl = (() => {
      let probe = null;
      let context = null;
      try {
        probe = document.createElement('canvas');
        context = probe.getContext('webgl2') || probe.getContext('webgl');
        const supported = !!context;
        if (context) {
          const loseContext = context.getExtension('WEBGL_lose_context');
          if (loseContext) loseContext.loseContext();
        }
        return supported;
      } catch (_) {
        return false;
      } finally {
        context = null;
        probe = null;
      }
    })();
    if (canvas && supportsWebgl) {
      const { createScene } = await import('./scene.js?v=20260531-fluid-mobile');
      scene = createScene(canvas);
    } else {
      document.documentElement.classList.add('no-webgl-scene');
    }
  } catch (error) {
    document.documentElement.classList.add('no-webgl-scene');
    console.warn('[main] character scene unavailable.', error);
  }
  Promise.race([scene?.ready || Promise.resolve(), wait(2600)]).finally(releaseLoader);

  try {
    const { initAnimations } = await import('./animations.js?v=20260531-fluid-mobile');
    await initAnimations(scene || { setScrollProgress() {}, setSection() {}, setMouse() {}, revealTech() {}, resize() {} });
  } catch (error) {
    console.warn('[main] animations unavailable.', error);
  }

  try {
    await matterWarm;
    const { initTechPit } = await import('./techstack.js?v=20260531-techstack-layout');
    initTechPit();
  } catch (error) {
    console.warn('[main] tech pit unavailable.', error);
  }

  if (scene) {
    window.addEventListener('resize', () => scene.resize(), { passive: true });
    const syncPointer = (x, y) => {
      scene.setMouse(
        (x / window.innerWidth) * 2 - 1,
        (y / window.innerHeight) * 2 - 1
      );
    };
    window.addEventListener('pointermove', (event) => syncPointer(event.clientX, event.clientY), { passive: true });
    window.addEventListener('touchmove', (event) => {
      const touch = event.touches && event.touches[0];
      if (touch) syncPointer(touch.clientX, touch.clientY);
    }, { passive: true });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
