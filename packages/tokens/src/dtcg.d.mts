// Types for dtcg.mjs — DTCG 2025.10 token values ⇄ CSS.

export const EXTENSION: 'com.helixds';

export type DtcgColor = { colorSpace: string; components: number[]; alpha?: number; hex?: string };
export type DtcgLength = { value: number; unit: string };
export type DtcgShadowLayer = {
  color: DtcgColor | string; offsetX: DtcgLength | string; offsetY: DtcgLength | string;
  blur: DtcgLength | string; spread: DtcgLength | string; inset?: boolean;
};
export type DtcgValue =
  | string | number | number[] | string[]
  | DtcgColor | DtcgLength | DtcgShadowLayer | Array<DtcgShadowLayer | string>
  | Record<string, unknown>;

export function isAlias(value: unknown): value is string;

export function toCss(
  value: unknown,
  type: string | undefined,
  options?: { extensions?: Record<string, any> | undefined; ref?: ((alias: string) => string) | undefined },
): string;

export function fromCss(css: string, type: string): { $value: DtcgValue; $type?: string; $extensions?: Record<string, unknown> };
