# ADR-024 — Illustration motion: own tokens, Motion for effects, GSAP for strokes

**Date:** 2026-10-07
**Status:** Accepted — extends [ADR-007](ADR-007-motion-engine.md) (does not change it for components)
**Deciders:** Helix DS team

## Context

Helix is starting a set of animated explainer illustrations (concepts like tokens, evals, AGENTS.md,
contracts), inspired by Lauren Basser's Code Snacks. Those are a different kind of motion from component
motion:

| | Component motion | Illustration motion |
|---|---|---|
| Purpose | Feedback on an interaction | Telling a story in scenes |
| Length | 80–300ms | 15–20s loops, scenes held ~2s |
| Trigger | User action | Plays on its own, loops |
| Engine need | Springs, presence, reorder | A timeline, and drawing SVG strokes |

Two problems surfaced building the first prototypes (`prototypes/explainers/`):

1. Reusing `semantic.duration.*` / `semantic.easing.*` would blur both scales — a 2.2s "hold" has no place
   next to a 120ms hover, and tuning one would silently change the other.
2. Motion animates SVG strokes only through raw `stroke-dashoffset`, and writes it as an attribute while
   transforms go to inline style — the first prototype's connector lines never drew because a reset had
   used the other channel. GSAP's DrawSVG plugin is built for exactly this (`drawSVG: '0%' → '100%'`,
   partial segments, retracting toward either end) and handles it in one line.

## Decision

1. **Separate token family: `illustration.motion.*`** — `duration.{enter, exit, emphasis, draw, recolor}`,
   `stagger`, `hold`, `easing.{enter, exit, emphasis, draw}`
   (`prototypes/explainers/illustration-motion.tokens.json`, CSS vars `--helix-illustration-motion-*`).
   Illustrations read only these; components never read them, and illustrations never read
   `semantic.duration.*` / `semantic.easing.*`.
2. **Engines, by job:**
   - **Motion** — every effect in an illustration (opacity, scale, move, recolor, shape morph via
     `attrX`/`attrY`/`width`/`height`/`rx`) and the **single clock** of the timeline.
   - **GSAP + DrawSVG** — **only** for drawing / undrawing SVG strokes in illustrations.
   - The two are combined, not run side by side: GSAP's timeline stays paused and Motion drives it
     (`motionValue` → `gsapTimeline.time(v)`), so pause, seek, loop and off-screen pausing stay one control.
     Implemented once in `prototypes/explainers/explainer.js` (`b.draw()` / `b.undraw()`).
3. **Boundary: GSAP never enters `packages/core`.** GSAP is free but ships under Webflow's own license,
   not an OSI open-source license (GitHub reports no SPDX license for `greensock/GSAP`); Motion is MIT.
   Keeping GSAP to illustrations means the component library stays 100% MIT for anyone adopting Helix.
   Components keep using Motion only, as ADR-007 says.
4. An illustration is **only the animation**: no title, caption or Pause button inside the box, on a
   plain `fill.page` background. The runtime still honors `prefers-reduced-motion` (shows the finished
   picture, no animation) and pauses when the illustration is off-screen. Captions and a Pause button
   remain optional hooks in the runtime (`.cap`, `.explainer-toggle`), off by default.
   **Accessibility trade-off:** a loop longer than 5s that plays next to other content needs a way to
   pause it (WCAG 2.2.2). Without a button in the box, the page or medium that hosts the illustration
   owns that — e.g. a video/GIF player's own controls, or turning the optional toggle back on when it's
   embedded in a docs page.

## Consequences

- One more dependency for illustrations (GSAP core + DrawSVG + CustomEase, loaded only on pages that draw
  strokes). CustomEase lets GSAP use the same cubic-bezier token values as Motion.
- A stroke animation written with Motion (`strokeDashoffset`/`pathLength`) in an illustration is a
  violation of this rule; so is any `gsap` import under `packages/`.
- Illustrations live in Storybook's **Assets → Illustrations** section (next to Assets → Icons) (`apps/storybook/stories/Illustrations/`,
  shared runtime `runtime.ts`); GSAP is a dependency of `apps/storybook` only. `illustration.motion.*`
  is defined there as CSS custom properties (`illustrations.css`) for now; when the family settles it moves
  into `tokens.json` as its own top-level family (not under `semantic`), and `pnpm docs:token-exceptions`
  applies to it like any other. `prototypes/explainers/` holds the first standalone experiments.
