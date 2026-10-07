import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { mount, type Card } from './runtime';
import './illustrations.css';

// Reduced motion = the OS setting OR Storybook's own "Motion: reduced" toolbar toggle (a class on <html>,
// see .storybook/preview.tsx). Either one shows the finished picture instead of the animation.
function subscribe(onChange: () => void) {
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', onChange);
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => { media.removeEventListener('change', onChange); observer.disconnect(); };
}
const isReduced = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches ||
  document.documentElement.classList.contains('sb-reduced-motion');

/** One explainer illustration: just the animation, in a plain box. */
export function Illustration({ card, label, viewBox, bare = false, children }: {
  card: Card;
  /** What the whole animation shows, for screen readers. */
  label: string;
  viewBox: string;
  /** No box of its own — for illustrations placed inside another frame (e.g. a concept tile). */
  bare?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useSyncExternalStore(subscribe, isReduced);

  useEffect(() => {
    if (!ref.current) return;
    return mount(ref.current, card, { reduced });
  }, [card, reduced]);

  return (
    <div ref={ref} className={bare ? 'illustration illustration--bare' : 'illustration'}>
      <svg viewBox={viewBox} role="img" aria-label={label}>
        <g className="art">{children}</g>
      </svg>
    </div>
  );
}
