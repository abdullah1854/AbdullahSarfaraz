export async function initAnimations(scene) {
  // Reveals: hero + work-carousel are owned by dedicated tweens; the generic
  // [data-reveal] loop skips them to avoid double-animating the same node.
  let gsap;
  let ScrollTrigger;
  try {
    ({ gsap } = await import('gsap'));
    ({ ScrollTrigger } = await import('gsap/ScrollTrigger'));
  } catch (error) {
    console.warn('[animations] GSAP unavailable; using basic scroll fallback.', error);
    forceReveal();
    basicScroll(scene);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Lenis: inertia smooth-scroll, driven off the GSAP ticker so it stays in
  // perfect lockstep with ScrollTrigger (scene parking, reveals, progress bar).
  // Touch keeps native scrolling (smoothing touch fights the OS and feels laggy);
  // reduced-motion and any load failure both fall back to plain native scroll.
  let lenis = null;
  if (!prefersReduced) {
    try {
      const { default: Lenis } = await import('lenis');
      lenis = new Lenis({
        duration: 1.05,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo-out: quick start, soft landing
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.6,
      });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
      window.__lenis = lenis;
    } catch (error) {
      console.info('[animations] Lenis unavailable — using native scrolling (dev note)', error);
    }
  }

  document.querySelectorAll('[data-scene]').forEach((section) => {
    const sectionName = section.getAttribute('data-scene');
    ScrollTrigger.create({
      trigger: section,
      start: 'top 55%',
      end: 'bottom 45%',
      onEnter: () => scene.setSection(sectionName),
      onEnterBack: () => scene.setSection(sectionName),
    });
  });

  const progressBar = document.getElementById('scroll-progress-bar');
  ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      scene.setScrollProgress(self.progress);
      if (progressBar) progressBar.style.height = `${(self.progress * 100).toFixed(2)}%`;
    },
  });

  const navLinks = Array.from(document.querySelectorAll('.nav__link'));
  navLinks.forEach((link) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    ScrollTrigger.create({
      trigger: target,
      start: 'top 45%',
      end: 'bottom 42%',
      onToggle: (self) => {
        if (!self.isActive) return;
        navLinks.forEach((item) => { item.classList.remove('is-active'); item.removeAttribute('aria-current'); });
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'true');
      },
    });
  });

  ScrollTrigger.create({
    trigger: '#hero',
    start: 'top top',
    end: 'bottom 42%',
    onToggle: (self) => {
      if (self.isActive) navLinks.forEach((item) => { item.classList.remove('is-active'); item.removeAttribute('aria-current'); });
    },
  });

  if (prefersReduced) {
    forceReveal();
    return;
  }

  const heroLines = gsap.utils.toArray('.hero__name-line > span');
  gsap.set(heroLines, { yPercent: 110 });
  gsap.set(['.hero__eyebrow', '.hero__role-top', '.hero__role-big', '.hero__subtitle', '.mobile-portrait', '.hero__stats'], { opacity: 0, y: 22 });

  gsap.timeline({ delay: 0.18 })
    .to('.hero__eyebrow', { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' })
    .to(heroLines, { yPercent: 0, duration: 1, stagger: 0.08, ease: 'power4.out' }, '-=0.35')
    .to('.hero__role-top', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.55')
    .to('.hero__role-big', { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out' }, '-=0.45')
    .to('.hero__subtitle', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.5')
    .to('.mobile-portrait', { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out' }, '-=0.4')
    .to('.hero__stats', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.42');

  // Safety net: setTimeout fires even when rAF (the GSAP ticker) is throttled in a
  // backgrounded/inactive tab, so the hero copy can never get stuck hidden.
  setTimeout(() => {
    gsap.set(heroLines, { yPercent: 0 });
    gsap.set(['.hero__eyebrow', '.hero__role-top', '.hero__role-big', '.hero__subtitle', '.mobile-portrait', '.hero__stats'], { opacity: 1, y: 0 });
  }, 2400);

  gsap.utils.toArray('[data-reveal]').forEach((element) => {
    if (element.closest('.hero') || element.classList.contains('work-carousel')) return;
    gsap.fromTo(
      element,
      { opacity: 0, y: 28 },
      {
        opacity: 1,
        y: 0,
        duration: 0.72,
        ease: 'power3.out',
        onStart() { element.classList.add('is-revealing'); },
        onComplete() { element.classList.remove('is-revealing'); element.style.willChange = 'auto'; },
        scrollTrigger: { trigger: element, start: 'top 84%', once: true },
      }
    );
  });

  gsap.utils.toArray('.tl-item').forEach((item, index) => {
    gsap.fromTo(
      item,
      { opacity: 0, y: 28, x: index % 2 ? 18 : -18 },
      {
        opacity: 1,
        y: 0,
        x: 0,
        duration: 0.76,
        ease: 'power3.out',
        scrollTrigger: { trigger: item, start: 'top 84%', once: true },
      }
    );
  });

  const timelineProgress = document.getElementById('timeline-progress');
  if (timelineProgress) {
    gsap.to(timelineProgress, {
      height: '100%',
      ease: 'none',
      scrollTrigger: {
        trigger: '#timeline',
        start: 'top 70%',
        end: 'bottom 70%',
        scrub: 0.45,
      },
    });
  }

  const projectPanel = document.querySelector('.work-carousel');
  if (projectPanel) {
    gsap.fromTo(
      projectPanel,
      { opacity: 0, y: 36, rotateX: 4 },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: projectPanel, start: 'top 82%', once: true },
      }
    );
  }

  const heroLeft = document.querySelector('.hero__left');
  const heroRight = document.querySelector('.hero__right');
  if (heroLeft && heroRight && window.matchMedia('(pointer: fine)').matches) {
    let px = 0, py = 0, parallaxQueued = false;
    const applyParallax = () => {
      parallaxQueued = false;
      const hero = document.getElementById('hero');
      if (hero) { const r = hero.getBoundingClientRect(); if (r.bottom < 0 || r.top > window.innerHeight) return; }
      gsap.to(heroLeft, { x: px * 7, y: py * 4, duration: 0.55, ease: 'power2.out', overwrite: true });
      gsap.to(heroRight, { x: px * -6, y: py * -3, duration: 0.55, ease: 'power2.out', overwrite: true });
    };
    window.addEventListener('pointermove', (event) => {
      px = (event.clientX / window.innerWidth - 0.5) * 2;
      py = (event.clientY / window.innerHeight - 0.5) * 2;
      if (!parallaxQueued) { parallaxQueued = true; requestAnimationFrame(applyParallax); }
    }, { passive: true });
  }

  ScrollTrigger.refresh();
}

function forceReveal() {
  document
    .querySelectorAll('[data-reveal], .tl-item, .work-carousel, .hero__eyebrow, .hero__role-top, .hero__role-big, .hero__name-line > span')
    .forEach((element) => {
      element.style.opacity = '1';
      element.style.transform = 'none';
      element.style.filter = 'none';
    });
}

function basicScroll(scene) {
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? window.scrollY / max : 0;
    scene.setScrollProgress(progress);

    const sections = Array.from(document.querySelectorAll('[data-scene]'));
    const active = sections.find((section) => {
      const rect = section.getBoundingClientRect();
      return rect.top < window.innerHeight * 0.55 && rect.bottom > window.innerHeight * 0.45;
    });
    if (active) scene.setSection(active.getAttribute('data-scene'));
  };
  let scrollQueued = false;
  const onScrollRaf = () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => { scrollQueued = false; onScroll(); });
  };
  window.addEventListener('scroll', onScrollRaf, { passive: true });
  onScroll();
}
