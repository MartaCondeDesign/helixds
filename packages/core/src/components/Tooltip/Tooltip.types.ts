import type * as React from 'react';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  /** The tooltip's text content — short, plain text only, no interactive content. */
  label: string;
  /** The trigger — whatever the tooltip describes (an icon, an avatar, an icon-only button). Must accept and forward `aria-describedby` to its rendered DOM node. */
  children: React.ReactElement;
  /** Which side of the trigger the content renders on. Fixed offset, no auto-flip on viewport edge (see ADR-008). Default: 'top' */
  placement?: TooltipPlacement;
  /** Forces the content visible (`true`) or hidden (`false`) regardless of hover/focus — for a controlled/always-shown case. Leave unset for the normal hover/focus-driven behavior. */
  expanded?: boolean;
  /** Additional className for the root. */
  className?: string;
}
