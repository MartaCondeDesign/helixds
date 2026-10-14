/**
 * Regenerates the ASCII table inside .ai/maps/component-token-exceptions.md from the
 * current state of packages/tokens/src/tokens.json.
 *
 * Every `component.*` leaf token that doesn't fully alias `semantic.*` gets one row,
 * grouped by token type (Typography, Size, Spacing, Motion, Border, Color, Shadow):
 *  - matches a KNOWN_EXCEPTIONS entry -> the human-judged tag/value for it
 *    (this is the one place a judgment call — "this is an intentional ADR-004 density
 *    exception", "this is a one-off color" — gets recorded; everything else below is
 *    inferred purely from the data)
 *  - aliases `primitive.*` directly, category has no flat semantic layer -> `-- SS`
 *  - aliases `primitive.*` directly, a same-category semantic token exists with the
 *    same resolved value -> that semantic token is proposed; no exact rung -> `-- NM`
 *  - raw literal (no alias at all) -> proposes a same-value primitive if one exists,
 *    otherwise `-- NM`
 *
 * Run: pnpm docs:token-exceptions
 * Wired into .husky/pre-commit so the doc can never drift from tokens.json.
 */
import fs from 'fs';
import path from 'path';
import { findTextStyle, proposeTextStyleName } from './text-styles';
import { toCss } from '../packages/tokens/src/dtcg.mjs';

const tokensPath = path.resolve(import.meta.dirname, '../packages/tokens/src/tokens.json');
const docPath = path.resolve(import.meta.dirname, '../.ai/maps/component-token-exceptions.md');

const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));

// A ✅ needs a real ADR behind it, not just a comment in this file — that's the whole
// point of KNOWN_EXCEPTIONS being reviewable. `topBar.height` and `dialog.overlay` used
// to live here as 'FE'/'NM' judgment calls with no ADR to back them; per 2026-08-23
// review neither is documented anywhere, so they were removed and now fall through to
// the mechanical 🆕 classification below like any other unreviewed gap.
type KnownTag = 'ADR-004' | 'ADR-005' | 'ADR-007' | 'ADR-008' | 'ADR-010' | 'ADR-011' | 'ADR-013' | 'ADR-016' | 'ADR-021' | 'ADR-024';

const REASON_TEXT: Record<KnownTag, string> = {
  'ADR-004': 'ADR-004 exception',
  'ADR-005': 'ADR-005 exception',
  'ADR-007': 'ADR-007 exception',
  'ADR-008': 'ADR-008 exception',
  'ADR-010': 'ADR-010 exception',
  'ADR-011': 'ADR-011 exception',
  'ADR-013': 'ADR-013 exception',
  'ADR-016': 'ADR-016 exception',
  'ADR-021': 'ADR-021 exception',
  'ADR-024': 'ADR-024 exception',
};

// Human judgment calls — the only hand-maintained data in this script. Add an entry
// here only when a real ADR documents the exception (e.g. ADR-004's Badge/Chip density
// model) — not for a one-off decision that only lives as a code comment.
const KNOWN_EXCEPTIONS: Record<string, { tag: KnownTag }> = {
  // Only the rungs with NO semantic.size match go here. `badge.height.s` (24px) and `chip.height.m`
  // (32px) coincidentally equal semantic.size.s/.m — that's not a documented exception to hide behind
  // ✅, it's a real 🚩 reuse opportunity the mechanical match below already finds correctly. Force-listing
  // them here would suppress that and misrepresent "reviewed, nothing to do" for a row that mechanically
  // has something to do. See ADR-004's density-model note for why the coincidence isn't acted on by
  // default even though it's flagged.
  'badge.height.xs': { tag: 'ADR-004' },
  'chip.height.s': { tag: 'ADR-004' },
  // 6px lands between primitive.spacing.25 (4px) and .50 (8px) with no grid rung of its own — see
  // ADR-004's "One exception to that exception" for why a new rung isn't worth adding for this.
  'chip.gap.s': { tag: 'ADR-004' },
  'chip.gap.m': { tag: 'ADR-004' },
  // FAB's speed-dial actions render smaller than the trigger — 36px, between Control's m (32px) and
  // l (40px) — a documented local exception, see ADR-004's "FAB, added 2026-09-09" note.
  'fab.action.height': { tag: 'ADR-004' },
  // Switch m is 20px — its own track proportions, not the control ladder (no 20px semantic.size
  // rung). Same category as Badge/Chip; see ADR-004's "Switch and Button l, added 2026-09-24".
  'switch.height.m': { tag: 'ADR-004' },
  // Note: `*.width` tokens (SideNav.width, etc.) never reach this map — they're skipped
  // entirely below, per CLAUDE.md's token policy that width is deliberately not tokenized.

  // Toast's tuned animation/timing constants — no semantic.duration.* rung matches
  // durationOpen/durationClose without changing the actual tuned feel, and the rest have no
  // shared cross-component concept to alias at all. See ADR-011's "Tuned constants, not tokens".
  'toast.durationOpen': { tag: 'ADR-011' },
  'toast.durationClose': { tag: 'ADR-011' },
  'toast.autoDismissMs': { tag: 'ADR-011' },
  // Chart's area fill opacity — chart-only, no semantic opacity rung (ADR-021 amendment, 2026-10-12).
  'chart.area-opacity': { tag: 'ADR-021' },
  // The donut's update morph (ADR-021 amendment, 2026-10-13) — 400ms, no semantic.duration rung matches.
  'chart.duration-update': { tag: 'ADR-021' },
  // Illustration-only motion values — the ones shared with components alias semantic.duration/easing;
  // these have no component counterpart (ADR-024, amended 2026-10-12).
  'illustration.motion.duration-enter': { tag: 'ADR-024' },
  'illustration.motion.duration-emphasis': { tag: 'ADR-024' },
  'illustration.motion.duration-recolor': { tag: 'ADR-024' },
  'illustration.motion.hold': { tag: 'ADR-024' },
  'illustration.motion.easing-exit': { tag: 'ADR-024' },
  'illustration.motion.easing-emphasis': { tag: 'ADR-024' },
  'illustration.motion.easing-draw': { tag: 'ADR-024' },
  // blurEnter is no longer an exception — promoted to semantic.blur.enter once Accordion, SidePanel,
  // and Toast turned out to share the identical 2px value (see packages/tokens/CLAUDE.md's "Motion
  // naming vocabulary" — a value shared by 3+ components is exactly the bar for a real shared token).
  'toast.scaleEnter': { tag: 'ADR-011' },
  'toast.depthScale': { tag: 'ADR-011' },
  'toast.depthFade': { tag: 'ADR-011' },
  // A slide-up-on-enter travel distance, not a spacing/gap value — semantic.spacing.* tops out at
  // 32px (xl) with nothing near 80px, and forcing it onto primitive.spacing.500 directly misrepresents
  // it as "a spacing usage" when it's really an animation offset, same category as blurEnter/scaleEnter.
  'toast.rise': { tag: 'ADR-011' },
  // 2px hairline gap between menu items, explicit review feedback (not a rounding of the 4px
  // primitive.spacing.25 rung, deliberately smaller) — see ADR-013's amendment.
  'menu.gap': { tag: 'ADR-013' },
  // Menu's open/close scales — tuned to Menu like Modal's/Tooltip's own scale-enter (ADR-013 amendment, 2026-10-13).
  'menu.scale-enter': { tag: 'ADR-013' },
  'menu.scale-exit': { tag: 'ADR-013' },
  // How small an icon gets as it swaps out/in — unrelated to the hover/press scale rungs (ADR-007 amendment, 2026-10-13).
  'button.swap-scale': { tag: 'ADR-007' },

  // Tooltip's tuned show/hide timing — ADR-008 explicitly discusses the show-delay's purpose
  // ("a short show delay avoids flashing one on every incidental mouse pass, matching the APG
  // pattern's guidance"); duration-in/duration-out/scale-enter are the same primitive's own
  // animation constants, same category as Toast's ADR-011 exceptions.
  'tooltip.delay': { tag: 'ADR-008' },
  'tooltip.duration-in': { tag: 'ADR-008' },
  'tooltip.duration-out': { tag: 'ADR-008' },
  'tooltip.scale-enter': { tag: 'ADR-008' },

  // Modal's open/close choreography and backdrop — ADR-010 defines Modal as this exact pattern
  // ("flip to data-state=closing, wait the component's own close-duration token... each
  // supplying its own close-duration token"), so its tuned duration/scale-enter/overlay values
  // are this same decision's implementation detail, not a separate unreviewed gap.
  'modal.duration-open': { tag: 'ADR-010' },
  'modal.duration-close': { tag: 'ADR-010' },
  'modal.scale-enter': { tag: 'ADR-010' },
  // The backdrop color itself is semantic.color.fill.overlay; only its opacity is Modal-local —
  // see ADR-010's "Backdrop" note.
  'modal.overlay-opacity': { tag: 'ADR-010' },

  // SidePanel shares ADR-010 with Modal for the same open/close choreography reasoning.
  'sidePanel.duration-open': { tag: 'ADR-010' },
  'sidePanel.duration-close': { tag: 'ADR-010' },

  // Accordion's chevron/height/content all transition on the same duration on purpose, so the
  // chevron finishes rotating exactly when the panel finishes expanding or collapsing — see
  // ADR-016 (written to close this gap; no prior ADR covered Accordion's motion at all).
  'accordion.duration-expand': { tag: 'ADR-016' },
  'accordion.duration-collapse': { tag: 'ADR-016' },
  'accordion.duration-chevron': { tag: 'ADR-016' },

  // Input's one-off error shake (CSS keyframes) — tuned travel distance and second-phase timing
  // with no shared cross-component concept; see ADR-007's "Tuned one-off CSS motion" amendment.
  'input.shake.distance': { tag: 'ADR-007' },
  'input.shake.dur-b': { tag: 'ADR-007' },
};

// The 3 possible outcomes, flagged with an emoji prefixed onto the "Current Value" cell:
//  ✅ reviewed and correct as-is — no token change needed
//  🚩 an existing token already has this exact value — should be reused
//  🆕 no existing token matches — a new one is proposed
type Flag = '✅' | '🚩' | '🆕';

// ── tokens.json helpers ─────────────────────────────────────────────────────────

/**
 * Walks a dotted path to its node. A composite token ($value is an object — e.g.
 * semantic.textStyle.*) reached with path segments still remaining indexes the rest into
 * $value (fontSize/fontWeight/...), not the token node itself — that's where a composite's
 * sub-properties actually live. Landing exactly on a sub-property (a bare alias/literal string,
 * not a `{$value: ...}` object) gets wrapped as `{ $value: <that string> }` so every caller can
 * keep using `.$value` uniformly regardless of how many composite hops it took to get here.
 */
function getNode(dottedPath: string): any {
  let node: any = tokens;
  for (const key of dottedPath.split('.')) {
    if (node && typeof node === 'object' && '$value' in node && node.$type === 'typography') {
      const sub = node.$value[key];
      // A literal sub-property ({ value, unit }) — wrap it with its DTCG type so callers can render it.
      node = sub && typeof sub === 'object' ? { $value: sub, $type: 'dimension' } : sub;
      continue;
    }
    node = node?.[key];
    if (node === undefined) throw new Error(`Path not found in tokens.json: ${dottedPath}`);
  }
  if (typeof node === 'string') return { $value: node };
  if (node === undefined) throw new Error(`Path not found in tokens.json: ${dottedPath}`);
  return node;
}

function isAlias(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('{') && value.endsWith('}');
}

/** Follows a $value alias chain to its final literal value. */
function resolveValue(dottedPath: string): string {
  let node = getNode(dottedPath);
  let value = node.$value;
  const seen = new Set<string>();
  while (isAlias(value)) {
    const target = value.slice(1, -1);
    if (seen.has(target)) throw new Error(`Alias cycle at ${dottedPath}`);
    seen.add(target);
    node = getNode(target);
    value = node.$value;
  }
  return toCss(value, node.$type, { extensions: node.$extensions }); // DTCG 2025.10 value → its CSS
}

type Leaf = { path: string; value: unknown };

function collectLeaves(node: any, prefix: string[]): Leaf[] {
  if (node === null || typeof node !== 'object') return [];
  if ('$value' in node) return [{ path: prefix.join('.'), value: isAlias(node.$value) ? node.$value : toCss(node.$value, node.$type, { extensions: node.$extensions }) }];
  const out: Leaf[] = [];
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith('$')) continue;
    out.push(...collectLeaves(child, [...prefix, key]));
  }
  return out;
}

/** Finds a leaf under `root` (dotted path) whose resolved value equals `target`. Returns its full path, or null. */
function findMatchingValue(root: string, target: string): string | null {
  let rootNode: any;
  try {
    rootNode = getNode(root);
  } catch {
    return null;
  }
  const leaves = collectLeaves(rootNode, [root]);
  for (const leaf of leaves) {
    if (resolveValue(leaf.path) === target) return leaf.path;
  }
  return null;
}

/**
 * `primitive.spacing` and `primitive.size` overlap numerically (both have an 8/12/16/20/24/28/32...
 * px rung), so a plain whole-tree search picks whichever comes first in tokens.json — usually wrong.
 * Bias the search toward the category the token name actually means: a dimension
 * (size/width/height/thumb) should propose `primitive.size.*`; a gap (padding/gap/margin) should
 * propose `primitive.spacing.*`. Falls back to a full-tree search for anything else (colors, etc).
 */
function findMatchingPrimitive(tokenPath: string, target: string): string | null {
  const isDimension = /size|width|height|thumb/i.test(tokenPath);
  const isSpacingLike = /padding|gap|margin/i.test(tokenPath);
  const preferredRoots = isDimension
    ? ['primitive.size', 'primitive.spacing']
    : isSpacingLike
      ? ['primitive.spacing', 'primitive.size']
      : [];

  for (const root of preferredRoots) {
    const match = findMatchingValue(root, target);
    if (match) return match;
  }
  return findMatchingValue('primitive', target);
}

function pascalCase(componentKey: string): string {
  return componentKey[0].toUpperCase() + componentKey.slice(1);
}

// ── categorize by token type ────────────────────────────────────────────────────

const CATEGORY_ORDER = [
  'TYPOGRAPHY',
  'COLOR',
  'RADIUS',
  'BORDER',
  'MOTION',
  'SPACING',
  'SIZE',
  'SHADOW',
  'OTHER',
] as const;
type Category = (typeof CATEGORY_ORDER)[number];

function categorize(tokenPath: string): Category {
  if (/fontSize|fontWeight|lineHeight/i.test(tokenPath)) return 'TYPOGRAPHY';
  if (/radius/i.test(tokenPath)) return 'RADIUS';
  if (/border-width/i.test(tokenPath)) return 'BORDER';
  if (/padding|gap|margin/i.test(tokenPath)) return 'SPACING';
  if (/height|width|thumb-size|(^|\.)size$/i.test(tokenPath)) return 'SIZE';
  if (/transition|duration/i.test(tokenPath)) return 'MOTION';
  if (/shadow/i.test(tokenPath)) return 'SHADOW';
  if (/color|overlay|fill|text|icon/i.test(tokenPath)) return 'COLOR';
  return 'OTHER';
}

function toKebab(s: string): string {
  return s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase().replace(/\./g, '-');
}

/**
 * Renders a full dotted token path as a short kebab-case name for the "Proposed Token"
 * column — e.g. `semantic.color.text.neutral` -> `color-text-neutral`,
 * `primitive.fontSize.xs` -> `font-size-xs`. Drops the `semantic.`/`primitive.` prefix
 * since the doc's prose already explains that distinction; the short name reads faster
 * in a dense table.
 */
function toShortTokenName(fullPath: string): string {
  return toKebab(fullPath.replace(/^(semantic|primitive)\./, ''));
}

/**
 * For a token with no existing match anywhere (an `NM` case not already reviewed via
 * `KNOWN_EXCEPTIONS`): proposes what a brand-new shared token could be called, mechanically,
 * from where it currently lives — e.g. `chip` + `fontSize.s` -> `chip-font-size-s`. This is
 * a starting point for a human decision, not a recommendation to actually add it as-is.
 */
function proposeNewName(componentKey: string, tokenPath: string): string {
  return toKebab(`${componentKey}.${tokenPath}`);
}

// ── split a token path into its property name and t-shirt size variant ─────────

const SIZE_KEYS = new Set(['xs', 's', 'm', 'l', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl']);

/**
 * Splits e.g. `height.s` -> { token: 'height', variant: 's' }, or `padding.x-l` (Button's
 * fused axis+size key) -> { token: 'padding-x', variant: 'l' } — same shape Chip's
 * `padding-x.m` already has, so both display identically here even before the underlying
 * JSON is unified. Anything whose trailing segment ISN'T a recognized size key (a sub-part
 * name like `title.fontWeight`, or a named gap like `gap.label`) is left untouched — those
 * aren't size variants, splitting them would misrepresent what the value means.
 */
function splitVariant(tokenPath: string): { token: string; variant: string } {
  const segments = tokenPath.split('.');
  const last = segments[segments.length - 1];

  if (SIZE_KEYS.has(last)) {
    return { token: segments.slice(0, -1).join('.'), variant: last };
  }

  const fused = last.match(/^([a-z0-9]+)-(xs|s|m|l|xl|2xl|3xl|4xl|5xl|6xl)$/i);
  if (fused) {
    const [, axisPrefix, size] = fused;
    const prefix = segments.slice(0, -1).join('.');
    return { token: prefix ? `${prefix}-${axisPrefix}` : axisPrefix, variant: size };
  }

  return { token: tokenPath, variant: '--' };
}

// ── classify every component.* leaf into one row ────────────────────────────────

type Row = {
  component: string;
  token: string;
  variant: string;
  flag: Flag;
  current: string;
  currentAlias: string;
  proposedToken: string;
  proposedValue: string;
};

const rows: Record<Category, Row[]> = {
  TYPOGRAPHY: [],
  COLOR: [],
  RADIUS: [],
  BORDER: [],
  MOTION: [],
  SPACING: [],
  SIZE: [],
  SHADOW: [],
  OTHER: [],
};

// ── Typography — matched against named Text Styles, not proposed as bare tokens ─────────────
//
// The Text Styles in scripts/text-styles.ts ARE Helix's semantic layer for typography — each
// combines primitive.fontSize + primitive.fontWeight (+ the paired semantic.lineHeight rung)
// under one role name, mirrored 1:1 in the Figma file (.ai/skills/tokens-to-figma.md → Phase 6).
// A component's fontSize/fontWeight pair either already matches one of those 16 (🚩 — reuse the
// existing name, never invent a standalone `semantic.fontSize.*`/`semantic.fontWeight.*` token)
// or it doesn't (🆕 — propose a new style name in the same `{Group} / {size} / {Weight}` shape).
//
// Hand-maintained group list, not inferred from the tree shape — "which sibling fontSize/
// fontWeight keys belong together as one typography usage" isn't mechanically derivable from
// tokens.json alone (e.g. PageHeader.title.fontSize has 2 size variants sharing ONE fontWeight).
// Same rule as KNOWN_EXCEPTIONS: a human call recorded once, not re-derived by a generic tree-walk
// every run.
type TypographyGroup = {
  component: string;
  /** dotted path under `component.{component}.` to the fontWeight leaf. */
  fontWeightPath: string;
  /** dotted path under `component.{component}.` to the fontSize leaf/variant-object. */
  fontSizePath: string;
};

const TYPOGRAPHY_GROUPS: TypographyGroup[] = [
  { component: 'badge', fontWeightPath: 'fontWeight', fontSizePath: 'fontSize' },
  { component: 'chip', fontWeightPath: 'fontWeight', fontSizePath: 'fontSize' },
  { component: 'navItem', fontWeightPath: 'fontWeight', fontSizePath: 'fontSize' },
  { component: 'pageHeader', fontWeightPath: 'title.fontWeight', fontSizePath: 'title.fontSize' },
  { component: 'pageHeader', fontWeightPath: 'description.fontWeight', fontSizePath: 'description.fontSize' },
  { component: 'table', fontWeightPath: 'header.fontWeight', fontSizePath: 'header.fontSize' },
  { component: 'table', fontWeightPath: 'cell.fontWeight', fontSizePath: 'cell.fontSize' },
  { component: 'button', fontWeightPath: 'fontWeight', fontSizePath: 'fontSize' },
  { component: 'avatar', fontWeightPath: 'fontWeight', fontSizePath: 'fontSize' },
];

/** The primitive key a `primitive.fontWeight.*`/`primitive.fontSize.*` alias points to, or null for a raw literal or non-matching alias. */
// Follows the alias chain (including through a semantic.textStyle.* composite's fontSize/
// fontWeight sub-property — e.g. component.badge.fontSize -> semantic.textStyle.caption-
// semibold.fontSize -> primitive.fontSize.s) down to the underlying primitive key, or null if
// the chain doesn't end on `primitive.{category}.*` (a raw literal, or a non-matching alias).
function primitiveKeyOf(value: unknown, category: 'fontWeight' | 'fontSize'): string | null {
  let current = value;
  const seen = new Set<string>();
  const prefix = `primitive.${category}.`;
  while (isAlias(current)) {
    const target = current.slice(1, -1);
    if (target.startsWith(prefix)) return target.slice(prefix.length);
    if (seen.has(target)) return null; // alias cycle — treat as unresolved rather than looping forever
    seen.add(target);
    current = getNode(target).$value;
  }
  return null;
}

/**
 * For a raw-literal fontSize with no primitive match (e.g. Chip's `13px`): the nearest
 * `primitive.fontSize.*` rung by absolute px distance, ties broken toward the smaller rung. Lets
 * an off-scale value still propose a real Text Style (clearly a target to snap to, not a false
 * exact match — the row stays 🆕, never 🚩, whenever this path is used).
 */
function nearestFontSizeKey(px: number): string {
  const entries = Object.entries(tokens.primitive.fontSize as Record<string, { $value: unknown; $type: string }>)
    .map(([key, node]) => [key, parseInt(toCss(node.$value, node.$type), 10)] as const);
  let best = entries[0];
  for (const entry of entries) {
    const [, bestPx] = best;
    const [, entryPx] = entry;
    const better = Math.abs(entryPx - px) < Math.abs(bestPx - px)
      || (Math.abs(entryPx - px) === Math.abs(bestPx - px) && entryPx < bestPx);
    if (better) best = entry;
  }
  return best[0];
}

/**
 * If a token's own $value aliases straight into a `semantic.textStyle.{key}` sub-property, returns
 * that style's key (e.g. 'caption-semibold'); otherwise null. Used to confirm a leaf is wired to
 * the Text Style itself, not just coincidentally matching one in resolved value (which primitive-
 * or raw-literal-backed tokens can also do, per the mechanical matching below).
 */
function directTextStyleKey(value: unknown): string | null {
  if (!isAlias(value)) return null;
  const target = value.slice(1, -1);
  const prefix = 'semantic.textStyle.';
  if (!target.startsWith(prefix)) return null;
  const rest = target.slice(prefix.length); // '{style-key}.fontSize' or '.fontWeight'
  return rest.slice(0, rest.lastIndexOf('.'));
}

type FontLeaf = { key: string | null; resolved: string; exact: boolean; styleKey: string | null };

/**
 * Reads a fontSize/fontWeight sub-path as either a single value (mapped under `'--'`) or a
 * size-variant object (mapped under each of its own keys) — the same "single or nested" shape
 * `component.*` tokens already use elsewhere (e.g. `height` vs `height.{s,m,l}`). Lets fontSize
 * and fontWeight vary independently: one can have size variants while the other stays a single
 * shared value (or, now, both can vary — see the pairing logic in `buildTypographyRows`).
 */
function readFontProp(path: string, category: 'fontWeight' | 'fontSize'): Map<string, FontLeaf> {
  const node = getNode(path);
  const toLeaf = (childNode: any, childPath: string): FontLeaf => {
    const resolved = resolveValue(childPath);
    const key = primitiveKeyOf(childNode.$value, category);
    const styleKey = directTextStyleKey(childNode.$value);
    if (key) return { key, resolved, exact: true, styleKey };
    // Raw literal off the primitive scale (e.g. Chip's old 13px fontSize) — snap fontSize to the
    // nearest rung so a Text Style can still be proposed; `exact: false` keeps this out of 🚩
    // (never a false "exact value match"). fontWeight has no such scale to snap onto — stays null.
    const snapped = category === 'fontSize' ? nearestFontSizeKey(parseInt(resolved, 10)) : null;
    return { key: snapped, resolved, exact: false, styleKey };
  };
  if ('$value' in node) return new Map([['--', toLeaf(node, path)]]);
  const map = new Map<string, FontLeaf>();
  for (const variant of Object.keys(node)) {
    map.set(variant, toLeaf(getNode(`${path}.${variant}`), `${path}.${variant}`));
  }
  return map;
}

function buildTypographyRows(): void {
  for (const g of TYPOGRAPHY_GROUPS) {
    const componentName = pascalCase(g.component);
    const subpart = g.fontSizePath?.includes('.') ? g.fontSizePath.split('.')[0]
      : g.fontWeightPath?.includes('.') ? g.fontWeightPath.split('.')[0]
      : null;
    const typeLabel = subpart ? `${subpart}.textStyle` : 'textStyle';

    const sizeMap = readFontProp(`component.${g.component}.${g.fontSizePath}`, 'fontSize');
    const weightMap = readFontProp(`component.${g.component}.${g.fontWeightPath}`, 'fontWeight');
    // Whichever side actually varies by size drives the row list — '--' alone if neither does, or
    // if BOTH do (their key sets must already agree; that's a human-maintained fact, not checked
    // here, same as the rest of TYPOGRAPHY_GROUPS).
    const variants = sizeMap.size > 1 ? [...sizeMap.keys()] : [...weightMap.keys()];

    for (const variant of variants) {
      const size = sizeMap.get(variant) ?? sizeMap.get('--')!;
      const weight = weightMap.get(variant) ?? weightMap.get('--')!;

      // Both halves alias straight into the SAME named semantic.textStyle.* — fully wired, nothing
      // to propose. Skip the row entirely, same as any other clean token elsewhere in this audit.
      if (weight.styleKey !== null && weight.styleKey === size.styleKey) continue;

      let flag: Flag;
      let proposedToken: string;
      let proposedValue: string;

      if (weight.key === null) {
        // fontWeight isn't a clean primitive.fontWeight.* alias — can't match a Text Style yet.
        flag = '🆕';
        proposedToken = proposeTextStyleName('regular', size.key!);
        proposedValue = size.resolved;
      } else {
        const match = size.exact ? findTextStyle(weight.key, size.key!) : undefined;
        flag = match ? '🚩' : '🆕';
        proposedToken = match ? match.name : proposeTextStyleName(weight.key, size.key!);
        proposedValue = `${size.resolved} / ${weight.key}`;
      }

      rows.TYPOGRAPHY.push({
        component: componentName,
        token: typeLabel,
        variant,
        flag,
        current: size.resolved,
        currentAlias: size.exact ? toShortTokenName(`primitive.fontSize.${size.key}`) : `raw literal (nearest: ${size.key})`,
        proposedToken,
        proposedValue,
      });
    }
  }
}

buildTypographyRows();

const componentLeaves = collectLeaves(tokens.component, ['component']);

for (const leaf of componentLeaves) {
  const [, componentKey, ...tokenParts] = leaf.path.split('.');
  const tokenPath = tokenParts.join('.');
  const exceptionKey = `${componentKey}.${tokenPath}`;
  const componentName = pascalCase(componentKey);
  const known = KNOWN_EXCEPTIONS[exceptionKey];
  const category = categorize(tokenPath);

  // Per CLAUDE.md's token policy, min-/max-width is deliberately never tokenized — it's
  // decided by the consumer/component/pattern in use, not a gap to fix. Height (and
  // height-shaped `size` props like Checkbox/Radio) stay in this audit; width doesn't.
  if (category === 'SIZE' && /width/i.test(tokenPath)) continue;

  // Typography gets its own pass below (buildTypographyRows) — a fontSize/fontWeight PAIR
  // matched against the named Text Styles, not a single property proposed in isolation.
  if (category === 'TYPOGRAPHY') continue;

  if (isAlias(leaf.value)) {
    const target = leaf.value.slice(1, -1);
    if (target.startsWith('semantic.')) continue; // clean — fully semantic-aliased
    if (!target.startsWith('primitive.')) continue; // alias into component.* itself etc — not this audit's concern

    const primitiveCategory = target.split('.')[1];
    const resolved = resolveValue(leaf.path);

    let flag: Flag;
    let proposedToken: string;
    let proposedValue: string;
    if (known) {
      flag = '✅';
      proposedToken = REASON_TEXT[known.tag];
      proposedValue = resolved; // ✅ = reviewed and kept — its current value, not "--", is the fact worth showing.
    } else {
      const match = findMatchingValue(`semantic.${primitiveCategory}`, resolved);
      if (match) {
        flag = '🚩';
        proposedToken = toShortTokenName(match);
        proposedValue = resolved;
      } else {
        flag = '🆕';
        proposedToken = proposeNewName(componentKey, tokenPath);
        proposedValue = resolved;
      }
    }

    const { token: displayToken, variant } = splitVariant(tokenPath);
    // What this token is CURRENTLY nested under — the primitive it already aliases, by name
    // (not just the resolved px/number in "Current Value"). This is the answer to "which
    // token is this nested to", independent of whether that nesting is judged ✅/🚩/🆕 below.
    rows[category].push({ component: componentName, token: displayToken, variant, flag, current: resolved, currentAlias: toShortTokenName(target), proposedToken, proposedValue });
    continue;
  }

  // raw literal — no alias at all, so there's nothing to report in "Current Alias"
  const literal = String(leaf.value);
  let flag: Flag;
  let proposedToken: string;
  let proposedValue: string;
  if (known) {
    flag = '✅';
    proposedToken = REASON_TEXT[known.tag];
    proposedValue = literal; // ✅ = reviewed and kept — its current value, not "--", is the fact worth showing.
  } else {
    const match = findMatchingPrimitive(tokenPath, literal);
    if (match) {
      flag = '🚩';
      proposedToken = toShortTokenName(match);
      proposedValue = literal;
    } else {
      flag = '🆕';
      proposedToken = proposeNewName(componentKey, tokenPath);
      proposedValue = literal;
    }
  }

  const { token: displayToken, variant } = splitVariant(tokenPath);
  rows[category].push({ component: componentName, token: displayToken, variant, flag, current: literal, currentAlias: 'raw literal', proposedToken, proposedValue });
}

const SIZE_ORDER = [...SIZE_KEYS];

for (const category of CATEGORY_ORDER) {
  rows[category].sort((a, b) => {
    const byComponentToken = (a.component + a.token).localeCompare(b.component + b.token);
    if (byComponentToken !== 0) return byComponentToken;
    const ai = SIZE_ORDER.indexOf(a.variant);
    const bi = SIZE_ORDER.indexOf(b.variant);
    if (ai !== -1 && bi !== -1) return ai - bi; // logical xs/s/m/l/xl order, not alphabetical
    return a.variant.localeCompare(b.variant);
  });
}

// ── render as a fixed-width ASCII box table ─────────────────────────────────────

// The 3 flag emoji (✅🚩🆕) render as 2 terminal columns wide in a monospace font, but
// JS string .length doesn't agree (surrogate-pair code points, or a variation selector) —
// using .length for column math here would throw the whole table's alignment off by one
// wherever a flag appears. displayWidth/padEndVisual measure and pad by rendered width instead.
function displayWidth(s: string): number {
  let width = 0;
  for (const ch of s) {
    width += /[\u{2600}-\u{27BF}\u{1F000}-\u{1FFFF}]/u.test(ch) ? 2 : 1;
  }
  return width;
}

function padEndVisual(s: string, targetWidth: number): string {
  return s + ' '.repeat(Math.max(0, targetWidth - displayWidth(s)));
}

const HEADERS = ['Component', 'Type', 'Size', 'Proposed Token', 'Proposed Value'] as const;

const allRows = CATEGORY_ORDER.flatMap(c => rows[c]);
// The flag now prefixes "Proposed Token" instead of a separate "Current Value" column — it's the
// outcome column, so that's where ✅/🚩/🆕 belongs. `current`/`currentAlias` (what the token is nested
// to today) still drive the classification above; they're just not rendered as their own column here.
const proposedTokenCell = (r: Row) => `${r.flag} ${r.proposedToken}`;
const widths = [
  Math.max(HEADERS[0].length, ...allRows.map(r => r.component.length)),
  Math.max(HEADERS[1].length, ...allRows.map(r => r.token.length)),
  Math.max(HEADERS[2].length, ...allRows.map(r => r.variant.length)),
  Math.max(HEADERS[3].length, ...allRows.map(r => displayWidth(proposedTokenCell(r)))),
  Math.max(HEADERS[4].length, ...allRows.map(r => r.proposedValue.length)),
];

function hline(ch = '-'): string {
  return '+' + widths.map(w => ch.repeat(w + 2)).join('+') + '+';
}

function rowLine(cells: readonly string[]): string {
  return '| ' + cells.map((c, i) => padEndVisual(c, widths[i])).join(' | ') + ' |';
}

function categoryDivider(name: string): string {
  const innerWidth = widths.reduce((sum, w) => sum + w + 3, 0) - 1;
  const label = ` ${name} `;
  const padTotal = innerWidth - label.length;
  const padLeft = Math.floor(padTotal / 2);
  const padRight = padTotal - padLeft;
  return '+' + '-'.repeat(padLeft) + label + '-'.repeat(padRight) + '+';
}

const lines: string[] = [];
lines.push(hline());
lines.push(rowLine(HEADERS));
lines.push(hline('='));
for (const category of CATEGORY_ORDER) {
  if (rows[category].length === 0) continue;
  lines.push(categoryDivider(category));
  for (const r of rows[category]) {
    lines.push(rowLine([r.component, r.token, r.variant, proposedTokenCell(r), r.proposedValue]));
  }
  lines.push(hline());
}

const asciiTable = '```\n' + lines.join('\n') + '\n```';

// ── splice into the doc between <!-- AUTO:ASCII_TABLE --> ... <!-- /AUTO --> markers ──

let doc = fs.readFileSync(docPath, 'utf-8');
const re = /(<!-- AUTO:ASCII_TABLE -->\n)([\s\S]*?)(\n<!-- \/AUTO -->)/;

if (!re.test(doc)) {
  console.error(`❌ Missing <!-- AUTO:ASCII_TABLE --> marker in ${path.relative(process.cwd(), docPath)}`);
  process.exit(1);
}

const newDoc = doc.replace(re, `$1${asciiTable}$3`);

if (doc !== newDoc) {
  fs.writeFileSync(docPath, newDoc);
  console.log(`✅ Regenerated ${path.relative(process.cwd(), docPath)} from tokens.json`);
} else {
  console.log(`✅ ${path.relative(process.cwd(), docPath)} already matches tokens.json — 0 changes`);
}
