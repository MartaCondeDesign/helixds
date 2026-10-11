import { useRef, useState } from 'react';
import type { DragControls } from 'motion/react';
import { IconDots, IconGripVertical } from '@tabler/icons-react';
import { IconButton, Menu } from '@helixds/react';

// Accessible drag-to-reorder for Table rows (pattern, not a Table prop — .ai/maps/patterns/motion-effects.md):
//
//   pointer   drag the grip ⋮⋮ (Motion Reorder + dragControls), as before
//   no drag   the row's ⋯ menu: Move to top / up / down / to bottom (WCAG 2.5.7 Dragging Movements)
//   keyboard  the same menu (↓ opens, ↑/↓ choose, Enter applies, Escape closes), or the grip itself:
//             Space picks the row up, ↑/↓ move it, Space drops, Escape puts it back (WCAG 2.1.1)
//
// After every move focus returns to the same control of the moved row, and a polite live region says where
// it went ("Ana García moved to position 3 of 4"). Chosen 2026-10-11 (option C + A, Proposals were compared).

export const VISUALLY_HIDDEN: React.CSSProperties = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' };

/** Moving a row moves its DOM node, which can drop focus: put it back on the same control once React has rendered. */
const refocus = (key: string) => requestAnimationFrame(() => requestAnimationFrame(() =>
  document.querySelector<HTMLElement>(`[data-reorder-focus="${key}"]`)?.focus()));

/** Polite announcements for the whole table — render `region` once next to it. */
export function useReorderAnnouncer() {
  const [message, setMessage] = useState('');
  return { announce: setMessage, region: <div role="status" aria-live="polite" style={VISUALLY_HIDDEN}>{message}</div> };
}

type RowProps = { id: string; name: string; index: number; total: number; onMove: (to: number) => void; announce: (m: string) => void };

/** The grip: starts a pointer drag, and works with the keyboard (Space / arrows / Escape). */
export function ReorderGrip({ id, name, index, total, onMove, announce, dragControls }: RowProps & { dragControls: DragControls }) {
  const [grabbedFrom, setGrabbedFrom] = useState<number | null>(null);
  const key = `grip-${id}`;
  const go = (to: number) => { onMove(to); refocus(key); };
  return (
    <span onPointerDown={e => { e.preventDefault(); dragControls.start(e); }} style={{ cursor: 'grab', display: 'inline-flex', touchAction: 'none' }}>
      <IconButton
        icon={IconGripVertical} label={`Reorder ${name}`} variant="ghost" size="s"
        aria-pressed={grabbedFrom !== null}
        aria-describedby="row-reorder-instructions"
        data-reorder-focus={key}
        onKeyDown={(e: React.KeyboardEvent) => {
          const grabbed = grabbedFrom !== null;
          if (!grabbed && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault(); setGrabbedFrom(index);
            announce(`${name} picked up. Position ${index + 1} of ${total}. Arrow keys to move, Space to drop, Escape to cancel.`);
          } else if (grabbed && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            e.preventDefault();
            const to = Math.max(0, Math.min(total - 1, index + (e.key === 'ArrowUp' ? -1 : 1)));
            if (to !== index) { go(to); announce(`${name} moved to position ${to + 1} of ${total}.`); }
          } else if (grabbed && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault(); setGrabbedFrom(null); announce(`${name} dropped at position ${index + 1} of ${total}.`);
          } else if (grabbed && e.key === 'Escape') {
            e.preventDefault(); go(grabbedFrom); setGrabbedFrom(null); announce(`Reorder cancelled. ${name} is back at position ${grabbedFrom + 1}.`);
          }
        }}
        // Tabbing away drops the row where it is; a blur caused by the row's own DOM move (no next target) doesn't.
        onBlur={(e: React.FocusEvent) => { if (grabbedFrom !== null && e.relatedTarget) setGrabbedFrom(null); }}
      />
    </span>
  );
}

/** Instructions the grips point to (aria-describedby) — render once next to the table. */
export const ReorderInstructions = () => (
  <span id="row-reorder-instructions" style={VISUALLY_HIDDEN}>Press Space to pick the row up, arrow keys to move it, Space to drop, Escape to cancel. Or use the row's actions menu.</span>
);

/** The row's ⋯ menu with the move actions — the no-drag alternative (WCAG 2.5.7), by click or keyboard. */
export function RowMoveMenu({ id, name, index, total, onMove, announce }: RowProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | undefined>();
  const ref = useRef<HTMLButtonElement>(null);
  const menuId = `row-actions-${id}`;
  const key = `menu-${id}`;
  const options = [
    { value: 'top', label: 'Move to top', disabled: index === 0 },
    { value: 'up', label: 'Move up', disabled: index === 0 },
    { value: 'down', label: 'Move down', disabled: index === total - 1 },
    { value: 'bottom', label: 'Move to bottom', disabled: index === total - 1 },
  ];
  const enabled = options.filter(o => !o.disabled).map(o => o.value);
  const pick = (v: string) => {
    setOpen(false); setActive(undefined);
    const to = v === 'top' ? 0 : v === 'up' ? index - 1 : v === 'down' ? index + 1 : total - 1;
    onMove(to); refocus(key);
    announce(`${name} moved to position ${to + 1} of ${total}.`);
  };
  const step = (d: number) => { const i = active ? enabled.indexOf(active) : -1; setActive(enabled[(i + d + enabled.length) % enabled.length]); };
  return (
    <>
      <IconButton
        ref={ref} icon={IconDots} label={`Actions for ${name}`} variant="ghost" size="s"
        data-reorder-focus={key}
        aria-haspopup="listbox" aria-expanded={open} aria-controls={menuId}
        aria-activedescendant={open && active ? `${menuId}-option-${active}` : undefined}
        onClick={() => { setOpen(o => !o); setActive(enabled[0]); }}
        onBlur={() => setOpen(false)}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); setOpen(true); setActive(enabled[e.key === 'ArrowDown' ? 0 : enabled.length - 1]); }
          else if (open && e.key === 'ArrowDown') { e.preventDefault(); step(1); }
          else if (open && e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
          else if (open && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); if (active) pick(active); }
          else if (open && e.key === 'Escape') { e.preventDefault(); setOpen(false); }
          else if (open && e.key === 'Tab') setOpen(false);
        }}
      />
      <Menu id={menuId} expanded={open} anchorRef={ref} options={options} {...(active ? { activeValue: active } : {})} onSelect={pick} />
    </>
  );
}

/** Move one item inside an array (what onMove does to the list). */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}
