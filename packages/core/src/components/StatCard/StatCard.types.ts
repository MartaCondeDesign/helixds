export type StatCardTrend = 'up' | 'down';

export interface StatCardProps {
  /** The metric's name, e.g. 'Members'. */
  label: string;
  /** The metric's value, already formatted by the consumer, e.g. '103', '89%'. */
  value: string;
  /** Change text shown next to the trend icon, e.g. '+2 vs last month'. */
  delta?: string;
  /** Direction of the delta — controls the icon and its semantic color. Omit to render delta as plain text with no icon. */
  trend?: StatCardTrend;
  /** Additional className for the root. */
  className?: string;
}
