// Shared runtime for explainer cards.
//
// A card supplies three functions and the runtime does the rest:
//   reset(q)    put every part in its starting state (runs before each loop)
//   script(b)   lay out the scenes on one timeline; return the time the story ends
//   still(q)    the finished picture shown when the viewer prefers reduced motion
//
// The runtime owns what every card needs: reading the illustration.motion.*
// tokens, looping, pausing off-screen and reduced motion. Captions (.cap) and a
// Pause button (.explainer-toggle) are optional: used when the card has them.
//
// Motion (ADR-024) animates every effect and is the one clock, including SVG strokes
// through stroke-dasharray and stroke-dashoffset.
//
// SVG note: Motion writes stroke-dashoffset, fill, width, height, rx and attrX/attrY
// as attributes, and opacity/scale/x/y as inline style — reset them the same way,
// or a leftover inline style overrides every frame Motion writes.
(function () {
  const { animate } = Motion;
  const css = getComputedStyle(document.documentElement);
  const tok = (n) => css.getPropertyValue(`--helix-illustration-motion-${n}`).trim();
  const sec = (n) => parseFloat(tok(n)) / 1000;
  const bez = (n) => tok(n).match(/-?[\d.]+/g).map(Number);

  const M = {
    enter: sec('duration-enter'), exit: sec('duration-exit'), emphasis: sec('duration-emphasis'),
    draw: sec('duration-draw'), recolor: sec('duration-recolor'), stagger: sec('stagger'), hold: sec('hold'),
    eEnter: bez('easing-enter'), eExit: bez('easing-exit'), eEmphasis: bez('easing-emphasis'), eDraw: bez('easing-draw'),
  };

  // Resolve a CSS custom property to a literal color Motion can interpolate.
  const color = (name) => css.getPropertyValue(name).trim();
  const strokeLength = (el) => el.getTotalLength();
  const setStrokeProgress = (el, progress) => {
    const length = strokeLength(el);
    el.style.strokeDasharray = `${length}px ${length}px`;
    el.style.strokeDashoffset = `${length * (1 - progress)}px`;
  };

  function builder(caps) {
    const seq = [];
    const b = {
      M,
      seq,
      add(el, kf, at, duration, ease, extra = {}) { seq.push([el, kf, { at, duration, ease, ...extra }]); },
      enter(el, at, d = M.enter) { b.add(el, { opacity: [0, 1] }, at, d, M.eEnter); },
      exit(el, at, to = 0) { b.add(el, { opacity: [1, to] }, at, M.exit, M.eExit); },
      pop(el, at) { b.add(el, { opacity: [0, 1], scale: [0.6, 1] }, at, M.emphasis, M.eEmphasis); },
      slideIn(el, at) { b.add(el, { opacity: [0, 1], x: [-8, 0] }, at, M.enter, M.eEnter); },
      draw(el, at, d = M.draw) {
        const length = strokeLength(el);
        setStrokeProgress(el, 0);
        b.add(el, { strokeDashoffset: [`${length}px`, '0px'] }, at, d, M.eDraw);
      },
      // Retract a drawn stroke back toward its start.
      undraw(el, at, d = M.draw * 0.6) {
        const length = strokeLength(el);
        setStrokeProgress(el, 1);
        b.add(el, { strokeDashoffset: ['0px', `${length}px`] }, at, d, M.eExit);
      },
      // Cross-fade captions. Returns when the new caption is fully in.
      caption(from, to, at) {
        if (!caps.length) return at;
        if (from != null) b.exit(caps[from], at);
        const start = at + (from != null ? M.exit : 0);
        b.enter(caps[to], start);
        return start;
      },
    };
    return b;
  }

  function mount(root, card) {
    const art = root.querySelector('.art');
    const caps = [...root.querySelectorAll('.cap')];
    const toggle = root.querySelector('.explainer-toggle');
    const q = (s) => root.querySelector(s);
    q.all = (s) => [...root.querySelectorAll(s)];

    const resetAll = () => {
      art.style.opacity = 1;
      caps.forEach((c) => (c.style.opacity = 0));
      card.reset(q);
    };

    // Strokes start undrawn; still() can show one with Explainer.drawn(el).
    const strokesUndrawn = () => q.all('[data-stroke]').forEach((el) => setStrokeProgress(el, 0));

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      resetAll();
      strokesUndrawn();
      card.still(q, caps);
      if (toggle) toggle.hidden = true;
      return;
    }

    let ctrl = null, onScreen = false, userPaused = false;
    const play = () => {
      resetAll();
      strokesUndrawn();
      const b = builder(caps);
      const end = card.script(b, q);
      const total = end + M.exit * 2 + 0.4;
      b.add(art, { opacity: [1, 0] }, end, M.exit * 2, M.eExit);
      b.add(art, { opacity: [0, 0] }, end + M.exit * 2, 0.4, 'linear');
      ctrl = animate(b.seq);
      root.__ctrl = ctrl; // handy for scrubbing from the console: el.__ctrl.time = 4
      if (!onScreen || userPaused) ctrl.pause();
      ctrl.finished.then(play);
    };
    const sync = () => { if (ctrl) (onScreen && !userPaused) ? ctrl.play() : ctrl.pause(); };

    toggle?.addEventListener('click', () => {
      userPaused = !userPaused;
      toggle.textContent = userPaused ? 'Play' : 'Pause';
      toggle.setAttribute('aria-pressed', String(userPaused));
      sync();
    });

    resetAll();
    new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      if (!ctrl && onScreen) play(); else sync();
    }, { rootMargin: '200px' }).observe(root);
  }

  // Show a stroke fully drawn (for still()).
  const drawn = (els) => [].concat(els).forEach((el) => setStrokeProgress(el, 1));

  window.Explainer = { mount, M, color, drawn };
})();
