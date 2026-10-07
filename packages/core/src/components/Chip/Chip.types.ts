import type * as React from 'react';
import type { HelixIconComponent } from '../Icon';

export type ChipVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type ChipSize = 's' | 'm';

export interface ChipProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'disabled' | 'size' | 'type'> {
  /** Semantic color variant. Default: 'neutral' */
  variant?: ChipVariant;
  /** Visual size. Default: 's' */
  size?: ChipSize;
  /** Disables interaction. */
  disabled?: boolean;
  /** Visible label. */
  label: string;
  /** Leading icon — a Tabler icon component, passed by reference (e.g. IconFilter). Always rendered at size=14 (stroke scales automatically via Icon). */
  icon?: HelixIconComponent;
  /** Trailing icon. Same fixed size as `icon`. */
  iconEnd?: HelixIconComponent;
  /** Primary press handler — React's own `onClick` (ADR-022). */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  /** Shows a close button for removing the chip. */
  dismissible?: boolean;
  /** Dismiss handler fired from the close button. */
  onDismiss?: () => void;
}
