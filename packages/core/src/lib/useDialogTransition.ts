import * as React from 'react';
import { resolveTokenPx } from './resolveTokenPx';

export type DialogTransitionState = 'closed' | 'open' | 'closing';

/**
 * Shared open/close choreography for Modal and SidePanel — see ADR-010. Native `<dialog>` has no
 * built-in "animate out, then actually close" behavior, so this orchestrates it in JS: `showModal()`
 * immediately, then a `data-state="open"` flip one animation frame later (so the transition actually
 * plays); on close, `data-state="closing"` first, then the real `.close()` after the component's own
 * close-duration token has elapsed. Escape (native `cancel`) is redirected into the same path via
 * `onDismiss`, so every dismissal — programmatic or native — animates identically.
 *
 * Backdrop-click dismissal: native `<dialog>` has no `::backdrop` click event to listen for — a click
 * on the backdrop is dispatched as a click on the `<dialog>` element itself (it's the top-layer element
 * covering the viewport while modal). The standard technique (used here) is geometric: on a click
 * directly on the dialog element, check whether the pointer landed inside the dialog's own rendered
 * box; if not, treat it as a backdrop click. `closeOnBackdropClick` (default true) gates this.
 */
export function useDialogTransition(
  expanded: boolean,
  closeDurationToken: string,
  onDismiss?: () => void,
  closeOnBackdropClick = true,
) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const [state, setState] = React.useState<DialogTransitionState>(expanded ? 'open' : 'closed');

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (expanded) {
      if (!el.open) el.showModal();
      const raf = requestAnimationFrame(() => setState('open'));
      return () => cancelAnimationFrame(raf);
    }

    if (!el.open) {
      setState('closed');
      return;
    }
    setState('closing');
    // resolveTokenPx is unit-agnostic (Number.parseFloat strips the trailing unit) — reused here for a
    // duration in ms, not the px offset it was originally written for (FAB/Switch).
    const closeMs = resolveTokenPx(closeDurationToken, el);
    const timeout = window.setTimeout(() => {
      el.close();
      setState('closed');
    }, closeMs);
    return () => window.clearTimeout(timeout);
  }, [expanded, closeDurationToken]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleCancel = (event: Event) => {
      // We own the close choreography above — don't let the browser remove the dialog instantly out
      // from under it. `onDismiss` (not a direct state write) lets the consumer control `expanded`.
      event.preventDefault();
      onDismiss?.();
    };
    // Escape handled on keydown too, not only via the native `cancel` it would trigger:
    // preventDefault here stops that close request, so a press dismisses exactly once — and Escape
    // works the same for synthetic key events (tests), which never fire `cancel`.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onDismiss?.();
    };
    el.addEventListener('cancel', handleCancel);
    el.addEventListener('keydown', handleKeyDown);
    return () => {
      el.removeEventListener('cancel', handleCancel);
      el.removeEventListener('keydown', handleKeyDown);
    };
  }, [onDismiss]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || !closeOnBackdropClick) return;
    const handleClick = (event: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const insideDialog =
        event.clientX >= rect.left && event.clientX <= rect.right &&
        event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (!insideDialog) onDismiss?.();
    };
    el.addEventListener('click', handleClick);
    return () => el.removeEventListener('click', handleClick);
  }, [onDismiss, closeOnBackdropClick]);

  return { ref, state };
}
