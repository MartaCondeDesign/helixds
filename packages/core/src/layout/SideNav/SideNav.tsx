import * as React from 'react';
import { cn } from '../../lib/utils';
import type { SideNavProps } from './SideNav.types';

const SideNav = ({ brand, children, footer, className }: SideNavProps) => {
  return (
    <nav data-helix-part="side-nav-root" className={cn(className)}>
      {brand && <div data-helix-part="side-nav-brand">{brand}</div>}
      <div data-helix-part="side-nav-items">{children}</div>
      {footer && <div data-helix-part="side-nav-footer">{footer}</div>}
    </nav>
  );
};

SideNav.displayName = 'SideNav';

export { SideNav };
