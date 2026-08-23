import type * as React from 'react';

export interface SideNavProps {
  /** Logo/product-name content, rendered at the top. */
  brand?: React.ReactNode;
  /** The nav entries — a list of NavItem. */
  children: React.ReactNode;
  /** Content pinned to the bottom — typically the current user. */
  footer?: React.ReactNode;
  /** Additional className for the root. */
  className?: string;
}
