import type * as React from 'react';
import type { TablerIcon } from '@tabler/icons-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize    = 'xs' | 's' | 'm' | 'l' | 'xl';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  /** Visual style. Default: 'primary' */
  variant?: ButtonVariant;
  /** Physical size. Default: 'm' */
  size?: ButtonSize;
  /** Async action in progress — shows spinner, disables interaction. */
  loading?: boolean;
  /** Leading icon — a Tabler icon component, passed by reference (e.g. IconPlus). Always rendered at size=16 stroke=1.5, regardless of button size. */
  icon?: TablerIcon;
  /** Trailing icon. Same fixed size as `icon`. */
  iconEnd?: TablerIcon;
  /** Expand to 100% of container width. */
  fullWidth?: boolean;
  /** Primary action handler. `onClick` is an anti-synonym (see prop-map.md) and is intentionally omitted. */
  onPress?: React.MouseEventHandler<HTMLButtonElement>;
}
