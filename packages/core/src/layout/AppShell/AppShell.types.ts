import type * as React from 'react';

export interface AppShellProps {
  /** A SideNav instance, rendered to the left. */
  sidenav?: React.ReactNode;
  /** A TopBar instance, rendered above the main content. */
  topbar?: React.ReactNode;
  /** The page's main content. */
  children: React.ReactNode;
  /** Additional className for the root. */
  className?: string;
}
