import type * as React from 'react';
import type { TablerIcon } from '@tabler/icons-react';

export type InputSize = 's' | 'm' | 'l';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Visible or sr-only label. Required for a11y. */
  label: string;
  /** Hide the label visually (still announced by screen readers). */
  hideLabel?: boolean;
  /** Visual size. Default: 'm' */
  size?: InputSize;
  /** Field value fails validation. */
  invalid?: boolean;
  /** Marks field as required. */
  required?: boolean;
  /** Async validation in progress. */
  loading?: boolean;
  /** Leading icon — a Tabler icon component, passed by reference (e.g. IconSearch). Size follows the field's own `size` (s=14, m=16, l=18). */
  icon?: TablerIcon;
  /** Trailing icon. Same size-derived sizing as `icon`. */
  iconEnd?: TablerIcon;
  /** Helper text shown below the field. */
  description?: string;
  /** Error text shown when invalid=true. */
  errorMessage?: string;
  /** Expand to 100% of container width. */
  fullWidth?: boolean;
}
