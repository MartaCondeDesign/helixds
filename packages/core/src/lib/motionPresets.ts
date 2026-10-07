/**
 * Shared Motion (`motion/react`) presets — the JS-only half of Helix's motion vocabulary.
 *
 * Duration/easing that CSS can express live as real tokens (`semantic.duration.*`,
 * `semantic.easing.*`, `semantic.transform.*` in tokens.json) and reach components as
 * `var(--helix-*)`. Motion's spring physics (`stiffness`/`damping`) and cubic-bezier arrays have no
 * `var()` equivalent — a CSS transition can't express a spring, and Motion doesn't accept a CSS
 * custom property for `ease`. Those values live here instead: named, in one place, instead of typed
 * inline per component. This is NOT a tokens.json entry (packages/tokens/CLAUDE.md's "What NOT to
 * do" — "don't add JS-only constants that don't have a CSS counterpart" — is about keeping the token
 * pipeline free of stuff that can't become a CSS var; this module is deliberately the other, JS-only
 * home for exactly that category, not an exception to the rule).
 *
 * Where a value coincides with a real duration token (FAB_COLLAPSE_TRANSITION below), it's derived
 * from `@helixds/tokens` rather than retyped — see packages/tokens/CLAUDE.md's "Motion naming
 * vocabulary" section for the full reasoning, including why the other durations here stay bespoke
 * literals instead of being forced onto the scale.
 *
 * See ADR-007 and .ai/maps/patterns/motion-effects.md.
 */
import type { Transition } from 'motion/react';
import { tokens } from '@helixds/tokens';

function msToSeconds(ms: string): number {
  return Number.parseFloat(ms) / 1000;
}

// ── Springs ──────────────────────────────────────────────────────────────────
// Physically modeled — no CSS equivalent exists. Switch's thumb and NavItem's sliding indicator are
// meant to feel identical (both a small element snapping to a new resting position) but had drifted
// to damping 32 vs 35 with no documented reason for the difference — consolidated to one value here.

export const SPRING_SNAPPY: Transition = { type: 'spring', stiffness: 500, damping: 32 };

// ── Cubic-bezier tweens ──────────────────────────────────────────────────────
// "Back"/overshoot curves — Helix's semantic.easing.{base,in,out} are all no-overshoot, so these have
// no matching token (see motion-effects.md's Input shake row for the same "bespoke, not on the
// scale" call). Named here instead of as inline arrays repeated across FAB's three transitions.

export const EASE_BACK: [number, number, number, number] = [0.34, 1.56, 0.64, 1];
export const EASE_COLLAPSE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** FAB speed-dial expand — overshoots outward; safe, nothing beyond the target to collide with. */
export const FAB_EXPAND_TRANSITION: Transition = { duration: 0.42, ease: EASE_BACK };

/**
 * FAB speed-dial collapse — must never dip past y=0 (the trigger's own position), so this is a
 * no-overshoot ease-out, not EASE_BACK run in reverse. Duration coincides with
 * `semantic.duration.slower` (300ms) — derived from the real token rather than retyped as `0.3`.
 */
export const FAB_COLLAPSE_TRANSITION: Transition = {
  duration: msToSeconds(tokens.semantic.duration.slower),
  ease: EASE_COLLAPSE,
};

/** FAB trigger's squish-and-release bounce, fired once when the actions collect back. */
export const FAB_TRIGGER_BOUNCE_TRANSITION: Transition = { duration: 0.24, ease: EASE_BACK };

// ── Press feedback (`whileTap`) ──────────────────────────────────────────────
// Same category as a CSS `:active` pseudo-class (motion-effects.md's Button/IconButton row) — brief,
// user-driven, not autoplaying, so it's exempt from the "reduced motion is not automatic" checklist
// item. No CSS equivalent either (Motion's `whileTap` target), so named here rather than inline.

export const PRESS_SCALE_DEFAULT = 0.97; // Button
export const PRESS_SCALE_COMPACT = 0.94; // IconButton — smaller hit target reads a firmer press
