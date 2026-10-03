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

const CONVENTIONS = `<!-- helix:figma-map-conventions — stable, hand-maintained -->
## Prop → Figma property: general conventions

Summary of \`.ai/skills/components-to-figma.md\` ("Prop taxonomy" + its exceptions) — that skill is the
authority; if the two ever disagree, the skill wins and this generator needs fixing.

| Code shape | Figma property | Notes |
|---|---|---|
| \`'a' \\| 'b'\` (string union) | \`VARIANT\` | Values exactly as in code — \`variant=primary\`, never \`Variant=Primary\` |
| \`boolean\` | \`BOOLEAN\` | Except \`disabled\` ↓ |
| \`disabled\` | \`VARIANT\` (\`false\` / \`true\`) | A BOOLEAN can't express the disabled visual change (skill: "Disabled state rule") |
| Required label-like \`string\` | \`TEXT\` | \`label\`, \`children\`, and \`placeholder\` (always shown when empty) |
| Optional label-like \`string\` | \`BOOLEAN\` + \`TEXT\` | A show/hide part (\`description\`, \`errorMessage\`…): BOOLEAN \`description\` on the part's visibility + TEXT \`description text\` for its content. Code stays implicit — passing the prop shows the part (show-hide-parts.md) |
| Icon component (\`icon\`, \`iconEnd\`) | \`BOOLEAN\` + \`INSTANCE_SWAP\` | Both bound to the same icon layer; BOOLEAN-only fallback if the icon library isn't in Figma yet |
| Event handlers, refs, callbacks, arrays/objects | — | Not expressed in Figma |

Not decidable from types alone — check the skill: \`required\` with no visible indicator is skipped;
\`children\` that nests other components is a nested layer, not a property.

### Naming rules

- **Figma property name** = code prop name, **unchanged** (\`variant\`, \`size\`, \`disabled\`).
- **VARIANT values** = code values, **unchanged** (\`primary\`, \`icon-only\`, \`false\`).
- **Layer names** = the \`data-helix-part\` values from the TSX — never invented. Visually hidden native
  inputs (\`checkbox-input\`, \`radio-input\`, \`select-native\`) exist in code but are not layers.
<!-- /helix:figma-map-conventions -->`;

function run() {
  const contractFiles = fs.readdirSync(contractsDir)
    .filter(f => f.endsWith('.json'))
    .sort();

  const sections: string[] = [];

  for (const file of contractFiles) {
    const contract = JSON.parse(
      fs.readFileSync(path.join(contractsDir, file), 'utf-8'),
    ) as Contract;

    if (!contract.props || contract.props.length === 0) continue;

    const rows: PropRow[] = [];

    const parts = extractAnatomyParts(contract.name);
    for (const prop of contract.props) {
      const kind = inferFigmaKind(prop.name, prop.type ?? '', prop.required === true, parts);
      if (!kind) continue;

      rows.push({
        name:         prop.name,
        codeType:     prop.type ?? '',
        figmaKind:    kind,
        // rendered inside backticks: an optional part lists both properties, `description` + `description text`
        figmaProperty: kind === 'OPTIONAL_TEXT' ? `${prop.name}\` + \`${prop.name} text` : prop.name,
        values:       kind === 'VARIANT' ? variantValues(prop.name, prop.type ?? '') : '—',
      });
    }

    const anatomyParts = extractAnatomyParts(contract.name);

    if (rows.length === 0 && anatomyParts.length === 0) continue;

    const kindLabel = (r: PropRow) =>
      r.figmaKind === 'ICON_SLOT' ? '`BOOLEAN` + `INSTANCE_SWAP`'
        : r.figmaKind === 'OPTIONAL_TEXT' ? '`BOOLEAN` + `TEXT`'
        : `\`${r.figmaKind}\``;

    const propSection = rows.length > 0
      ? `| Code prop | Code type | Figma kind | Figma property | Values |\n` +
        `|---|---|---|---|---|\n` +
        rows.map(r =>
          `| \`${r.name}\` | \`${r.codeType.replace(/\|/g, '\\|')}\` | ${kindLabel(r)} | \`${r.figmaProperty}\` | ${r.values} |`,
        ).join('\n')
      : '_No Figma-mappable props._';

    const anatomySection = anatomyParts.length > 0
      ? `**Anatomy layers** (Figma layer name = \`data-helix-part\` value):\n` +
        anatomyParts.map(p => `- \`${p}\``).join('\n')
      : '';

    sections.push(
      `### ${contract.name} (\`v${contract.version}\`, ${contract.status ?? 'draft'})\n\n` +
      propSection +
      (anatomySection ? '\n\n' + anatomySection : ''),
    );
  }

  const out =
    `<!-- GENERATED by scripts/docs-figma-map.ts — do not hand-edit the component sections below.
     Run \`pnpm docs:figma-map\` to regenerate. The conventions block is stable and hand-maintained. -->
# Helix → Figma prop map

Maps every Helix component prop to its expected Figma property.
**Read by:** \`.ai/skills/components-to-figma.md\` (mandatory pre-read) · Figma-parity audit.

${CONVENTIONS}

---

## Per-component prop map

<!-- helix:figma-map-components — GENERATED, do not edit -->

${sections.join('\n\n')}

<!-- /helix:figma-map-components -->
`;

  fs.writeFileSync(outPath, out, 'utf-8');
  console.log(`✓ .ai/maps/figma-map.md  —  ${sections.length} components`);
}

run();
