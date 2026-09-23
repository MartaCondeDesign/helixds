/**
 * Resolves a `--helix-*` CSS custom property to a plain number, for the handful of places a Helix
 * token has to cross into a JS-driven API that only accepts numbers — never a `var(...)` reference.
 * Two call sites today: FAB's speed-dial offsets (Motion's `animate.y` is a numeric px) and Switch's
 * thumb position (same reason). See ADR-007 and `.ai/maps/patterns/motion-effects.md`.
 *
 * Reads from `el` (defaults to the document root) so a component-scoped override (e.g. a themed subtree)
 * resolves correctly, not just the global `:root` value.
 */
export function resolveTokenPx(token: string, el: HTMLElement | null = document.documentElement): number {
  if (!el) return 0;
  const raw = getComputedStyle(el).getPropertyValue(token).trim();
  const value = Number.parseFloat(raw);
  return Number.isNaN(value) ? 0 : value;
}
