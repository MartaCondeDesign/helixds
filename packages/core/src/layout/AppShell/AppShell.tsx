import * as React from 'react';
import { cn } from '../../lib/utils';
import { AppShellNavContext, type AppShellNavContextValue } from './AppShellContext';
import type { AppShellProps } from './AppShell.types';

/** primitive.breakpoint.tablet — below it the SideNav collapses. CSS reads the same value in its
 *  @container query (container queries can't read a var() either). */
const COLLAPSE_BELOW_PX = 768;

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const AppShell = ({
  sidenav,
  topbar,
  children,
  sidenavExpanded,
  defaultSidenavExpanded = false,
  onSidenavExpandedChange,
  className,
}: AppShellProps) => {
  const [uncontrolledExpanded, setUncontrolledExpanded] = React.useState(defaultSidenavExpanded);
  const isControlled = sidenavExpanded !== undefined;
  const expanded = isControlled ? sidenavExpanded : uncontrolledExpanded;

  // The collapse needs the TopBar's menu button to open the nav again — with no topbar the shell
  // keeps the old narrow-screen layout (nav stacked on top) instead.
  const collapsible = Boolean(sidenav && topbar);

  const rootRef = React.useRef<HTMLDivElement>(null);
  const navRef = React.useRef<HTMLDivElement>(null);
  const toggleRef = React.useRef<HTMLButtonElement>(null);
  const togglePressed = React.useRef(false);
  const focusOnOpen = React.useRef(false);
  const navId = React.useId();

  // Whether the shell is narrow enough for the nav to be collapsed — the CSS decides what shows,
  // this only gates the keyboard/focus behavior that belongs to the collapsed nav.
  const [narrow, setNarrow] = React.useState(false);
  React.useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !collapsible || typeof ResizeObserver === 'undefined') return;
    const update = () => setNarrow(root.getBoundingClientRect().width < COLLAPSE_BELOW_PX);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(root);
    return () => observer.disconnect();
  }, [collapsible]);

  const setExpanded = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledExpanded(next);
      onSidenavExpandedChange?.(next);
    },
    [isControlled, onSidenavExpandedChange],
  );

  const open = narrow && expanded;

  const close = React.useCallback(
    (returnFocus: boolean) => {
      setExpanded(false);
      if (returnFocus) toggleRef.current?.focus();
    },
    [setExpanded],
  );

  const toggle = React.useCallback(() => {
    togglePressed.current = false;
    focusOnOpen.current = !expanded;
    setExpanded(!expanded);
  }, [expanded, setExpanded]);

  // Opening from the menu button moves focus into the nav — it comes before the TopBar in the DOM,
  // so Tab alone would never reach it. Its current page link first, else its first link.
  React.useEffect(() => {
    if (!open || !focusOnOpen.current) return;
    focusOnOpen.current = false;
    const nav = navRef.current;
    const target =
      nav?.querySelector<HTMLElement>('[aria-current="page"]') ?? nav?.querySelector<HTMLElement>(FOCUSABLE);
    target?.focus();
  }, [open]);

  // Escape closes it (focus back on the menu button); a press anywhere outside the nav closes it.
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const active = document.activeElement;
      if (navRef.current?.contains(active) || active === toggleRef.current) {
        event.preventDefault();
        close(true);
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (navRef.current?.contains(target) || toggleRef.current?.contains(target)) return;
      close(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open, close]);

  // Focus leaving the open nav (Tab past its last link lands on the menu button) closes it — unless
  // it left because the menu button is being pressed, whose click does the toggling itself.
  const handleNavBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!open || togglePressed.current) return;
    if (navRef.current?.contains(event.relatedTarget as Node | null)) return;
    close(false);
  };

  // Following a link in the collapsed nav closes it.
  const handleNavClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (open && (event.target as HTMLElement).closest('a[href]')) close(false);
  };

  const navContext = React.useMemo<AppShellNavContextValue | null>(
    () =>
      collapsible
        ? {
            navId,
            expanded,
            toggle,
            toggleRef,
            onTogglePointerDown: () => {
              togglePressed.current = true;
            },
          }
        : null,
    [collapsible, navId, expanded, toggle],
  );

  return (
    <AppShellNavContext.Provider value={navContext}>
      <div
        ref={rootRef}
        data-helix-part="app-shell-root"
        data-collapsible={collapsible ? 'true' : undefined}
        className={cn(className)}
      >
        {sidenav && (
          <div
            ref={navRef}
            id={navId}
            data-helix-part="app-shell-nav"
            data-expanded={expanded ? 'true' : 'false'}
            onBlur={handleNavBlur}
            onClick={handleNavClick}
          >
            {sidenav}
          </div>
        )}
        <div data-helix-part="app-shell-content">
          {topbar}
          <main data-helix-part="app-shell-main">{children}</main>
        </div>
      </div>
    </AppShellNavContext.Provider>
  );
};

AppShell.displayName = 'AppShell';

export { AppShell };
