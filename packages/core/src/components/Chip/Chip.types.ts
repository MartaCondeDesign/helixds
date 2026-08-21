import type * as React from 'react';

export type ChipVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type ChipSize = 's' | 'm';

export interface ChipProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'disabled' | 'onClick' | 'size' | 'type'> {
  /** Semantic color variant. Default: 'neutral' */
  variant?: ChipVariant;
  /** Visual size. Default: 'm' */
  size?: ChipSize;
  /** Marks the chip as checked. */
  checked?: boolean;
  /** Disables interaction. */
  disabled?: boolean;
  /** Visible label. */
  label: string;
  /** Leading icon. */
  icon?: React.ReactElement;
  /** Trailing icon. */
  iconEnd?: React.ReactElement;
  /** Primary press handler. */
  onPress?: React.MouseEventHandler<HTMLButtonElement>;
  /** Shows a close button for removing the chip. */
  dismissible?: boolean;
  /** Dismiss handler fired from the close button. */
  onDismiss?: () => void;
}
