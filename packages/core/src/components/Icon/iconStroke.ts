import type { IconSize } from './Icon.types';

/**
 * Icon stroke rule (ADR-017) — the single source of truth for how thick an icon's line reads on
 * screen. Values are the **real rendered line width in CSS px**, not the SVG `stroke` attribute:
 * Tabler's viewBox stays fixed at 24×24 whatever `size` renders at, so the same `stroke` value
 * gets thinner on screen as the icon shrinks (rendered px = stroke × size / 24). Designing in real
 * px and deriving `stroke` from it keeps small icons (Badge's 12px, Chip's 14px) from reading as
 * weak next to semibold text, and makes the line grow steadily with the icon.
 *
 * To change how heavy icons look, edit this table — never pass `stroke` at a call site to fix a
 * "too thin" icon. `iconStrokeForSize` derives the SVG value automatically.
 */
export const ICON_STROKE_PX_BY_SIZE: Record<IconSize, number> = {
  12: 1.3,
  14: 1.4,
  16: 1.5,
  18: 1.5, // same as 16 (was 1.6): IconButton's 18px icons read heavier than Button's 16px ones side by side
  20: 1.7,
  24: 1.8,
  28: 2.0,
  32: 2.2,
  36: 2.4,
  40: 2.8,
};

/** [size, real px] rungs, ascending by size. */
const RUNGS: [number, number][] = Object.entries(ICON_STROKE_PX_BY_SIZE)
  .map(([size, px]): [number, number] => [Number(size), px])
  .sort((a, b) => a[0] - b[0]);

/** SVG `stroke` attribute (24×24 viewBox units) that renders a line `px` wide at `size`. */
const toSvgStroke = (px: number, size: number) => Math.round(((px * 24) / size) * 100) / 100;

/**
 * SVG `stroke` value for an icon rendered at `size` px, following ICON_STROKE_PX_BY_SIZE.
 * Sizes between two rungs interpolate the real px linearly; below the smallest / above the largest
 * rung the edge rung's `stroke` is held, so the line then scales proportionally with the icon.
 */
export function iconStrokeForSize(size: number): number {
  let lower: [number, number] | undefined;
  for (const rung of RUNGS) {
    const [rungSize, rungPx] = rung;
    if (size === rungSize) return toSvgStroke(rungPx, size);
    if (size < rungSize) {
      // Below the first rung: hold its svg stroke.
      if (!lower) return toSvgStroke(rungPx, rungSize);
      const [loSize, loPx] = lower;
      const t = (size - loSize) / (rungSize - loSize);
      return toSvgStroke(loPx + t * (rungPx - loPx), size);
    }
    lower = rung;
  }
  // Above the last rung: hold its svg stroke.
  return lower ? toSvgStroke(lower[1], lower[0]) : 1.5;
}
