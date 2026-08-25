/**
 * Shared naming-rule checks for tokens.json, per packages/tokens/CLAUDE.md
 * ("Semantic naming vocabulary"). Used by verify-token-naming.ts (audits the
 * whole file) and token-cli.ts (checks one new key before writing it).
 */
import tokenNamingSchema from '../contracts/token-naming.schema.json' with { type: 'json' };

// Words that must never appear as a hyphen-delimited segment of a semantic/component
// token key — each has a required replacement per packages/tokens/CLAUDE.md.
// SOURCED FROM contracts/token-naming.schema.json's `bannedSegmentReplacements`, not
// hand-duplicated here — that schema is the single source of truth for this list. Edit it
// there; this constant picks up the change automatically, no second edit needed.
export const BANNED_SEGMENTS: Record<string, string> = tokenNamingSchema.bannedSegmentReplacements;

export function hasSegment(key: string, word: string): boolean {
  return key.toLowerCase().split('-').includes(word);
}

/** Checks a single key against the banned-segment rules. Returns violation messages, empty if clean. */
export function checkKeyNaming(key: string): string[] {
  const violations: string[] = [];
  for (const [banned, replacement] of Object.entries(BANNED_SEGMENTS)) {
    if (hasSegment(key, banned)) {
      violations.push(`Key segment '${banned}' is banned — use ${replacement} instead.`);
    }
  }
  return violations;
}

/** Checks whether an icon-family token's $value alias illegally points at semantic.color.text.*. */
export function checkIconAliasNaming(pathParts: string[], value: unknown): string[] {
  if (!pathParts.includes('icon')) return [];
  if (typeof value !== 'string' || !value.includes('semantic.color.text.')) return [];
  return [`Icon token aliases '${value}' — icons must alias semantic.color.icon.*, never semantic.color.text.*.`];
}

// ── Relative light/dark modifier check ──────────────────────────────────────────
//
// The one naming rule that was previously undocumented-as-code: packages/tokens/CLAUDE.md says
// a `-light`/`-dark`/`-lightest`/`-darkest` modifier must be correct RELATIVE to its role's base
// tone and its own siblings (e.g. is `text.neutral-lightest` actually lighter than
// `text.neutral-light`, which must itself be lighter than the base `text.neutral`?). Neither
// contracts/token-naming.schema.json nor checkKeyNaming can check this — a schema/single-key check
// has no way to compare RESOLVED values across sibling tokens. This does that comparison for real:
// resolves each key's alias chain down to a literal hex, computes HSL lightness, and checks the
// modifier's implied ordering against the measured one.

const GRAMMAR_KEY = /^(neutral|primary|secondary|danger|success|warning|info)(?:-interactive(?:-(light|dark|lightest|darkest))?-(default|hover|press))?(?:-(light|dark|lightest|darkest))?$/;

type ParsedColorKey = { role: string; interactive: boolean; state: string | null; modifier: string | null };

function parseColorKey(key: string): ParsedColorKey | null {
  const m = key.match(GRAMMAR_KEY);
  if (!m) return null;
  const [, role, interactiveModifier, state, plainModifier] = m;
  return { role: role!, interactive: !!state, state: state ?? null, modifier: interactiveModifier ?? plainModifier ?? null };
}

/** Resolves a DTCG `$value` alias string ("{primitive.color.blue.600}") down to a literal hex, following up to 5 hops. */
function resolveHex(tokens: unknown, ref: string, depth = 0): string | null {
  if (depth > 5) return null;
  if (/^#[0-9a-f]{6}$/i.test(ref)) return ref;
  const m = ref.match(/^\{(.+)\}$/);
  if (!m) return null;
  let node: unknown = tokens;
  for (const part of m[1]!.split('.')) {
    if (node === null || typeof node !== 'object' || !(part in node)) return null;
    node = (node as Record<string, unknown>)[part];
  }
  if (node === null || typeof node !== 'object' || !('$value' in node)) return null;
  const val = (node as { $value: unknown }).$value;
  return typeof val === 'string' ? resolveHex(tokens, val, depth + 1) : null;
}

/** HSL lightness (0–1) from a 6-digit hex string. */
function hexToLightness(hex: string): number | null {
  const m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  const [r, g, b] = [m[1]!, m[2]!, m[3]!].map(h => parseInt(h, 16) / 255);
  return (Math.max(r!, g!, b!) + Math.min(r!, g!, b!)) / 2;
}

type LightnessGroupMember = { key: string; modifier: string | null; lightness: number };

/**
 * Walks tokens.semantic.color.{fill,text,icon,border}, groups keys sharing a (role, interactive,
 * state) triple, resolves each to a hex, and checks that -light/-dark/-lightest/-darkest keys are
 * measurably lighter/darker than their group's base (unmodified) key, in the right order.
 * A group with no base (unmodified) member is skipped — there's no anchor to judge against.
 */
export function checkRelativeLightness(tokens: unknown): string[] {
  const issues: string[] = [];
  const color = (tokens as { semantic?: { color?: Record<string, Record<string, { $value?: unknown }>> } })?.semantic?.color;
  if (!color) return issues;

  const pct = (n: number) => `${Math.round(n * 100)}%`;

  for (const surface of ['fill', 'text', 'icon', 'border'] as const) {
    const group = color[surface];
    if (!group) continue;

    const buckets = new Map<string, LightnessGroupMember[]>();
    for (const [key, entry] of Object.entries(group)) {
      if (key.startsWith('$')) continue;
      const parsed = parseColorKey(key);
      if (!parsed) continue; // documented exception (link, page, focus, ...) — out of scope here
      const value = entry?.$value;
      const hex = typeof value === 'string' ? resolveHex(tokens, value) : null;
      const lightness = hex ? hexToLightness(hex) : null;
      if (lightness === null) continue; // couldn't resolve — not this check's job to flag that
      const bucketKey = `${parsed.role}|${parsed.interactive}|${parsed.state ?? ''}`;
      if (!buckets.has(bucketKey)) buckets.set(bucketKey, []);
      buckets.get(bucketKey)!.push({ key, modifier: parsed.modifier, lightness });
    }

    for (const members of buckets.values()) {
      const base = members.find(m => m.modifier === null);
      if (!base || members.length < 2) continue;

      for (const m of members) {
        if (m.modifier === 'light' || m.modifier === 'lightest') {
          if (!(m.lightness > base.lightness)) {
            issues.push(`${surface}.${m.key}: named '-${m.modifier}' but resolves no lighter than the base ${surface}.${base.key} (${pct(m.lightness)} vs ${pct(base.lightness)} lightness).`);
          }
        }
        if (m.modifier === 'dark' || m.modifier === 'darkest') {
          if (!(m.lightness < base.lightness)) {
            issues.push(`${surface}.${m.key}: named '-${m.modifier}' but resolves no darker than the base ${surface}.${base.key} (${pct(m.lightness)} vs ${pct(base.lightness)} lightness).`);
          }
        }
      }

      const light = members.find(m => m.modifier === 'light');
      const lightest = members.find(m => m.modifier === 'lightest');
      if (light && lightest && !(lightest.lightness > light.lightness)) {
        issues.push(`${surface}.${lightest.key}: named '-lightest' but is not lighter than ${surface}.${light.key} ('-light') (${pct(lightest.lightness)} vs ${pct(light.lightness)}).`);
      }
      const dark = members.find(m => m.modifier === 'dark');
      const darkest = members.find(m => m.modifier === 'darkest');
      if (dark && darkest && !(darkest.lightness < dark.lightness)) {
        issues.push(`${surface}.${darkest.key}: named '-darkest' but is not darker than ${surface}.${dark.key} ('-dark') (${pct(darkest.lightness)} vs ${pct(dark.lightness)}).`);
      }
    }
  }

  return issues;
}
