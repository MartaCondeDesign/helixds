import * as React from 'react';
import { cn } from '../../lib/utils';
import type { TopBarProps } from './TopBar.types';

const TopBar = ({ start, end, className }: TopBarProps) => {
  return (
    <header data-helix-part="topbar-root" className={cn(className)}>
      {start && <div data-helix-part="topbar-start">{start}</div>}
      {end && <div data-helix-part="topbar-end">{end}</div>}
    </header>
  );
};

TopBar.displayName = 'TopBar';

export { TopBar };
