// Shared runtime for explainer illustrations (ADR-024).
//
// An illustration supplies a Card — three functions — and the runtime does the rest:
//   reset(q)    put every part in its starting state (runs before each loop)
//   script(b)   lay out the scenes on one timeline; return the time the story ends
//   still(q)    the finished picture shown when the viewer prefers reduced motion
//
// Engines, by job: Motion animates every effect and is the single clock. Strokes are drawn by GSAP's
// DrawSVG (b.draw / b.undraw) on a paused GSAP timeline that Motion's clock drives, so loop, seek and
// off-screen pausing stay one control. GSAP is allowed here only — never in packages/core.
//
// SVG note: Motion writes fill, width, height, rx and attrX/attrY as attributes, and opacity/scale/x/y
// as inline style — reset them through the same channel, or a leftover inline style overrides every
// frame Motion writes.
import { animate, motionValue } from 'motion';
import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(DrawSVGPlugin, CustomEase);

export type El = HTMLElement | SVGElement;
export type Q = ((selector: string) => El) & { all: (selector: string) => El[] };
type Bezier = [number, number, number, number];

export type Motion = {
  enter: number; exit: number; emphasis: number; draw: number; recolor: number; stagger: number; hold: number;
  eEnter: Bezier; eExit: Bezier; eEmphasis: Bezier; eDraw: Bezier;
};

export type Builder = {
  M: Motion;
  add: (el: El | ReturnType<typeof motionValue<number>>, keyframes: Record<string, unknown>, at: number, duration: number, ease: unknown, extra?: Record<string, unknown>) => void;
  enter: (el: El, at: number) => void;
  exit: (el: El, at: number, to?: number) => void;
  pop: (el: El, at: number) => void;
  slideIn: (el: El, at: number) => void;
  draw: (el: El, at: number, duration?: number) => void;
  undraw: (el: El, at: number, duration?: number) => void;
};

export type Card = {
  reset: (q: Q) => void;
  script: (b: Builder, q: Q) => number;
  still: (q: Q) => void;
};

// ── Tokens: read the illustration.motion.* custom properties once ──────────────
let tokens: Motion | null = null;
export function motionTokens(): Motion {
  if (tokens) return tokens;
  const css = getComputedStyle(document.documentElement);
  const tok = (n: string) => css.getPropertyValue(`--helix-illustration-motion-${n}`).trim();
  const sec = (n: string) => parseFloat(tok(n)) / 1000;
  const bez = (n: string) => tok(n).match(/-?[\d.]+/g)!.map(Number) as Bezier;
  tokens = {
    enter: sec('duration-enter'), exit: sec('duration-exit'), emphasis: sec('duration-emphasis'),
    draw: sec('duration-draw'), recolor: sec('duration-recolor'), stagger: sec('stagger'), hold: sec('hold'),
    eEnter: bez('easing-enter'), eExit: bez('easing-exit'), eEmphasis: bez('easing-emphasis'), eDraw: bez('easing-draw'),
  };
  // The same cubic-bezier values, registered as GSAP eases for strokes.
  (['enter', 'exit', 'emphasis', 'draw'] as const).forEach((n) =>
    CustomEase.create(`illus-${n}`, bez(`easing-${n}`).join(',')));
  return tokens;
}

/** Resolve a CSS custom property to a literal color Motion can interpolate. */
export const color = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// ── Small helpers for reset()/still() ─────────────────────────────────────────
export const hide = (els: El | El[]) => [els].flat().forEach((el) => (el.style.opacity = '0'));
export const show = (els: El | El[]) => [els].flat().forEach((el) => (el.style.opacity = '1'));
export const untransform = (els: El | El[]) => [els].flat().forEach((el) => (el.style.transform = 'none'));
export const attrs = (el: El, a: Record<string, string | number>) =>
  Object.entries(a).forEach(([k, v]) => el.setAttribute(k, String(v)));
export const drawn = (els: El | El[]) => gsap.set([els].flat(), { drawSVG: '100%' });

function builder(M: Motion) {
  const seq: unknown[] = [];
  const strokes = gsap.timeline({ paused: true });
  const b: Builder = {
    M,
    add(el, keyframes, at, duration, ease, extra = {}) { seq.push([el, keyframes, { at, duration, ease, ...extra }]); },
    enter(el, at) { b.add(el, { opacity: [0, 1] }, at, M.enter, M.eEnter); },
    exit(el, at, to = 0) { b.add(el, { opacity: [1, to] }, at, M.exit, M.eExit); },
    pop(el, at) { b.add(el, { opacity: [0, 1], scale: [0.6, 1] }, at, M.emphasis, M.eEmphasis); },
    slideIn(el, at) { b.add(el, { opacity: [0, 1], x: [-8, 0] }, at, M.enter, M.eEnter); },
    // Strokes — GSAP DrawSVG only.
    draw(el, at, d = M.draw) {
      strokes.fromTo(el, { drawSVG: '0%' }, { drawSVG: '100%', duration: d, ease: 'illus-draw', immediateRender: false }, at);
    },
    undraw(el, at, d = M.draw * 0.6) {
      strokes.fromTo(el, { drawSVG: '0% 100%' }, { drawSVG: '0% 0%', duration: d, ease: 'illus-exit', immediateRender: false }, at);
    },
  };
  return { b, seq, strokes };
}

/**
 * Start an illustration inside `root` (which holds an svg with a `.art` group). Loops forever, pauses
 * while off-screen. Returns a dispose function.
 */
export function mount(root: HTMLElement, card: Card, { reduced }: { reduced: boolean }) {
  const M = motionTokens();
  const art = root.querySelector('.art') as SVGGElement;
  const q = ((s: string) => root.querySelector(s) as El) as Q;
  q.all = (s) => [...root.querySelectorAll(s)] as El[];

  const resetAll = () => {
    art.style.opacity = '1';
    gsap.set(q.all('[data-stroke]'), { drawSVG: '0%' });
    card.reset(q);
  };

  if (reduced) {
    resetAll();
    card.still(q);
    return () => {};
  }

  let ctrl: ReturnType<typeof animate> | null = null;
  let strokes: gsap.core.Timeline | null = null;
  let clock: ReturnType<typeof motionValue<number>> | null = null;
  let onScreen = false;
  let disposed = false;

  const play = () => {
    if (disposed) return;
    strokes?.kill(); clock?.destroy();
    resetAll();
    const built = builder(M);
    const end = card.script(built.b, q);
    const total = end + M.exit * 2 + 0.4;
    built.b.add(art, { opacity: [1, 0] }, end, M.exit * 2, M.eExit);
    built.b.add(art, { opacity: [0, 0] }, end + M.exit * 2, 0.4, 'linear');
    // Motion is the clock: a value running 0 → total seconds drives the GSAP stroke timeline.
    strokes = built.strokes;
    const c = (clock = motionValue(0));
    const s = strokes;
    c.on('change', (v) => s.time(v));
    built.b.add(c, [0, total] as unknown as Record<string, unknown>, 0, total, 'linear');
    // Motion's sequence typing can't express this mixed list; the shapes match its runtime API.
    ctrl = animate(built.seq as Parameters<typeof animate>[0] as never);
    (root as HTMLElement & { __ctrl?: unknown }).__ctrl = ctrl; // scrub from the console: el.__ctrl.time = 4
    if (!onScreen) ctrl.pause();
    ctrl.finished.then(play);
  };

  resetAll();
  const io = new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    if (!ctrl && onScreen) play();
    else if (ctrl) onScreen ? ctrl.play() : ctrl.pause();
  }, { rootMargin: '200px' });
  io.observe(root);

  return () => {
    disposed = true;
    io.disconnect();
    ctrl?.stop();
    strokes?.kill();
    clock?.destroy();
  };
}
