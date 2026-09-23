import type * as React from 'react';

/** Same vocabulary as Tooltip's `placement` — only the two edges that make sense for a full-height/full-width panel. */
export type SidePanelPlacement = 'right' | 'bottom';

export interface SidePanelProps {
  /** Which edge of the viewport the panel is anchored to and slides from. Default: 'right' */
  placement?: SidePanelPlacement;
  /** The panel's title — rendered visibly and used as its accessible name. */
  label: string;
  /** The panel's body content. */
  children: React.ReactNode;
  /** Whether the panel is open. Always controlled — see ADR-010. */
  expanded: boolean;
  /** Called when the panel should close (close button, Escape, or a backdrop click). SidePanel never closes itself — set `expanded` to false in response. */
  onDismiss: () => void;
  /** Whether to render the header's close (X) button. Default: true */
  showCloseButton?: boolean;
  /** Whether clicking outside the panel dismisses it. Default: true */
  closeOnBackdropClick?: boolean;
  /** Additional className for the root. */
  className?: string;
}
