import * as React from 'react';
import { cn } from '../../lib/utils';
import type { TooltipPlacement, TooltipProps } from './Tooltip.types';

let idCounter = 0;

// Keeps the tooltip content this many px clear of the viewport edge — "would clip" means "would land
// inside this gutter", not just literal negative coordinates. See ADR-009.
const EDGE_GUTTER = 8;

/**
 * Flip + clamp collision detection — see ADR-009. Runs regardless of hover/focus state: the content is
 * always laid out (`visibility: hidden`, never `display: none`), so it's measurable before it's ever
 * shown. Recomputed on mount, on resize, and on any ancestor scroll (capture phase).
 */
function useAutoPlacement(
  rootRef: React.RefObject<HTMLSpanElement | null>,
  contentRef: React.RefObject<HTMLSpanElement | null>,
  requestedPlacement: TooltipPlacement,
) {
  const [placement, setPlacement] = React.useState<TooltipPlacement>(requestedPlacement);
  const [shift, setShift] = React.useState(0);

  const recalculate = React.useCallback(() => {
    const root = rootRef.current;
    const content = contentRef.current;
    if (!root || !content) return;

    const rootRect = root.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let next: TooltipPlacement = requestedPlacement;

    if (requestedPlacement === 'top' || requestedPlacement === 'bottom') {
      const fitsTop = rootRect.top - contentRect.height - EDGE_GUTTER >= 0;
      const fitsBottom = rootRect.bottom + contentRect.height + EDGE_GUTTER <= vh;
      if (requestedPlacement === 'top' && !fitsTop && fitsBottom) next = 'bottom';
      if (requestedPlacement === 'bottom' && !fitsBottom && fitsTop) next = 'top';
    } else {
      const fitsLeft = rootRect.left - contentRect.width - EDGE_GUTTER >= 0;
      const fitsRight = rootRect.right + contentRect.width + EDGE_GUTTER <= vw;
      if (requestedPlacement === 'left' && !fitsLeft && fitsRight) next = 'right';
      if (requestedPlacement === 'right' && !fitsRight && fitsLeft) next = 'left';
    }

    // Cross-axis clamp — independent of the flip above. Keeps a top/bottom-placed tooltip from
    // overflowing the left/right edge (and a left/right-placed one from overflowing top/bottom),
    // e.g. an avatar sitting right against the page's left edge.
    let nextShift = 0;
    if (next === 'top' || next === 'bottom') {
      const center = rootRect.left + rootRect.width / 2;
      const half = contentRect.width / 2;
      const clamped = Math.min(Math.max(center, half + EDGE_GUTTER), vw - half - EDGE_GUTTER);
      nextShift = clamped - center;
    } else {
      const center = rootRect.top + rootRect.height / 2;
      const half = contentRect.height / 2;
      const clamped = Math.min(Math.max(center, half + EDGE_GUTTER), vh - half - EDGE_GUTTER);
      nextShift = clamped - center;
    }

    setPlacement(next);
    setShift(nextShift);
  }, [requestedPlacement, rootRef, contentRef]);

  React.useLayoutEffect(() => {
    recalculate();
    window.addEventListener('resize', recalculate);
    window.addEventListener('scroll', recalculate, true);
    return () => {
      window.removeEventListener('resize', recalculate);
      window.removeEventListener('scroll', recalculate, true);
    };
  }, [recalculate]);

  return { placement, shift };
}

const Tooltip = ({ label, children, placement = 'top', expanded, className }: TooltipProps) => {
  const uid = `helix-tooltip-${++idCounter}`;
  const rootRef = React.useRef<HTMLSpanElement>(null);
  const contentRef = React.useRef<HTMLSpanElement>(null);
  const { placement: resolvedPlacement, shift } = useAutoPlacement(rootRef, contentRef, placement);

  // `expanded` is undefined by default (normal :hover/:focus-within driven show/hide, no attribute
  // set at all); true/false force it on/off regardless of interaction — see ADR-008.
  // Escape dismisses the tooltip but leaves focus on the trigger (WCAG 1.4.13 dismissible, 2.4.3 focus
  // order): blurring it instead would drop a keyboard user back to the top of the page. The dismissal
  // lasts until focus or the pointer leaves, so the next hover/focus shows it again.
  const [dismissed, setDismissed] = React.useState(false);
  const forcedState = expanded !== undefined ? (expanded ? 'true' : 'false') : dismissed ? 'false' : undefined;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    // The one piece of JS this component needs for show/hide (ADR-008) — CSS :hover/:focus-within
    // can't hear a keypress. Visibility otherwise stays in CSS. (Auto-placement above is separate —
    // see ADR-009 — and runs independently of show/hide.)
    if (event.key === 'Escape') setDismissed(true);
  };
  const reset = (event: React.FocusEvent<HTMLSpanElement> | React.MouseEvent<HTMLSpanElement>) => {
    if ('relatedTarget' in event && event.type === 'blur' && rootRef.current?.contains(event.relatedTarget as Node)) return;
    setDismissed(false);
  };

  return (
    <span
      ref={rootRef}
      data-helix-part="tooltip-root"
      data-placement={resolvedPlacement}
      data-expanded={forcedState}
      onKeyDown={handleKeyDown}
      onBlur={reset}
      onMouseLeave={reset}
      className={cn(className)}
    >
      {React.cloneElement(children, { 'aria-describedby': uid } as React.HTMLAttributes<HTMLElement>)}
      <span
        ref={contentRef}
        id={uid}
        data-helix-part="tooltip-content"
        role="tooltip"
        // Only the cross-axis clamp shift is set from JS, as a custom property — `transform` itself
        // stays authored in CSS (centering + enter/leave scale), so :hover/:focus-within/[data-expanded]
        // can still animate it. Setting `transform` directly here would silently win over any CSS rule
        // trying to change it, since inline style always beats a stylesheet selector.
        style={{ '--tooltip-shift': `${shift}px` } as React.CSSProperties}
      >
        {label}
      </span>
    </span>
  );
};

Tooltip.displayName = 'Tooltip';

export { Tooltip };
