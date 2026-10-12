# ADR-024 — Illustration motion: own tokens, Motion for everything

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
2. Drawing SVG strokes needed care: Motion writes some properties as SVG attributes and others as inline
   style, and the first prototype's connector lines never drew because a reset had used the other channel.
   GSAP's DrawSVG was tried for strokes and then dropped: one engine is simpler, and GSAP's license isn't
   OSI open source. The runtime now draws strokes with Motion itself, through an explicit
   `stroke-dasharray` / `stroke-dashoffset` in px measured from the path's own length.

## Decision

1. **Separate token family: `illustration.motion.*`** — `duration.{enter, exit, emphasis, draw, recolor}`,
   `stagger`, `hold`, `easing.{enter, exit, emphasis, draw}`
   (`prototypes/explainers/illustration-motion.tokens.json`, CSS vars `--helix-illustration-motion-*`).
   Illustrations read only these; components never read them, and illustrations never read
   `semantic.duration.*` / `semantic.easing.*`.
   **Amended 2026-10-12 — one motion family, not two.** The family now lives in `tokens.json` as
   `component.illustration.motion.*` (same CSS var names, `--helix-illustration-motion-*`). Where a value is
   shared with components it aliases the semantic token instead of keeping its own copy: `duration-exit` →
   `semantic.duration.slower`, `duration-draw` → `semantic.duration.draw`, `stagger` → `semantic.duration.stagger`
   (both new, also used by Chart's draw-in), `easing-enter` → `semantic.easing.gentle` (was 0.23,1,0.32,1 — the
   same curve to the eye). The values only illustrations use stay literals in that group. Components still never
   read `component.illustration.*`.
2. **One engine: Motion** — every effect in an illustration (opacity, scale, move, recolor, shape morph via
   `attrX`/`attrY`/`width`/`height`/`rx`) **and SVG strokes**, on a single timeline that is also the clock
   for looping, seeking and off-screen pausing.
   - Strokes go through the runtime's `b.draw()` / `b.undraw()` (and `drawn()` for the still picture),
     which set `stroke-dasharray` to the path's `getTotalLength()` and animate `stroke-dashoffset` in px.
     Never animate a stroke by hand with `pathLength` or a unitless dashoffset.
   - Same engine as components (ADR-007), so Helix has a single animation dependency, MIT-licensed.
3. An illustration is **only the animation**: no title, caption or Pause button inside the box, on a
   plain `fill.page` background. The runtime still honors `prefers-reduced-motion` (shows the finished
   picture, no animation) and pauses when the illustration is off-screen. Captions and a Pause button
   remain optional hooks in the prototype runtime (`.cap`, `.explainer-toggle`), off by default.
   **Accessibility trade-off:** a loop longer than 5s that plays next to other content needs a way to
   pause it (WCAG 2.2.2). Without a button in the box, the page or medium that hosts the illustration
   owns that — e.g. a video/GIF player's own controls, or turning the optional toggle back on when it's
   embedded in a docs page.

## Consequences

- No extra dependency: illustrations use the `motion` package Storybook and core already have.
- A stroke animated outside `b.draw()` / `b.undraw()` in an illustration is a violation of this rule.
- Illustrations live in Storybook's **Assets → Illustrations** section (next to Assets → Icons)
  (`apps/storybook/stories/Illustrations/`, shared runtime `runtime.ts`). `illustration.motion.*`
  is defined there as CSS custom properties (`illustrations.css`) for now; when the family settles it moves
  into `tokens.json` as its own top-level family (not under `semantic`), and `pnpm docs:token-exceptions`
  applies to it like any other. `prototypes/explainers/` holds the first standalone experiments.
