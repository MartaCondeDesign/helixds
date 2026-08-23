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

const tokensPath = path.resolve(import.meta.dirname, '../packages/tokens/src/tokens.json');
const docPath = path.resolve(import.meta.dirname, '../.ai/maps/component-token-exceptions.md');

const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));

// Categories that structurally exist under `semantic.*` but aren't a flat, directly
// comparable role layer for this audit's purposes:
//  - fontSize: only holds `mobile` breakpoint overrides, not a flat xs/s/m/l/xl role layer
//  - fontWeight: no semantic.fontWeight at all
const NO_FLAT_SEMANTIC_LAYER = new Set(['fontSize', 'fontWeight']);

type KnownTag = 'ADR' | 'FE' | 'NM';

// Human judgment calls — the only hand-maintained data in this script. Add an entry
// here when you consciously decide a token is a legitimate exception that the
// mechanical rules below would otherwise mis-tag.
const KNOWN_EXCEPTIONS: Record<string, { tag: KnownTag; showAlias?: boolean }> = {
  'badge.height.xs': { tag: 'ADR' },
  'badge.height.s': { tag: 'ADR' },
  'chip.height.s': { tag: 'ADR' },
  'chip.height.m': { tag: 'ADR' },
  'topBar.height': { tag: 'FE', showAlias: true }, // beyond semantic.size's top rung — the alias itself is the proposal
  'dialog.overlay': { tag: 'NM' }, // one-off backdrop color, no reusable semantic role
  // Note: `*.width` tokens (SideNav.width, etc.) never reach this map — they're skipped
  // entirely below, per CLAUDE.md's token policy that width is deliberately not tokenized.
};

// ── tokens.json helpers ─────────────────────────────────────────────────────────

function getNode(dottedPath: string): any {
  let node: any = tokens;
  for (const key of dottedPath.split('.')) {
    node = node?.[key];
    if (node === undefined) throw new Error(`Path not found in tokens.json: ${dottedPath}`);
  }
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
  return String(value); // fontWeight etc. store $value as a JSON number, not a string
}

type Leaf = { path: string; value: unknown };

function collectLeaves(node: any, prefix: string[]): Leaf[] {
  if (node === null || typeof node !== 'object') return [];
  if ('$value' in node) return [{ path: prefix.join('.'), value: node.$value }];
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

/**
 * Renders a full dotted token path as a short kebab-case name for the "Proposed Token"
 * column — e.g. `semantic.color.text.neutral` -> `color-text-neutral`,
 * `primitive.fontSize.xs` -> `font-size-xs`. Drops the `semantic.`/`primitive.` prefix
 * since the doc's prose already explains that distinction; the short name reads faster
 * in a dense table.
 */
function toShortTokenName(fullPath: string): string {
  return fullPath
    .replace(/^(semantic|primitive)\./, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/\./g, '-');
}

// ── classify every component.* leaf into one row ────────────────────────────────

type Row = { component: string; token: string; current: string; proposed: string };

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

  if (isAlias(leaf.value)) {
    const target = leaf.value.slice(1, -1);
    if (target.startsWith('semantic.')) continue; // clean — fully semantic-aliased
    if (!target.startsWith('primitive.')) continue; // alias into component.* itself etc — not this audit's concern

    const primitiveCategory = target.split('.')[1];
    const resolved = resolveValue(leaf.path);

    let proposed: string;
    if (known) {
      proposed = known.showAlias ? `${toShortTokenName(target)} (${resolved}) ${known.tag}` : `-- ${known.tag}`;
    } else if (NO_FLAT_SEMANTIC_LAYER.has(primitiveCategory) || !(primitiveCategory in tokens.semantic)) {
      proposed = '-- SS';
    } else {
      const match = findMatchingValue(`semantic.${primitiveCategory}`, resolved);
      proposed = match ? `${toShortTokenName(match)} (${resolved})` : '-- NM';
    }

    rows[category].push({ component: componentName, token: tokenPath, current: resolved, proposed });
    continue;
  }

  // raw literal — no alias at all
  const literal = String(leaf.value);
  let proposed: string;
  if (known) {
    proposed = `-- ${known.tag}`;
  } else {
    const match = findMatchingPrimitive(tokenPath, literal);
    proposed = match ? `${toShortTokenName(match)} (${literal})` : '-- NM';
  }

  rows[category].push({ component: componentName, token: tokenPath, current: literal, proposed });
}

for (const category of CATEGORY_ORDER) {
  rows[category].sort((a, b) => (a.component + a.token).localeCompare(b.component + b.token));
}

// ── render as a fixed-width ASCII box table ─────────────────────────────────────

const HEADERS = ['Component', 'Token', 'Current Value', 'Proposed Token'] as const;

const allRows = CATEGORY_ORDER.flatMap(c => rows[c]);
const widths = [
  Math.max(HEADERS[0].length, ...allRows.map(r => r.component.length)),
  Math.max(HEADERS[1].length, ...allRows.map(r => r.token.length)),
  Math.max(HEADERS[2].length, ...allRows.map(r => r.current.length)),
  Math.max(HEADERS[3].length, ...allRows.map(r => r.proposed.length)),
];

function hline(ch = '-'): string {
  return '+' + widths.map(w => ch.repeat(w + 2)).join('+') + '+';
}

function rowLine(cells: readonly [string, string, string, string]): string {
  return '| ' + cells.map((c, i) => c.padEnd(widths[i])).join(' | ') + ' |';
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
    lines.push(rowLine([r.component, r.token, r.current, r.proposed]));
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
