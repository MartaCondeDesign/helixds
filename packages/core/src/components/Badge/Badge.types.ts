import type { HelixIconComponent } from '../Icon';

export type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type BadgeSize    = 'xs' | 's';

export interface BadgeProps {
  /** Semantic color variant. Default: 'neutral' */
  variant?: BadgeVariant;
  /** Visual size. Default: 's' */
  size?: BadgeSize;
  /** Text content — required. Max 24 characters recommended. */
  label: string;
  /** Leading icon — a Tabler icon component, passed by reference (e.g. IconClock). Always rendered at size=12 (stroke follows the ADR-017 rule via Icon). */
  icon?: HelixIconComponent;
  /** Additional className for container. */
  className?: string;
}
