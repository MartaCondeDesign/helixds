/**
 * Regenerates the auto-generated tables inside .ai/maps/component-token-exceptions.md
 * from the current state of packages/tokens/src/tokens.json.
 *
 * Every `component.*` leaf token is classified:
 *  - aliases `semantic.*`            -> clean, not listed anywhere
 *  - matches a KNOWN_EXCEPTIONS entry -> routed to that entry's documented bucket
 *    (this is the one place a human judgment call — "this is an intentional ADR-004
 *    density exception", "this is a one-off color" — gets recorded; everything else
 *    below is inferred purely from the data)
 *  - aliases `primitive.*` directly, category has no flat semantic layer -> NO_SEMANTIC_LAYER
 *  - aliases `primitive.*` directly, a same-category semantic token exists -> GAP
 *    (lists the matching rung if the resolved value matches one exactly, otherwise
 *    notes that no rung matches)
 *  - raw literal (no alias at all) -> RAW_LITERAL (proposes a same-value primitive
 *    alias if one exists)
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

type Bucket = 'ADR004' | 'BEYOND_LADDER' | 'RAW_NO_SCALE' | 'ONE_OFF_COLOR';

// Human judgment calls — the only hand-maintained data in this script. Add an entry
// here when you consciously decide a token is a legitimate exception that the
// mechanical rules below would otherwise mis-bucket (or miss the "why" for).
const KNOWN_EXCEPTIONS: Record<string, { bucket: Bucket; why: string }> = {
  'badge.height-xs': { bucket: 'ADR004', why: 'ADR-004 density exception, not the control ladder' },
  'badge.height-s': { bucket: 'ADR004', why: 'ADR-004 density exception, not the control ladder' },
  'chip.height-s': { bucket: 'ADR004', why: 'ADR-004 density exception, not the control ladder' },
  'chip.height-m': { bucket: 'ADR004', why: 'ADR-004 density exception, not the control ladder' },
  'topBar.height': {
    bucket: 'BEYOND_LADDER',
    why: "Past semantic.size's top rung (xl=48px) — next rung up on the same primitive scale",
  },
  'sideNav.width': {
    bucket: 'RAW_NO_SCALE',
    why: 'Standalone chrome dimension — no matching primitive/spacing/size rung',
  },
  'dialog.overlay': {
    bucket: 'ONE_OFF_COLOR',
    why: 'One-off backdrop color, no reusable semantic role exists for it',
  },
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
  return value;
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

// ── classify every component.* leaf ─────────────────────────────────────────────

type Row = { component: string; token: string; a: string; b: string };

const noSemanticLayer: Row[] = [];
const adr004: Row[] = [];
const beyondLadder: Row[] = [];
const rawNoScale: Row[] = [];
const gap: Row[] = [];
const rawLiteral: Row[] = [];
const oneOffColor: Row[] = [];

const componentLeaves = collectLeaves(tokens.component, ['component']);

for (const leaf of componentLeaves) {
  const [, componentKey, ...tokenParts] = leaf.path.split('.');
  const tokenPath = tokenParts.join('.');
  const exceptionKey = `${componentKey}.${tokenPath}`;
  const componentName = pascalCase(componentKey);
  const known = KNOWN_EXCEPTIONS[exceptionKey];

  if (isAlias(leaf.value)) {
    const target = leaf.value.slice(1, -1);
    if (target.startsWith('semantic.')) continue; // clean — fully semantic-aliased

    if (!target.startsWith('primitive.')) continue; // alias into component.* itself etc — not this audit's concern

    const category = target.split('.')[1];
    const resolved = resolveValue(leaf.path);

    if (known) {
      const row = { component: componentName, token: tokenPath, a: target, b: known.why };
      if (known.bucket === 'ADR004') adr004.push(row);
      else if (known.bucket === 'BEYOND_LADDER') beyondLadder.push(row);
      continue;
    }

    if (NO_FLAT_SEMANTIC_LAYER.has(category) || !(category in tokens.semantic)) {
      noSemanticLayer.push({
        component: componentName,
        token: tokenPath,
        a: target,
        b: `No semantic.${category} role layer`,
      });
      continue;
    }

    const match = findMatchingValue(`semantic.${category}`, resolved);
    gap.push({
      component: componentName,
      token: tokenPath,
      a: target,
      b: match ?? `*(no matching rung — closest primitive value is ${resolved})*`,
    });
    continue;
  }

  // raw literal — no alias at all
  const literal = String(leaf.value);

  if (known) {
    const row = { component: componentName, token: tokenPath, a: literal, b: known.why };
    if (known.bucket === 'RAW_NO_SCALE') rawNoScale.push(row);
    else if (known.bucket === 'ONE_OFF_COLOR') oneOffColor.push(row);
    continue;
  }

  const match = findMatchingPrimitive(tokenPath, literal);
  rawLiteral.push({
    component: componentName,
    token: tokenPath,
    a: literal,
    b: match ? `\`${match}\`` : '*(none — no matching primitive value)*',
  });
}

// ── render ───────────────────────────────────────────────────────────────────────

function sortRows(rows: Row[]): Row[] {
  return [...rows].sort((x, y) => (x.component + x.token).localeCompare(y.component + y.token));
}

function table(headers: [string, string, string, string], rows: Row[]): string {
  if (rows.length === 0) return '*(none currently)*\n';
  const head = `| ${headers[0]} | ${headers[1]} | ${headers[2]} | ${headers[3]} |`;
  const sep = '|---|---|---|---|';
  const body = sortRows(rows)
    .map(r => `| ${r.component} | \`${r.token}\` | ${r.a} | ${r.b} |`)
    .join('\n');
  return `${head}\n${sep}\n${body}\n`;
}

const sections: Record<string, string> = {
  NO_SEMANTIC_LAYER: table(['Component', 'Token', 'Aliases', 'Why'], noSemanticLayer),
  ADR004: table(['Component', 'Token', 'Aliases', 'Why'], adr004),
  BEYOND_LADDER: table(['Component', 'Token', 'Aliases', 'Why'], beyondLadder),
  RAW_NO_SCALE: table(['Component', 'Token', 'Value', 'Note'], rawNoScale),
  GAP: table(['Component', 'Token', 'Currently aliases', 'Matching semantic rung'], gap),
  RAW_LITERAL: table(['Component', 'Token', 'Hardcoded value', 'Proposed token'], rawLiteral),
  ONE_OFF_COLOR: table(['Component', 'Token', 'Value', 'Why'], oneOffColor),
};

// ── splice into the doc between <!-- AUTO:NAME --> ... <!-- /AUTO --> markers ──────

let doc = fs.readFileSync(docPath, 'utf-8');
let missing: string[] = [];

for (const [name, content] of Object.entries(sections)) {
  const re = new RegExp(`(<!-- AUTO:${name} -->\\n)([\\s\\S]*?)(\\n<!-- /AUTO -->)`);
  if (!re.test(doc)) {
    missing.push(name);
    continue;
  }
  doc = doc.replace(re, `$1${content.trimEnd()}$3`);
}

if (missing.length > 0) {
  console.error(`❌ Missing marker(s) in ${path.relative(process.cwd(), docPath)}: ${missing.join(', ')}`);
  process.exit(1);
}

const before = fs.readFileSync(docPath, 'utf-8');
if (before !== doc) {
  fs.writeFileSync(docPath, doc);
  console.log(`✅ Regenerated ${path.relative(process.cwd(), docPath)} from tokens.json`);
} else {
  console.log(`✅ ${path.relative(process.cwd(), docPath)} already matches tokens.json — 0 changes`);
}
