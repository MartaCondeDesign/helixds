import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';
import { resolveTokenPx } from '../../lib/resolveTokenPx';
import type { MenuOption, MenuOptionGroup, MenuProps } from './Menu.types';

function isGroup(opt: MenuOption | MenuOptionGroup): opt is MenuOptionGroup {
  return 'options' in opt;
}

export function optionId(menuId: string, value: string): string {
  return `${menuId}-option-${value}`;
}

// Keeps the menu this many px clear of the viewport edge — same principle as Tooltip's own
// EDGE_GUTTER (ADR-009), horizontal clamp only: always opens below the anchor — never flips above,
// even when there isn't room below (the page scrolls instead) — and is clamped so it never overflows
// the left/right edge for an anchor sitting near either side of the viewport. See ADR-013.
const EDGE_GUTTER = 8;

function usePosition(expanded: boolean, anchorRef: React.RefObject<HTMLElement | null>, menuRef: React.RefObject<HTMLDivElement | null>) {
  const [style, setStyle] = React.useState<React.CSSProperties>({ visibility: 'hidden' });

  const recalculate = React.useCallback(() => {
    const anchor = anchorRef.current;
    const menu = menuRef.current;
    if (!anchor || !menu) return;

    const anchorRect = anchor.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const vw = window.innerWidth;
    const top = anchorRect.bottom + 4;

    const maxLeft = vw - menuRect.width - EDGE_GUTTER;
    const left = Math.min(Math.max(anchorRect.left, EDGE_GUTTER), Math.max(maxLeft, EDGE_GUTTER));

    setStyle({ position: 'fixed', top, left, width: anchorRect.width, visibility: 'visible' });
  }, [anchorRef, menuRef]);

  React.useLayoutEffect(() => {
    if (!expanded) return;
    const anchor = anchorRef.current;
    const menu = menuRef.current;
    // Set the real width directly on the DOM node, synchronously, before the first height
    // measurement — width otherwise only lands a render cycle later (via the setStyle below), so
    // the very first recalculate() would measure the menu at its unconstrained natural width,
    // which can wrap option labels differently and misplace it horizontally on first open.
    if (anchor && menu) {
      menu.style.width = `${anchor.getBoundingClientRect().width}px`;
    }
    recalculate();
    window.addEventListener('resize', recalculate);
    window.addEventListener('scroll', recalculate, true);
    return () => {
      window.removeEventListener('resize', recalculate);
      window.removeEventListener('scroll', recalculate, true);
    };
  }, [expanded, recalculate, anchorRef, menuRef]);

  return style;
}

// Keeps the menu on screen for its close transition after `expanded` turns false (transitions.dev
// "menu dropdown": grows in from its trigger, settles out to a near-resting scale). Under reduced
// motion there is no transition to wait for, so it goes at once.
function usePresence(expanded: boolean, menuRef: React.RefObject<HTMLDivElement | null>) {
  const [closing, setClosing] = React.useState(false);
  // Decided during render, not in an effect — an effect would commit one frame with the menu already
  // gone before bringing it back to animate out.
  const [wasExpanded, setWasExpanded] = React.useState(expanded);
  if (expanded !== wasExpanded) {
    setWasExpanded(expanded);
    setClosing(!expanded && !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  React.useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(() => setClosing(false), resolveTokenPx('--helix-menu-duration-close', menuRef.current));
    return () => window.clearTimeout(timer);
  }, [closing, menuRef]);
  return closing;
}

export function Menu({ id, expanded, anchorRef, options, value, multiple = false, values, activeValue, onSelect, className }: MenuProps) {
  const menuRef = React.useRef<HTMLDivElement>(null);
  const style = usePosition(expanded, anchorRef, menuRef);
  const closing = usePresence(expanded, menuRef);

  // A listbox needs an accessible name (WCAG 4.1.2), taken from the control that opens it: its <label>
  // (Select/MultiSelect: "Role", not the trigger's current value), else its aria-label, else its text.
  const [name, setName] = React.useState<string | undefined>();
  React.useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!expanded || !anchor) return;
    // The anchor may be a whole field (an input's wrapper, so the list spans it edge to edge): then the
    // label is the one of the control inside it.
    const control = (anchor as HTMLButtonElement).labels ? anchor : anchor.querySelector('input, select, textarea, button');
    const label = (control as HTMLButtonElement | null)?.labels?.[0];
    setName((label?.textContent ?? anchor.getAttribute('aria-label') ?? anchor.textContent ?? '').trim() || undefined);
  }, [expanded, anchorRef]);

  if (!expanded && !closing) return null;

  // Width rule (contract sizing.width): 150px minimum for word options, none when every option is a
  // number (1, 2, 1000…).
  const flat = options.flatMap(o => ('options' in o ? o.options : [o]));
  const numericOnly = flat.length > 0 && flat.every(o => /^[\d\s.,%+-]+$/.test(o.label.trim()));

  const renderOption = (opt: MenuOption) => (
    <button
      key={opt.value}
      type="button"
      id={optionId(id, opt.value)}
      data-helix-part="menu-item"
      role="option"
      aria-selected={multiple ? (values ?? []).includes(opt.value) : opt.value === value}
      data-active={opt.value === activeValue ? '' : undefined}
      disabled={opt.disabled}
      onClick={() => !opt.disabled && onSelect(opt.value)}
      // Keeps focus on the trigger — Menu is deliberately non-focusable (see ADR-013: the consumer's
      // trigger button owns real keyboard focus and drives aria-activedescendant; mousedown here would
      // otherwise steal it).
      onMouseDown={e => e.preventDefault()}
    >
      {opt.labelEnd === undefined ? opt.label : (
        <>
          <span data-helix-part="menu-item-label">{opt.label}</span>
          <span data-helix-part="menu-item-label-end">{opt.labelEnd}</span>
        </>
      )}
    </button>
  );

  return createPortal(
    <div
      ref={menuRef}
      id={id}
      data-helix-part="menu"
      {...(numericOnly ? { 'data-numeric': '' } : {})}
      data-state={expanded ? undefined : 'closing'}
      // While it plays out its close transition the list is already gone for everyone: no pointer
      // (CSS), no assistive tech, no focus.
      {...(expanded ? {} : { 'aria-hidden': true, inert: true })}
      role="listbox"
      aria-multiselectable={multiple || undefined}
      aria-label={name}
      style={style}
      className={cn(className)}
    >
      {options.map((opt, i) =>
        isGroup(opt) ? (
          <React.Fragment key={opt.label}>
            {/* No divider before the very first entry — nothing above it to separate from. */}
            {i > 0 && <div data-helix-part="menu-group-divider" role="separator" aria-hidden="true" />}
            <div data-helix-part="menu-group-label">{opt.label}</div>
            {opt.options.map(renderOption)}
          </React.Fragment>
        ) : (
          renderOption(opt)
        ),
      )}
    </div>,
    document.body,
  );
}

Menu.displayName = 'Menu';
