import * as React from 'react';

/** What a TopBar inside an AppShell needs to draw the menu button of the collapsed SideNav. */
export interface AppShellNavContextValue {
  /** id of app-shell-nav — the menu button's aria-controls. */
  navId: string;
  /** Whether the collapsed SideNav is open — the menu button's aria-expanded. */
  expanded: boolean;
  /** Opens/closes the collapsed SideNav. */
  toggle: () => void;
  /** The menu button, so focus can return to it when the nav closes. */
  toggleRef: React.RefObject<HTMLButtonElement | null>;
  /** Marks a pointer press on the menu button, so the nav's focus-out doesn't close it just before the click toggles it. */
  onTogglePointerDown: () => void;
}

export const AppShellNavContext = React.createContext<AppShellNavContextValue | null>(null);

export const useAppShellNav = () => React.useContext(AppShellNavContext);
