import type * as React from 'react';
import type { HelixIconComponent } from '../Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize    = 's' | 'm' | 'l';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. Default: 'primary' */
  variant?: ButtonVariant;
  /** Physical size. Default: 'm' */
  size?: ButtonSize;
  /** Async action in progress — shows spinner, disables interaction. */
  isLoading?: boolean;
  /** Leading icon — a Tabler icon component, passed by reference (e.g. IconPlus). Always rendered at size=16 (stroke scales automatically via Icon), regardless of button size. */
  icon?: HelixIconComponent;
  /** Trailing icon. Same fixed size as `icon`. */
  iconEnd?: HelixIconComponent;
  /** Expand to 100% of container width. */
  fullWidth?: boolean;
  /** Primary action handler — React's own `onClick` (ADR-022: names follow what agents expect). `onPress` is an anti-synonym. */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  /** The button's text. Button has no `label` prop — its text is children; icon-only actions use IconButton. */
  children?: React.ReactNode;
}
