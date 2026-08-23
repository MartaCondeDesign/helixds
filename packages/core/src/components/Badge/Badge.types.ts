import type { TablerIcon } from '@tabler/icons-react';

export type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type BadgeSize    = 'xs' | 's';

export interface BadgeProps {
  /** Semantic color variant. Default: 'neutral' */
  variant?: BadgeVariant;
  /** Visual size. Default: 's' */
  size?: BadgeSize;
  /** Text content — required. Max 24 characters recommended. */
  label: string;
  /** Leading icon — a Tabler icon component, passed by reference (e.g. IconClock). Always rendered at size=12 stroke=1.5. */
  icon?: TablerIcon;
  /** Additional className for container. */
  className?: string;
}
