// Shared runtime for explainer illustrations (ADR-024).
//
// An illustration supplies a Card — three functions — and the runtime does the rest:
//   reset(q)    put every part in its starting state (runs before each loop)
//   script(b)   lay out the scenes on one timeline; return the time the story ends
//   still(q)    the finished picture shown when the viewer prefers reduced motion
//
// Motion animates every effect, including SVG strokes, and is the single clock for an illustration.
//
// SVG note: Motion writes fill, width, height, rx and attrX/attrY as attributes, and opacity/scale/x/y
// as inline style — reset them through the same channel, or a leftover inline style overrides every
// frame Motion writes.
import { animate } from 'motion';

export type El = HTMLElement | SVGElement;
export type Q = ((selector: string) => El) & { all: (selector: string) => El[] };
type Bezier = [number, number, number, number];

export type Motion = {
  enter: number; exit: number; emphasis: number; draw: number; recolor: number; stagger: number; hold: number;
  eEnter: Bezier; eExit: Bezier; eEmphasis: Bezier; eDraw: Bezier;
};

export type Builder = {
  M: Motion;
  add: (el: El, keyframes: Record<string, unknown>, at: number, duration: number, ease: unknown, extra?: Record<string, unknown>) => void;
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

function strokeLength(el: El) {
  return (el as SVGGeometryElement).getTotalLength();
}

// Motion writes stroke-dashoffset on SVG as an attribute, so the starting value must be an attribute too:
// an inline style would override every frame Motion writes and the stroke would never draw.
function setStrokeProgress(el: El, progress: number) {
  const length = strokeLength(el);
  el.style.strokeDasharray = `${length}px ${length}px`;
  el.style.removeProperty('stroke-dashoffset');
  el.setAttribute('stroke-dashoffset', `${length * (1 - progress)}px`);
}

export const drawn = (els: El | El[]) => [els].flat().forEach((el) => setStrokeProgress(el, 1));

function builder(M: Motion) {
  const seq: unknown[] = [];
  const b: Builder = {
    M,
    add(el, keyframes, at, duration, ease, extra = {}) { seq.push([el, keyframes, { at, duration, ease, ...extra }]); },
    enter(el, at) { b.add(el, { opacity: [0, 1] }, at, M.enter, M.eEnter); },
    exit(el, at, to = 0) { b.add(el, { opacity: [1, to] }, at, M.exit, M.eExit); },
    pop(el, at) { b.add(el, { opacity: [0, 1], scale: [0.6, 1] }, at, M.emphasis, M.eEmphasis); },
    slideIn(el, at) { b.add(el, { opacity: [0, 1], x: [-8, 0] }, at, M.enter, M.eEnter); },
    draw(el, at, d = M.draw) {
      const length = strokeLength(el);
      setStrokeProgress(el, 0);
      b.add(el, { strokeDashoffset: [`${length}px`, '0px'] }, at, d, M.eDraw);
    },
    undraw(el, at, d = M.draw * 0.6) {
      const length = strokeLength(el);
      setStrokeProgress(el, 1);
      b.add(el, { strokeDashoffset: ['0px', `${length}px`] }, at, d, M.eExit);
    },
  };
  return { b, seq };
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
    q.all('[data-stroke]').forEach((el) => setStrokeProgress(el, 0));
    card.reset(q);
  };

  if (reduced) {
    resetAll();
    card.still(q);
    return () => {};
  }

  let ctrl: ReturnType<typeof animate> | null = null;
  let onScreen = false;
  let disposed = false;

  const play = () => {
    if (disposed) return;
    resetAll();
    const built = builder(M);
    const end = card.script(built.b, q);
    const total = end + M.exit * 2 + 0.4;
    built.b.add(art, { opacity: [1, 0] }, end, M.exit * 2, M.eExit);
    built.b.add(art, { opacity: [0, 0] }, end + M.exit * 2, 0.4, 'linear');
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
  };
}
