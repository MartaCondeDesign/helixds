/**
 * Generates .ai/maps/figma-map.md — a map of how each Helix component prop
 * translates to a Figma property (kind, name, value mapping), plus the
 * anatomy layers extracted from each component's data-helix-part attributes.
 *
 * This file is GENERATED — do not hand-edit the per-component sections.
 * The conventions section at the top is stable and hand-maintained.
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

import { expectedFor, setComponent, type Expected } from './figma/prop-rule.ts';

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

const CONVENTIONS = `<!-- helix:figma-map-conventions — stable, hand-maintained -->
## Code prop → Figma property: the exact rule

Every code prop a designer can see is a Figma property with **the same name**, shown **the same way** in the
properties panel (owner's decision, 2026-10-20). \`.ai/skills/components-to-figma.md\` applies it; if the two ever
disagree this table wins and the skill needs fixing.

| Code prop | Figma property | Shown in the panel as |
|---|---|---|
| \`'a' \\| 'b'\` or \`1 \\| 2\` (union) | \`VARIANT\`, same name, **same values** | dropdown |
| \`boolean\` that changes the look (\`disabled\`, \`invalid\`, \`checked\`, \`isLoading\`, \`current\`, \`expanded\`, \`fullWidth\`, \`hideLabel\`…) | \`VARIANT\` with values \`false\` / \`true\` | on/off toggle — a Figma BOOLEAN can only show/hide a layer, it can't change a color or size |
| \`boolean\` that only shows/hides a part (\`required\`, \`showCloseButton\`, \`showCount\`, \`dismissible\`) | \`BOOLEAN\`, same name | on/off toggle |
| Required \`string\` (\`label\`, \`placeholder\`) or the text \`children\` of Button/Accordion/Modal/SidePanel/Card | \`TEXT\`, same name (\`children\` stays \`children\`) | text field |
| Optional \`string\` with a visible part (\`description\`, \`errorMessage\`, \`primaryActionLabel\`…) | \`BOOLEAN\` \`name\` (shows the part) + \`TEXT\` \`name text\` (its content) | toggle + text field |
| Icon (\`icon\`, \`iconEnd\`) | \`BOOLEAN\` \`name\` + \`INSTANCE_SWAP\` \`name\` (a required icon: only the swap) | toggle + icon picker |
| Optional slot (\`header\`, \`actions\`, \`brand\`, \`footer\`, \`start\`, \`end\`, \`sidenav\`, \`topbar\`) | \`BOOLEAN\`, same name | toggle |
| Figma only: \`state\` | \`VARIANT\` \`default\` / \`hover\` / \`press\` / \`focus\` (+ \`open\`, \`selected\`…) | dropdown — CSS pseudo-classes, not props; \`disabled\`/\`invalid\` are NOT in it |
| Handlers, ids, refs, data arrays, \`default*\` twins, aria-only text, an overlay's \`expanded\` (Modal/SidePanel/Menu/Tooltip: closed = not on screen) | — | not a design property |

### Naming rules

- **Figma property name** = code prop name, **unchanged** (\`isLoading\`, not \`loading\`; \`children\`, not \`label\`).
- **VARIANT values** = code values, **unchanged** (\`primary\`, \`stacked-bar\`, \`false\`).
- **Layer names** = the \`data-helix-part\` values from the TSX — never invented. Visually hidden native
  inputs (\`checkbox-input\`, \`radio-input\`, \`select-native\`) exist in code but are not layers.
- **Figma today** is read from \`.ai/figma-props.json\` (a snapshot of the Figma file — refresh it through the
  Figma MCP after changing a component in Figma, then \`pnpm docs:figma-map\`).
<!-- /helix:figma-map-conventions -->`;

function run() {
  const contractFiles = fs.readdirSync(contractsDir).filter(f => f.endsWith('.json')).sort();
  const sections: string[] = [];
  let total = 0, ok = 0;
  for (const file of contractFiles) {
    const contract = JSON.parse(fs.readFileSync(path.join(contractsDir, file), 'utf-8')) as Contract;
    setComponent(contract.name);
    const parts = extractAnatomyParts(contract.name);
    const figma = snapshot[contract.name]?.properties;
    const rows: string[] = [];
    const used = new Set<string>();
    for (const prop of contract.props ?? []) {
      // The owner-approved conversion (contract figma.propertyMap, pnpm figma:props) wins over the rule's proposal.
      const approved = (contract as any).figma?.propertyMap?.[prop.name];
      const list: Expected[] = approved && approved.codeType === (prop.type ?? '')
        ? approved.figma.map((f: Expected) => ({ ...f, why: `approved ${approved.approved}` }))
        : expectedFor(prop, parts).map(e => ({ ...e, why: `${e.why} — **pending approval** (pnpm figma:props)` }));
      for (const e of list) {
        const status = compare(e, figma);
        total++; if (status === '✓') ok++;
        const m = figma?.find(f => f.name === e.name && f.type === e.type); if (m) used.add(m.name + m.type);
        const fig = e.type === 'VARIANT' ? `\`${e.name}\` = ${e.values!.map(v => `\`${v}\``).join(' / ')}` : `\`${e.name}\``;
        rows.push(`| \`${prop.name}\` | \`${(prop.type ?? '').replace(/\|/g, '\\|')}\` | \`${e.type}\` ${fig} | ${e.why} | ${status} |`);
      }
    }
    const extra = (figma ?? []).filter(f => !used.has(f.name + f.type) && f.name !== 'state');
    const table = rows.length
      ? `| Code prop | Code type | Figma property | Why | Figma today |\n|---|---|---|---|---|\n${rows.join('\n')}`
      : '_No design props._';
    const extraLine = extra.length ? `\n\n**Only in Figma (no code prop of that name and type):** ${extra.map(f => `\`${f.name}\` (${f.type}${f.values ? ': ' + f.values.join(' / ') : ''})`).join(', ')}` : '';
    const stateLine = figma?.find(f => f.name === 'state') ? `\n\n**Figma-only \`state\`:** ${figma.find(f => f.name === 'state')!.values!.map(v => `\`${v}\``).join(' / ')}` : '';
    const anatomy = parts.length ? `\n\n**Anatomy layers** (Figma layer name = \`data-helix-part\` value): ${parts.map(p => `\`${p}\``).join(', ')}` : '';
    sections.push(`### ${contract.name} (\`v${contract.version}\`, ${contract.status ?? 'draft'})\n\n${table}${extraLine}${stateLine}${anatomy}`);
  }
  const out =
    `<!-- GENERATED by scripts/docs-figma-map.ts — do not hand-edit the component sections below.
     Run \`pnpm docs:figma-map\` to regenerate. The conventions block is stable and hand-maintained. -->
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
  console.log(`✓ .ai/maps/figma-map.md  —  ${sections.length} components, ${ok}/${total} props match Figma`);
}

run();
