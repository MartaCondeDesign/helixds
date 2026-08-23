import * as React from 'react';
import { cn } from '../../lib/utils';
import type { AppShellProps } from './AppShell.types';

const AppShell = ({ sidenav, topbar, children, className }: AppShellProps) => {
  return (
    <div data-helix-part="app-shell-root" className={cn(className)}>
      {sidenav}
      <div data-helix-part="app-shell-content">
        {topbar}
        <main data-helix-part="app-shell-main">{children}</main>
      </div>
    </div>
  );
};

AppShell.displayName = 'AppShell';

export { AppShell };
