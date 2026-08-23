import type * as React from 'react';
import type { TablerIcon } from '@tabler/icons-react';

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
  /** Leading icon — a Tabler icon component, passed by reference (e.g. IconFilter). Always rendered at size=14 stroke=1.5. */
  icon?: TablerIcon;
  /** Trailing icon. Same fixed size as `icon`. */
  iconEnd?: TablerIcon;
  /** Primary press handler. */
  onPress?: React.MouseEventHandler<HTMLButtonElement>;
  /** Shows a close button for removing the chip. */
  dismissible?: boolean;
  /** Dismiss handler fired from the close button. */
  onDismiss?: () => void;
}
