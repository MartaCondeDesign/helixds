/**
 * Generates .ai/maps/figma-map.md — a map of how each Helix component prop
 * translates to a Figma property (kind, name, value mapping), plus the
 * anatomy layers extracted from each component's data-helix-part attributes.
 *
 * This file is GENERATED — do not hand-edit the per-component sections.
 * The standard section at the top is generated from contracts/figma-conversion.json.
 * Run: pnpm docs:figma-map
 * Wired into .husky/pre-commit so it can never drift from contracts.
 */
import fs from 'fs';
import path from 'path';

const root         = path.resolve(import.meta.dirname, '..');
const contractsDir = path.join(root, 'contracts/components');
const componentsDir = path.join(root, 'packages/core/src/components');
const outPath      = path.join(root, '.ai/maps/figma-map.md');

// Prop names whose string type maps to TEXT in Figma
const TEXT_PROP_NAMES = new Set([
  'children', 'label', 'description', 'placeholder', 'title', 'text',
  'caption', 'subtitle', 'heading', 'content', 'helper', 'errorMessage', 'helperText',
]);

// Prop names that are icon slots → BOOLEAN (visibility of an icon instance layer)
const ICON_PROP_NAMES = new Set(['icon', 'iconEnd', 'iconStart']);

type FigmaKind = 'VARIANT' | 'BOOLEAN' | 'TEXT' | 'ICON_SLOT' | 'OPTIONAL_TEXT';

// Optional text that is always there when the component renders, so it's content, not a show/hide part.
const ALWAYS_SHOWN_TEXT = new Set(['placeholder']);
// Prop → the data-helix-part suffix that renders it, when it isn't just the prop in kebab-case.
const PART_SUFFIX: Record<string, string> = { errorMessage: 'error' };

interface PropRow {
  name: string;
  codeType: string;
  figmaKind: FigmaKind;
  figmaProperty: string;
  values: string;
}

interface Prop {
  name: string;
  type?: string;
  description?: string;
  default?: unknown;
  required?: boolean;
}

interface Contract {
  name: string;
  version: string;
  status?: string;
  props?: Prop[];
}

function inferFigmaKind(propName: string, codeType: string, required = false, anatomyParts: string[] = []): FigmaKind | null {
  // Skip: event handlers, refs, complex React types
  if (
    codeType.includes('EventHandler') ||
    codeType.includes('MouseEvent') ||
    codeType.includes('React.') ||
    codeType.includes('Ref<') ||
    codeType.includes('RefObject') ||
    codeType.startsWith('(') ||
    codeType.includes('=>')
  ) return null;

  // Icon props → BOOLEAN (is it shown) + INSTANCE_SWAP (which icon), per components-to-figma.md
  if (ICON_PROP_NAMES.has(propName) || codeType.includes('TablerIcon') || codeType.includes('HelixIconComponent')) {
    return 'ICON_SLOT';
  }

  // disabled is a VARIANT (disabled=false / disabled=true), not a BOOLEAN — components-to-figma.md's
  // "Disabled state rule": a BOOLEAN can't express the visual change.
  if (propName === 'disabled') return 'VARIANT';

  // Boolean
  if (codeType === 'boolean' || codeType === 'boolean | undefined') return 'BOOLEAN';

  // String union → VARIANT: all segments are single-quoted literals
  if (codeType.includes("'") && codeType.includes('|')) {
    const segments = codeType.split('|').map(s => s.trim());
    if (segments.every(s => /^'[^']+'$/.test(s))) return 'VARIANT';
  }

  // Label-like string props → TEXT. An OPTIONAL one is a show/hide part (show-hide-parts.md): passing it
  // shows the part, leaving it out hides it — so in Figma it's a BOOLEAN named like the prop (visibility)
  // plus a TEXT "<prop> text" (content), the same pairing icons use (BOOLEAN + INSTANCE_SWAP).
  if (TEXT_PROP_NAMES.has(propName) && (codeType === 'string' || codeType.startsWith('string'))) {
    const optional = !required || codeType.includes('undefined');
    // Only a VISIBLE part counts — Icon's `label` and Chart's `description` are aria-only text, no layer.
    const partSuffix = PART_SUFFIX[propName] ?? propName.replace(/[A-Z]/g, c => '-' + c.toLowerCase());
    const visible = anatomyParts.some(part => part.endsWith('-' + partSuffix));
    return optional && visible && !ALWAYS_SHOWN_TEXT.has(propName) ? 'OPTIONAL_TEXT' : 'TEXT';
  }

  return null;
}

const layoutDir = path.join(root, 'packages/core/src/layout');

// Real data-helix-part elements that are never visible, so never a Figma layer: the visually hidden
// native inputs behind custom controls (the visible part is checkbox-control / radio-control) and
// Select's invisible form-participation input.
const HIDDEN_PARTS = new Set(['checkbox-input', 'radio-input', 'select-native']);

function extractAnatomyParts(contractName: string): string[] {
  const candidates = [
    path.join(componentsDir, contractName, `${contractName}.tsx`),
    path.join(layoutDir, contractName, `${contractName}.tsx`),
  ];
  const tsxPath = candidates.find(p => fs.existsSync(p));
  if (!tsxPath) return [];
  const src = fs.readFileSync(tsxPath, 'utf-8');
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const m of src.matchAll(/data-helix-part="([^"]+)"/g)) {
    if (HIDDEN_PARTS.has(m[1]!)) continue;
    if (!seen.has(m[1]!)) { seen.add(m[1]!); parts.push(m[1]!); }
  }
  return parts;
}

// Figma values = code values, unchanged (components-to-figma.md naming rule: `variant=primary`, never
// `Variant=Primary`). disabled is the one boolean expressed as a VARIANT.
function variantValues(propName: string, codeType: string): string {
  if (propName === 'disabled') return '`false`, `true`';
  return codeType
    .split('|')
    .map(s => s.trim().replace(/'/g, ''))
    .filter(v => v !== 'undefined')
    .map(v => `\`${v}\``)
    .join(', ');
}

import { expectedFor, setComponent, patternOf, STANDARD, type Expected, whyNone } from './figma/prop-rule.ts';

type FigmaProp = { name: string; type: string; values?: string[] };
const snapshotPath = path.join(root, '.ai/figma-props.json');
const snapshot: Record<string, { properties: FigmaProp[] }> = fs.existsSync(snapshotPath) ? JSON.parse(fs.readFileSync(snapshotPath, 'utf-8')).components : {};

function compare(e: Expected, figma: FigmaProp[] | undefined): string {
  if (!figma) return '✗ not in Figma';
  const same = figma.find(f => f.name === e.name && f.type === e.type);
  if (same && (e.type !== 'VARIANT' || JSON.stringify([...(same.values ?? [])].sort()) === JSON.stringify([...(e.values ?? [])].sort()))) return '✓';
  if (same) return `✗ values ${(same.values ?? []).join(' / ')}`;
  const byName = figma.find(f => f.name === e.name);
  if (byName) return `✗ is ${byName.type}${byName.values ? ` (${byName.values.join(' / ')})` : ''}`;
  const inState = figma.find(f => f.type === 'VARIANT' && (f.values ?? []).includes(e.name));
  if (inState) return `✗ a value of \`${inState.name}\``;
  return '✗ missing';
}

// Generated from the standard, so the two can never disagree.
const CONVENTIONS = [
  '## Code prop → Figma property: the standard',
  '',
  `From \`contracts/figma-conversion.json\` v${STANDARD.version} (owner-approved ${STANDARD.approved}; explained with the`,
  'common patterns in `.ai/maps/figma-conversion.md`). Every row below says which rule produced it; a component',
  "only needs its own approval for an exception (its contract's `figma.propertyMap`). The one Figma-only property",
  'is `state` (CSS pseudo-classes) — `disabled`, `invalid`, `checked`… are never in it.',
  '',
  '| Rule | When | Figma property | Why |',
  '|---|---|---|---|',
  ...(STANDARD.rules as any[]).map(r => `| \`${r.id}\` | ${r.when.replace(/\|/g, '\\|')} | ${r.figma.length ? r.figma.map((f: string) => `\`${f}\``).join(' + ') : '—'} | ${r.why} |`),
  '',
  ...Object.values((STANDARD as any).naming as Record<string, string>).map(n => `- ${n}`),
  '- **Figma today** is read from `.ai/figma-props.json` (a snapshot of the Figma file — refresh it through the',
  '  Figma MCP after changing a component in Figma, then `pnpm docs:figma-map`).',
].join('\n');

function run() {
  const contractFiles = fs.readdirSync(contractsDir).filter(f => f.endsWith('.json')).sort();
  const sections: string[] = [];
  // Machine-readable twin (.ai/maps/figma-map.json): per component, per code prop, the Figma property it becomes —
  // or codeOnly + why. Storybook shows it on every prop (preview.tsx argTypesEnhancers).
  type Conv = { description?: string; figma: { name: string; type: string; values?: string[] }[] | null; codeOnly: boolean; rule: string; why: string };
  const jsonMap: Record<string, Record<string, Conv>> = {};
  const plain = (t: string) => t.replace(/\*\*/g, '').replace(/\s*·\s*`[^`]+`$/, '').replace(/`/g, '');
  let total = 0, ok = 0;
  for (const file of contractFiles) {
    const contract = JSON.parse(fs.readFileSync(path.join(contractsDir, file), 'utf-8')) as Contract;
    setComponent(contract.name, contract as any);
    const parts = extractAnatomyParts(contract.name);
    const figma = snapshot[contract.name]?.properties;
    const rows: string[] = [];
    const used = new Set<string>();
    for (const prop of contract.props ?? []) {
      // The standard (contracts/figma-conversion.json) decides; a contract exception (figma.propertyMap) overrides it.
      const exception = (contract as any).figma?.propertyMap?.[prop.name];
      const list: Expected[] = exception
        ? exception.figma.map((f: Expected) => ({ ...f, why: exception.codeType === (prop.type ?? '') ? `exception, approved ${exception.approved}${exception.reason ? ` — ${exception.reason}` : ''}` : '**stale exception** (pnpm figma:props)' }))
        : expectedFor(prop, parts).map(e => ({ ...e, why: e.rule === 'unmatched' ? `**${e.why}**` : `${e.why} · \`${e.rule}\`` }));
      const conv = (jsonMap[contract.name] ??= {});
      if (!list.length) {
        const why = exception ? `${exception.reason ?? ''} (approved ${exception.approved})` : whyNone(prop);
        conv[prop.name] = { description: prop.description, figma: null, codeOnly: true, rule: exception ? 'exception' : (whyNone(prop).match(/`([^`]+)`$/)?.[1] ?? 'skip'), why: plain(why) };
      } else conv[prop.name] = { description: prop.description, figma: list.map(e => ({ name: e.name, type: e.type, ...(e.values ? { values: e.values } : {}) })), codeOnly: false, rule: exception ? 'exception' : list[0].rule ?? '', why: list.map(e => plain(e.why)).filter((w, i, a) => a.indexOf(w) === i).join(' · ') };
      if (!list.length) rows.push(`| \`${prop.name}\` | \`${(prop.type ?? '').replace(/\|/g, '\\|')}\` | — no Figma property | ${exception ? `exception, approved ${exception.approved}${exception.reason ? ` — ${exception.reason}` : ''}` : whyNone(prop)} | — |`);
      for (const e of list) {
        const status = compare(e, figma);
        total++; if (status === '✓') ok++;
        const m = figma?.find(f => f.name === e.name && f.type === e.type); if (m) used.add(m.name + m.type);
        const fig = e.type === 'VARIANT' ? `\`${e.name}\` = ${e.values!.map(v => `\`${v}\``).join(' / ')}` : `\`${e.name}\``;
        rows.push(`| \`${prop.name}\` | \`${(prop.type ?? '').replace(/\|/g, '\\|')}\` | \`${e.type}\` ${fig} | ${e.why} | ${status} |`);
      }
    }
    // exceptions for a native attribute the component passes through (no prop of that name in the contract)
    for (const [name, ex] of Object.entries(((contract as any).figma?.propertyMap ?? {}) as Record<string, any>)) {
      if ((contract.props ?? []).some(p => p.name === name)) continue;
      for (const e of ex.figma as Expected[]) {
        const status = compare(e, figma);
        total++; if (status === '✓') ok++;
        const m = figma?.find(f => f.name === e.name && f.type === e.type); if (m) used.add(m.name + m.type);
        const fig = e.type === 'VARIANT' ? `\`${e.name}\` = ${e.values!.map(v => `\`${v}\``).join(' / ')}` : `\`${e.name}\``;
        rows.push(`| \`${name}\` (native) | \`${ex.codeType.replace(/\|/g, '\\|')}\` | \`${e.type}\` ${fig} | exception, approved ${ex.approved}${ex.reason ? ` — ${ex.reason}` : ''} | ${status} |`);
      }
    }
    // Property order (contracts/figma-conversion.json → propertyOrder): the code order, as Storybook's Controls list it.
    // Figma always shows VARIANT properties first, so each group is compared on its own; state closes the variants.
    const expected = rows.map(r => r.match(/\| `(?:VARIANT|BOOLEAN|TEXT|INSTANCE_SWAP)` `([^`]+)`/)?.[1]).filter(Boolean) as string[];
    const kind = (n: string) => figma?.find(f => f.name === n)?.type;
    const dedupe = (a: string[]) => [...new Set(a)];
    const want = { variants: [...dedupe(expected.filter(n => kind(n) === 'VARIANT')), ...(figma?.some(f => f.name === 'state') ? ['state'] : [])], others: dedupe(expected.filter(n => kind(n) && kind(n) !== 'VARIANT')) };
    const have = { variants: (figma ?? []).filter(f => f.type === 'VARIANT' && want.variants.includes(f.name)).map(f => f.name), others: (figma ?? []).filter(f => f.type !== 'VARIANT' && want.others.includes(f.name)).map(f => f.name) };
    const orderOk = JSON.stringify(want) === JSON.stringify(have);
    const orderLine = figma && expected.length ? `\n\n**Property order:** ${orderOk ? '✓ same as code' : `✗ Figma ${[...have.variants, '·', ...have.others].join(', ')} — code ${[...want.variants, '·', ...want.others].join(', ')}`}` : '';
    if (figma && expected.length) { total++; if (orderOk) ok++; }
    const extra = (figma ?? []).filter(f => !used.has(f.name + f.type) && f.name !== 'state');
    const table = rows.length
      ? `| Code prop | Code type | Figma property | Why | Figma today |\n|---|---|---|---|---|\n${rows.join('\n')}`
      : '_No design props._';
    // A Figma property with no code prop breaks rule 16 unless the owner approved it (contract figma.figmaOnly).
    const figmaOnly = ((contract as any).figma?.figmaOnly ?? {}) as Record<string, { approved?: string; reason?: string }>;
    const extraOk = extra.filter(f => figmaOnly[f.name]?.approved);
    const extraBad = extra.filter(f => !figmaOnly[f.name]?.approved);
    const fmt = (f: { name: string; type: string; values?: string[] }) => `\`${f.name}\` (${f.type}${f.values ? ': ' + f.values.join(' / ') : ''})`;
    const extraLine = (extraBad.length ? `\n\n**Only in Figma:** ✗ ${extraBad.map(fmt).join(', ')} — no code prop of that name and type (rule 16): rename it to the code prop, remove it, or record an approved exception in the contract's \`figma.figmaOnly\`` : '')
      + (extraOk.length ? `\n\n**Only in Figma (approved):** ${extraOk.map(f => `${fmt(f)} — ${figmaOnly[f.name].reason} (approved ${figmaOnly[f.name].approved})`).join('; ')}` : '');
    const stateLine = figma?.find(f => f.name === 'state') ? `\n\n**Figma-only \`state\`:** ${figma.find(f => f.name === 'state')!.values!.map(v => `\`${v}\``).join(' / ')}` : '';
    const anatomy = parts.length ? `\n\n**Anatomy layers** (Figma layer name = \`data-helix-part\` value): ${parts.map(p => `\`${p}\``).join(', ')}` : '';
    const pattern = patternOf(contract.name);
    const patternLine = pattern ? `**Pattern:** \`${pattern}\` (.ai/maps/figma-conversion.md)\n\n` : '';
    sections.push(`### ${contract.name} (\`v${contract.version}\`, ${contract.status ?? 'draft'})\n\n${patternLine}${table}${orderLine}${extraLine}${stateLine}${anatomy}`);
  }
  const out =
    `<!-- GENERATED by scripts/docs-figma-map.ts — do not hand-edit the component sections below.
     Run \`pnpm docs:figma-map\` to regenerate. The standard block comes from contracts/figma-conversion.json. -->
# Helix → Figma prop map

Every Helix component prop, the Figma property it must be (same name, same kind), and what the Figma file has
today. **Read by:** \`.ai/skills/components-to-figma.md\` (mandatory pre-read) · Figma-parity audit.

**Parity today: ${ok} of ${total} code props match Figma exactly.**

${CONVENTIONS}

---

## Per-component prop map

<!-- helix:figma-map-components — GENERATED, do not edit -->

${sections.join('\n\n')}

<!-- /helix:figma-map-components -->
`;
  fs.writeFileSync(outPath, out, 'utf-8');
  fs.writeFileSync(outPath.replace(/\.md$/, '.json'), JSON.stringify({ $comment: 'GENERATED by pnpm docs:figma-map from contracts/figma-conversion.json and each contract\'s figma exceptions — do not edit. Per component, per code prop: the Figma property it becomes, or codeOnly + why.', components: jsonMap }, null, 2) + '\n', 'utf-8');
  console.log(`✓ .ai/maps/figma-map.md  —  ${sections.length} components, ${ok}/${total} props match Figma`);
}

run();
