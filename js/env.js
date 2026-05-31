// env.js — one seam for environment capability queries and shared breakpoints.
//
// These are FUNCTIONS (not module-eval constants) so they re-read on demand: an OS
// toggle of "reduce motion" or a device that switches pointer type takes effect
// without a reload, and tests can stub a single place. The previous build inlined
// `matchMedia(...).matches` verbatim in four modules, each captured once at import.
//
// BP mirrors the canonical breakpoint set in css/styles.css (xs/sm/md/lg). Keep the
// two in lockstep — this is the single source the JS side reads.

const mq = (query) => (typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia(query)
  : { matches: false, addEventListener() {}, removeEventListener() {} });

export const prefersReducedMotion = () => mq('(prefers-reduced-motion: reduce)').matches;
export const coarsePointer = () => mq('(pointer: coarse)').matches;
export const finePointer = () => mq('(pointer: fine)').matches;

// Canonical layout breakpoints (px). MUST mirror the @media set in css/styles.css.
export const BP = { xs: 480, sm: 760, md: 900, lg: 1024 };
