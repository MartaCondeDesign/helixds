import type * as React from 'react';
import type { HelixIconComponent } from '../Icon';

export type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type IconButtonSize    = 's' | 'm' | 'l';

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  /** The icon to render, passed by reference (e.g. IconTrash), not pre-instantiated. */
  icon: HelixIconComponent;
  /** Accessible name — required, since there's no visible text to describe the button. Rendered as aria-label. */
  label: string;
  /** Visual style. Default: 'ghost' — icon-only controls are almost always a secondary/utility action. */
  variant?: IconButtonVariant;
  /** Physical size — same scale and height tokens as Button. Width always equals height (square). Default: 'm' */
  size?: IconButtonSize;
  /** Async action in progress — shows a spinner in place of the icon, disables interaction. */
  loading?: boolean;
  /** Primary action handler. `onClick` is an anti-synonym (see prop-map.md) and is intentionally omitted. */
  onPress?: React.MouseEventHandler<HTMLButtonElement>;
}
