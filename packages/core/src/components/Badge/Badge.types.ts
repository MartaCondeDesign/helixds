import type * as React from 'react';

export type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type BadgeSize    = 'xs' | 's';

export interface BadgeProps {
  /** Semantic color variant. Default: 'neutral' */
  variant?: BadgeVariant;
  /** Visual size. Default: 's' */
  size?: BadgeSize;
  /** Text content — required. Max 24 characters recommended. */
  label: string;
  /** Leading Tabler icon element. */
  icon?: React.ReactElement;
  /** Additional className for container. */
  className?: string;
}
