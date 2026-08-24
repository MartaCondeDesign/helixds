import type { TablerIcon } from '@tabler/icons-react';

export type IconSize = 12 | 14 | 16 | 18 | 20 | 24 | 32;

export interface IconProps {
  /** The Tabler icon component to render, e.g. `IconPlus`. */
  icon: TablerIcon;
  /** Rendered icon size in pixels. Default: 16 */
  size?: IconSize;
  /**
   * Stroke width applied to the icon path. Default: scales with `size` (see `STROKE_BY_SIZE` in
   * Icon.tsx) — 1.5 at the 24px reference, compensated thicker below it so small icons don't read
   * as weak. Tabler's SVG viewBox stays fixed at 24×24 regardless of rendered size, so a flat
   * stroke value shrinks in real screen pixels as `size` drops — 1.5 unchanged at every size looks
   * proportionally correct on paper but visibly thin once rendered small. Pass explicitly only to
   * deviate from the scale on purpose (e.g. Checkbox's bold `stroke={3}` checkmark).
   */
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
