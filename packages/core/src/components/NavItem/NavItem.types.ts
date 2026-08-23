import type { TablerIcon } from '@tabler/icons-react';

export interface NavItemProps {
  /** Visible label text. */
  label: string;
  /** Navigation target. */
  href: string;
  /** Leading icon, passed by reference. Rendered at a fixed 16px. */
  icon?: TablerIcon;
  /** Marks this item as representing the current view. Default: false */
  current?: boolean;
  /** Additional className for the root. */
  className?: string;
}
