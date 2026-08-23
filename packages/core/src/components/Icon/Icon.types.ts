import type { TablerIcon } from '@tabler/icons-react';

export type IconSize = 12 | 14 | 16 | 18 | 20 | 24 | 32;

export interface IconProps {
  /** The Tabler icon component to render, e.g. `IconPlus`. */
  icon: TablerIcon;
  /** Rendered icon size in pixels. Default: 16 */
  size?: IconSize;
  /** Stroke width applied to the icon path. Default: 1.5 (Helix override of Tabler's default 2) */
  stroke?: number;
  /** Icon stroke color. Default: 'currentColor' — prefer inheriting from surrounding text/token. */
  color?: string;
  /** Accessible label for icon-only usage. Required when `decorative` is false. */
  label?: string;
  /** Marks the icon as decorative when a visible label already exists nearby. Default: true */
  decorative?: boolean;
  /** Additional className for the root svg. */
  className?: string;
}
