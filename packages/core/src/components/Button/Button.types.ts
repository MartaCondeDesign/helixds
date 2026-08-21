import type * as React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize    = 'xs' | 's' | 'm' | 'l' | 'xl';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. Default: 'primary' */
  variant?: ButtonVariant;
  /** Physical size. Default: 'm' */
  size?: ButtonSize;
  /** Async action in progress — shows spinner, disables interaction. */
  loading?: boolean;
  /** Leading icon — pass a Tabler icon element. */
  icon?: React.ReactElement;
  /** Trailing icon. */
  iconEnd?: React.ReactElement;
  /** Expand to 100% of container width. */
  fullWidth?: boolean;
  /** Primary action handler. */
  onPress?: React.MouseEventHandler<HTMLButtonElement>;
}
