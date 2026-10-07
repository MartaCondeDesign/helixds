import type * as React from 'react';
import type { HelixIconComponent } from '../Icon';

export interface FABAction {
  icon: HelixIconComponent;
  label: string;
  onClick: () => void;
}

export interface FABProps {
  /** The trigger's icon, passed by reference (e.g. IconPlus). */
  icon: HelixIconComponent;
  /** Accessible name for the trigger — required, there is no visible text. */
  label: string;
  /** Speed-dial actions revealed when expanded. Omit for a plain FAB with no speed-dial. */
  actions?: FABAction[];
  /** Controlled expanded state. */
  expanded?: boolean;
  /** Uncontrolled initial expanded state. Default: false */
  defaultExpanded?: boolean;
  /** Fired when the speed-dial opens or closes. */
  onExpandedChange?: (expanded: boolean) => void;
  /** Disables interaction. */
  disabled?: boolean;
  /** Additional className for the root wrapper. */
  className?: string;
  /** Trigger press handler — React's own `onClick` (ADR-022). `onPress` is an anti-synonym.
   *  No other native <button> passthrough is supported — Motion's HTMLMotionProps redefines several native
   *  event names (style, onDrag, onAnimationStart, ...) for its own gesture/animation system, so FAB's
   *  root no longer extends ButtonHTMLAttributes wholesale (it did before the Motion migration, ADR-007). */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}
