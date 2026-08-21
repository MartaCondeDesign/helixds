import type * as React from 'react';

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
  /** Leading icon element. */
  icon?: React.ReactElement;
  /** Trailing icon or action element. */
  iconEnd?: React.ReactElement;
  /** Helper text shown below the field. */
  description?: string;
  /** Error text shown when invalid=true. */
  errorMessage?: string;
  /** Expand to 100% of container width. */
  fullWidth?: boolean;
}
