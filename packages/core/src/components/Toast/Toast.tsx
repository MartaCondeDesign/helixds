import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  IconInfoCircleFilled,
  IconCircleCheckFilled,
  IconAlertTriangleFilled,
  IconAlertHexagonFilled,
  IconX,
} from '@tabler/icons-react';
import { cn } from '../../lib/utils';
import { Icon } from '../Icon';
import type { HelixIconComponent } from '../Icon';
import { IconButton } from '../IconButton';
import { resolveTokenPx } from '../../lib/resolveTokenPx';
import { subscribeToasts, removeToast, toast, type ToastRecord, type ToastVariant } from './toastStore';
import type { ToastProps } from './Toast.types';

export { toast } from './toastStore';
export type { ToastVariant, ToastRecord } from './toastStore';

// Real Filled Tabler icons, fixed per variant — not caller-supplied like Badge's own `icon` prop
// (ADR-011). neutral/info share IconInfoCircleFilled; danger uses the hexagon shape explicitly
// asked for over Tabler's more common 8-sided IconAlertOctagonFilled.
const ICON_BY_VARIANT: Record<ToastVariant, HelixIconComponent> = {
  neutral: IconInfoCircleFilled,
  info: IconInfoCircleFilled,
  success: IconCircleCheckFilled,
  warning: IconAlertTriangleFilled,
  danger: IconAlertHexagonFilled,
};

const MAX_VISIBLE = 3;

function ToastItem({
  record,
  depth,
  spreadY,
  peekY,
  itemRef,
}: {
  record: ToastRecord;
  depth: number;
  spreadY: number;
  peekY: number;
  itemRef: (el: HTMLDivElement | null) => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [state, setState] = React.useState<'closed' | 'open' | 'closing'>('closed');

  React.useEffect(() => {
    if (record.leaving) return;
    const raf = requestAnimationFrame(() => setState('open'));
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once, on this toast's own mount
  }, []);

  React.useEffect(() => {
    if (!record.leaving) return;
    setState('closing');
    const el = ref.current;
    const ms = el ? resolveTokenPx('--helix-toast-durationClose', el) : 250;
    const timeout = window.setTimeout(() => removeToast(record.id), ms);
    return () => window.clearTimeout(timeout);
  }, [record.leaving, record.id]);

  // Auto-dismiss, paused (not restarted) while hovered — matches the approved preview.
  React.useEffect(() => {
    if (record.leaving) return;
    const el = ref.current;
    if (!el) return;
    const ms = resolveTokenPx('--helix-toast-autoDismissMs', el);
    const timer = window.setTimeout(() => toast.dismiss(record.id), ms);
    const clear = () => window.clearTimeout(timer);
    el.addEventListener('mouseenter', clear);
    return () => {
      window.clearTimeout(timer);
      el.removeEventListener('mouseenter', clear);
    };
  }, [record.id, record.leaving]);

  return (
    <div
      ref={(el) => {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        itemRef(el);
      }}
      data-helix-part="toast"
      data-variant={record.variant}
      data-depth={depth}
      data-state={state}
      style={{ '--spread-y': `${spreadY}px`, '--peek-y': `${peekY}px` } as React.CSSProperties}
    >
      <span data-helix-part="toast-icon">
        {/* 24, not 22 — IconSize is a fixed enum (12/14/16/18/20/24/32) with no 22 rung; 24 is the
            closest available, one step up from Badge's own 12px, matching the "a bit bigger" ask.
            Own token family (--helix-toast-icon-*), not Badge's — decoupled so Toast's icon can stay
            darker/more saturated in dark mode than Badge ever could (Toast sits on a plain page
            background, not a saturated colored fill like Badge). See ADR-011 amendment. */}
        <Icon icon={ICON_BY_VARIANT[record.variant]} size={24} color={`var(--helix-toast-icon-${record.variant})`} />
      </span>
      <div data-helix-part="toast-content">
        <span data-helix-part="toast-title">{record.label}</span>
        {record.description && <span data-helix-part="toast-description">{record.description}</span>}
      </div>
      {/* Wrapped, not passed data-helix-part directly — IconButton spreads ...props AFTER its own
          hardcoded data-helix-part="icon-button", so a same-named prop would silently detach every
          IconButton CSS rule (same fix as Modal/SidePanel's close button). */}
      <span data-helix-part="toast-close">
        <IconButton icon={IconX} label="Dismiss" size="s" variant="ghost" onPress={() => toast.dismiss(record.id)} />
      </span>
    </div>
  );
}

const Toast = ({ className }: ToastProps) => {
  const [mounted, setMounted] = React.useState(false);
  const [records, setRecords] = React.useState<ToastRecord[]>([]);
  const [spread, setSpread] = React.useState(false);
  const [spreadOffsets, setSpreadOffsets] = React.useState<Record<string, number>>({});
  const [peekOffsets, setPeekOffsets] = React.useState<Record<string, number>>({});
  const itemElsRef = React.useRef(new Map<string, HTMLDivElement>());

  React.useEffect(() => {
    setMounted(true);
    return subscribeToasts(setRecords);
  }, []);

  // Anything past MAX_VISIBLE (excluding ones already leaving) dismisses for real, same as a 4th
  // banner in the reference snippet.
  React.useEffect(() => {
    records.filter(r => !r.leaving).slice(MAX_VISIBLE).forEach(r => toast.dismiss(r.id));
  }, [records]);

  const ordered = records.filter(r => !r.leaving);
  const depthById = new Map(ordered.slice(0, MAX_VISIBLE).map((r, i) => [r.id, i]));

  // Both offsets are measured (offsetHeight), not `peek * depth` / `100% * depth` — fixed multiples
  // broke as soon as two toasts had different heights (a 2-line description vs. a 1-line one), since
  // each only knows its own height, not the one actually sitting above it. See ADR-011 / the approved
  // preview's own bugfix for the spread case; the collapsed "peek" case has the same root cause and
  // needs the same treatment (reported separately, after the spread fix already shipped).
  React.useLayoutEffect(() => {
    const spreadGapPx = resolveTokenPx('--helix-toast-spreadGap');
    const peekPx = resolveTokenPx('--helix-toast-peek');
    const depthScaleStep = resolveTokenPx('--helix-toast-depthScale');
    const visible = ordered.slice(0, MAX_VISIBLE);
    const heights = visible.map(r => itemElsRef.current.get(r.id)?.offsetHeight ?? 0);
    const scaleAt = (i: number) => 1 - depthScaleStep * i;

    let spreadCumulative = 0;
    let peekTop = 0;
    const nextSpread: Record<string, number> = {};
    const nextPeek: Record<string, number> = {};

    visible.forEach((r, i) => {
      if (i === 0) {
        nextSpread[r.id] = 0;
        nextPeek[r.id] = 0;
        return;
      }
      spreadCumulative += heights[i - 1]! + spreadGapPx;
      nextSpread[r.id] = spreadCumulative;

      // Keeps the visible sliver of item i below item (i-1)'s own (scaled) bottom edge exactly
      // `peek`, regardless of how tall each toast actually is — a flat `peek * depth` offset only
      // gives a constant sliver when every toast happens to be the same height.
      peekTop = peekTop + heights[i - 1]! * scaleAt(i - 1) - heights[i]! * scaleAt(i) + peekPx;
      nextPeek[r.id] = peekTop;
    });

    setSpreadOffsets(nextSpread);
    setPeekOffsets(nextPeek);
  }, [records]); // eslint-disable-line react-hooks/exhaustive-deps -- `ordered`/`depthById` are derived from `records` each render

  if (!mounted) return null;

  return createPortal(
    <div
      data-helix-part="toast-viewport"
      data-spread={spread ? 'true' : undefined}
      role="region"
      aria-live="polite"
      className={cn(className)}
      onMouseEnter={() => setSpread(true)}
      onMouseLeave={() => setSpread(false)}
    >
      {records.map((record) => (
        <ToastItem
          key={record.id}
          record={record}
          depth={depthById.get(record.id) ?? MAX_VISIBLE}
          spreadY={spreadOffsets[record.id] ?? 0}
          peekY={peekOffsets[record.id] ?? 0}
          itemRef={(el) => {
            if (el) itemElsRef.current.set(record.id, el);
            else itemElsRef.current.delete(record.id);
          }}
        />
      ))}
    </div>,
    document.body,
  );
};

Toast.displayName = 'Toast';

export { Toast };
