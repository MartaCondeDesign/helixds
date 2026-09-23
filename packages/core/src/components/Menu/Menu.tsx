import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';
import type { MenuOption, MenuOptionGroup, MenuProps } from './Menu.types';

function isGroup(opt: MenuOption | MenuOptionGroup): opt is MenuOptionGroup {
  return 'options' in opt;
}

export function optionId(menuId: string, value: string): string {
  return `${menuId}-option-${value}`;
}

// Keeps the menu this many px clear of the viewport edge — same principle as Tooltip's own
// EDGE_GUTTER (ADR-009), narrowed to Menu's single-axis (vertical) flip: opens below the anchor by
// default, flips above when there isn't room below, with a horizontal clamp so it never overflows
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
    const vh = window.innerHeight;

    const fitsBelow = anchorRect.bottom + menuRect.height + EDGE_GUTTER <= vh;
    const top = fitsBelow ? anchorRect.bottom + 4 : anchorRect.top - menuRect.height - 4;

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
    // which can wrap option labels differently and misreport height, occasionally flipping the
    // open-above/open-below decision incorrectly on first open.
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

export function Menu({ id, expanded, anchorRef, options, value, activeValue, onSelect, className }: MenuProps) {
  const menuRef = React.useRef<HTMLDivElement>(null);
  const style = usePosition(expanded, anchorRef, menuRef);

  if (!expanded) return null;

  const renderOption = (opt: MenuOption) => (
    <button
      key={opt.value}
      type="button"
      id={optionId(id, opt.value)}
      data-helix-part="menu-item"
      role="option"
      aria-selected={opt.value === value}
      data-active={opt.value === activeValue ? '' : undefined}
      disabled={opt.disabled}
      onClick={() => !opt.disabled && onSelect(opt.value)}
      // Keeps focus on the trigger — Menu is deliberately non-focusable (see ADR-013: the consumer's
      // trigger button owns real keyboard focus and drives aria-activedescendant; mousedown here would
      // otherwise steal it).
      onMouseDown={e => e.preventDefault()}
    >
      {opt.label}
    </button>
  );

  return createPortal(
    <div
      ref={menuRef}
      id={id}
      data-helix-part="menu"
      role="listbox"
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
