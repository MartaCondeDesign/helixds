import * as React from 'react';
import { cn } from '../../lib/utils';
import { Icon } from '../Icon';
import type { NavItemProps } from './NavItem.types';

const NavItem = ({ label, href, icon, current = false, className }: NavItemProps) => {
  return (
    <a
      data-helix-part="nav-item"
      data-current={current ? 'true' : undefined}
      href={href}
      aria-current={current ? 'page' : undefined}
      className={cn(className)}
    >
      {icon && (
        <span data-helix-part="nav-item-icon">
          <Icon icon={icon} size={16} />
        </span>
      )}
      <span data-helix-part="nav-item-label">{label}</span>
    </a>
  );
};

NavItem.displayName = 'NavItem';

export { NavItem };
