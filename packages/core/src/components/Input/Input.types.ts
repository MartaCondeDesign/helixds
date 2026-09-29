import type * as React from 'react';
import type { HelixIconComponent } from '../Icon';

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
  /** Leading icon — a Tabler icon component, passed by reference (e.g. IconSearch). Size follows the field's own `size` (s=16, m=16, l=18). */
  icon?: HelixIconComponent;
  /** Trailing icon. Same size-derived sizing as `icon`. */
  iconEnd?: HelixIconComponent;
  /** Helper text shown below the field. */
  description?: string;
  /** Error text shown when invalid=true. */
  errorMessage?: string;
  /** Bump this (e.g. an attempt counter) on each failed validation to retrigger the error shake even
   * when `invalid` was already true — a plain `invalid` false→true edge won't fire again on its own
   * if a consumer sets it back to true without an intervening render where it was false (common with
   * React 18 batching: `setInvalid(false); setInvalid(true)` inside one handler collapses to a no-op). */
  invalidAttempt?: number;
  /** Expand to 100% of container width. */
  fullWidth?: boolean;
}
