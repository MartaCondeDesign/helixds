import type * as React from 'react';

export type IconSize = 12 | 14 | 16 | 18 | 20 | 24 | 28 | 32 | 36 | 40;

/**
 * Structural shape Helix's `Icon` wrapper actually renders through — `size`, `stroke`, `color`,
 * plus standard SVG/aria passthrough. Every `@tabler/icons-react` icon already satisfies this
 * type as-is (Tabler is the documented default set), so existing usage is unaffected. Any other
 * icon component matching this same prop shape can be passed directly too; one that doesn't
 * (different prop names, e.g. Lucide's `strokeWidth`) can be wrapped with `createIconAdapter` —
 * see `Icon/createIconAdapter.ts` and ADR-014.
 */
export type HelixIconComponent = React.ComponentType<
  Omit<React.SVGProps<SVGSVGElement>, 'size' | 'stroke' | 'color'> & {
    size?: number | string;
    stroke?: number;
    color?: string;
  }
>;

export interface IconProps {
  /** The icon component to render, passed by reference (e.g. `IconPlus`), not pre-instantiated.
   *  Defaults to Tabler's outline set; any `HelixIconComponent`-shaped component works — see
   *  `createIconAdapter` for sets with an incompatible prop dialect. */
  icon: HelixIconComponent;
  /** Rendered icon size in pixels. Default: 16 */
  size?: IconSize;
  /**
   * Stroke width applied to the icon path (24×24 viewBox units). Default: derived automatically
   * from `size` by the icon stroke rule (ADR-017, `ICON_STROKE_PX_BY_SIZE` in iconStroke.ts) —
   * a real on-screen line of 1.3px at 12 rising to 2.8px at 40. Tabler's viewBox stays fixed at
   * 24×24, so a flat stroke value would get thinner on screen as `size` drops. Don't pass it to
   * fix a "too thin" icon — change the rule instead. Pass explicitly only for a deliberate
   * one-off (e.g. Checkbox's bold `stroke={3}` checkmark).
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
