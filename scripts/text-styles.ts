/**
 * The named Text Styles — Helix's actual "semantic" layer for typography. Each combines 4
 * primitives (fontFamily + fontSize + fontWeight + lineHeight, the latter keyed by the same
 * fontSize rung) under one role name, mirroring the Figma file's Text Styles 1:1 (see
 * .ai/skills/tokens-to-figma.md → Phase 6, which creates these same 16 in Figma from an
 * independently hand-maintained list — keep both in sync when adding/renaming a style).
 *
 * Source of truth: `semantic.textStyle.*` in packages/tokens/src/tokens.json — a DTCG composite
 * ($type: "typography") token per style. This module just loads and reshapes that JSON; it holds
 * no data of its own. apps/storybook/stories/Foundation/TextStyles.stories.tsx and
 * scripts/audit-token-exceptions.ts both import from here rather than reading tokens.json directly.
 *
 * Static import (not fs.readFileSync) deliberately — this file is imported by a Storybook story,
 * which runs through Vite/the browser and has no `fs`. A static JSON import works in both that
 * context and the Node/tsx scripts that also import this module.
 */
import tokensJson from '../packages/tokens/src/tokens.json';

const tokens = tokensJson as unknown as {
  semantic: { textStyle: Record<string, { $value: Record<string, string>; $description: string }> };
};

export type TextStyleGroup = 'Display' | 'Heading' | 'Body' | 'Other';

export interface TextStyleDef {
  /** kebab-case key under semantic.textStyle.* — e.g. 'body-s-medium'. */
  key: string;
  group: TextStyleGroup;
  /** Human-readable name mirroring the Figma Text Style, e.g. 'Body / s / Medium'. */
  name: string;
  weight: 'regular' | 'medium' | 'semibold' | 'bold';
  /** primitive.fontSize.* key this style binds to (also the paired semantic.lineHeight.* key). */
  size: string;
}

/** Pulls the trailing key off a `{primitive.category.key}` alias string. */
function aliasKey(value: string): string {
  return value.slice(1, -1).split('.').pop()!;
}

const GROUP_NAMES: TextStyleGroup[] = ['Display', 'Heading', 'Body', 'Other'];

export const TEXT_STYLES: TextStyleDef[] = Object.entries(tokens.semantic.textStyle).map(([key, node]) => {
  // $description is authored as "{Name} — {usage note}"; the name is the part before the em dash.
  const name = node.$description.split(' — ')[0];
  const group = GROUP_NAMES.find(g => name.startsWith(g)) ?? 'Other';
  return {
    key,
    group,
    name,
    weight: aliasKey(node.$value.fontWeight) as TextStyleDef['weight'],
    size: aliasKey(node.$value.fontSize),
  };
});

/**
 * First-match lookup by (weight, size) — some pairs are intentionally ambiguous (`semibold`+`s`
 * matches both "Caption / Semibold" and "Label / Uppercase"; only the uppercase transform tells
 * them apart, which isn't part of the weight/size key). Declaration order in tokens.json decides
 * the winner: whichever style is listed first for that pair is what a mechanical match proposes —
 * a starting point for a human to confirm, same as every other 🆕/🚩 proposal in the audit.
 */
export function findTextStyle(weight: string, size: string): TextStyleDef | undefined {
  return TEXT_STYLES.find(s => s.weight === weight && s.size === size);
}

/** Mechanical group guess for a NEW style proposal — same size bucketing the 16 above already use. */
export function inferGroupForSize(size: string): TextStyleGroup {
  if (size === '5xl' || size === '6xl') return 'Display';
  if (size === 'xl' || size === '2xl' || size === '3xl' || size === '4xl') return 'Heading';
  return 'Body'; // s / m / l
}

export function proposeTextStyleName(weight: string, size: string): string {
  const group = inferGroupForSize(size);
  const weightLabel = weight.charAt(0).toUpperCase() + weight.slice(1);
  return `${group} / ${size} / ${weightLabel}`;
}
