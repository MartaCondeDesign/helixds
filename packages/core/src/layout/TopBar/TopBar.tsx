import * as React from 'react';
import { IconMenu2 } from '@tabler/icons-react';
import { cn } from '../../lib/utils';
import { IconButton } from '../../components/IconButton';
import { useAppShellNav } from '../AppShell/AppShellContext';
import type { TopBarProps } from './TopBar.types';

const TopBar = ({ start, end, className }: TopBarProps) => {
  // Inside an AppShell with a sidenav: the menu button that opens the collapsed SideNav. CSS only
  // shows it below 768px of the shell's width.
  const shellNav = useAppShellNav();

  return (
    <header data-helix-part="topbar-root" className={cn(className)}>
      {shellNav && (
        <div data-helix-part="topbar-menu">
          <IconButton
            ref={shellNav.toggleRef}
            variant="ghost"
            size="m"
            icon={IconMenu2}
            label="Navigation menu"
            aria-expanded={shellNav.expanded}
            aria-controls={shellNav.navId}
            onPointerDown={shellNav.onTogglePointerDown}
            onClick={shellNav.toggle}
          />
        </div>
      )}
      {start && <div data-helix-part="topbar-start">{start}</div>}
      {end && <div data-helix-part="topbar-end">{end}</div>}
    </header>
  );
};

TopBar.displayName = 'TopBar';

export { TopBar };
