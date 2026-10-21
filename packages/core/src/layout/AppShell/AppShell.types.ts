import type * as React from 'react';

export interface AppShellProps {
  /** A SideNav instance, rendered to the left. */
  sidenav?: React.ReactNode;
  /** A TopBar instance, rendered above the main content. */
  topbar?: React.ReactNode;
  /** The page's main content. */
  children: React.ReactNode;
  /** Controlled: whether the collapsed SideNav is open (below 768px only). Leave unset for uncontrolled (see `defaultSidenavExpanded`). */
  sidenavExpanded?: boolean;
  /** Initial open state of the collapsed SideNav, for uncontrolled usage. Default: false */
  defaultSidenavExpanded?: boolean;
  /** Fires whenever the collapsed SideNav opens or closes — the menu button, Escape, following a nav link or tabbing out of it. */
  onSidenavExpandedChange?: (expanded: boolean) => void;
  /** Additional className for the root. */
  className?: string;
}
