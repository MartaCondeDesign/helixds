import * as React from 'react';
import { resolveTokenPx } from './resolveTokenPx';

export type DisclosureTransitionState = 'closed' | 'open' | 'closing';

/**
 * Open/close choreography for Accordion's native <details> — sibling to useDialogTransition.ts
 * (same shape, different element API: `el.open = true/false` here instead of `showModal()`/`close()`).
 *
 * Why this exists: naively binding `<details open={isExpanded}>` and letting the browser's own click
 * toggle drive it looks fine expanding, but collapsing never animates — the browser removes the `open`
 * attribute synchronously the instant a click fires, which hides the panel's content before any CSS
 * transition on grid-template-rows/opacity/filter gets a chance to run (same root cause ADR-010 already
 * solved for Modal/SidePanel's native <dialog>). The fix is the same shape: intercept the toggle, keep
 * `open` true and drive a `data-state="closing"` attribute through the real collapse transition, and only
 * flip `open` to false for real once the collapse duration token has elapsed.
 */
export function useDisclosureTransition(expanded: boolean, closeDurationToken: string) {
  const ref = React.useRef<HTMLDetailsElement>(null);
  const [state, setState] = React.useState<DisclosureTransitionState>(expanded ? 'open' : 'closed');

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (expanded) {
      el.open = true;
      const raf = requestAnimationFrame(() => setState('open'));
      return () => cancelAnimationFrame(raf);
    }

    if (!el.open) {
      setState('closed');
      return;
    }
    setState('closing');
    const closeMs = resolveTokenPx(closeDurationToken, el);
    const timeout = window.setTimeout(() => {
      el.open = false;
      setState('closed');
    }, closeMs);
    return () => window.clearTimeout(timeout);
  }, [expanded, closeDurationToken]);

  return { ref, state };
}
