/**
 * Scaffolds {Name}.types.ts from an already-filled component contract
 * (contracts/components/{Name}.json). Run after the contract's `props` array is
 * written and approved, as the first file of ds-component-creator.md Step 2.
 *
 * Run: pnpm generate:types <ComponentName> [--dry-run]
 *
 * Refuses to overwrite an existing {Name}.types.ts — this is a starting point for a
 * new component, not a resync tool for one that already has hand-tuned types. Use
 * `pnpm verify:types` to check an existing component's types against its contract.
 */
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const name = args.find(a => !a.startsWith('--'));

if (!name) {
  console.error('Usage: pnpm generate:types <ComponentName> [--dry-run]');
  process.exit(1);
}

const root = path.resolve(import.meta.dirname, '..');
const contractPath = path.join(root, 'contracts/components', `${name}.json`);

if (!fs.existsSync(contractPath)) {
  console.error(`❌ ${path.relative(root, contractPath)} doesn't exist. Run \`pnpm contract ${name}\` first, fill in props, then retry.`);
  process.exit(1);
}

type ContractProp = {
  name: string;
  type: string;
  default?: string | boolean | number | null;
  required?: boolean;
  description: string;
};
type Contract = {
  name: string;
  props?: ContractProp[];
  anatomy?: { part: string; element: string; description: string; optional?: boolean }[];
};

const contract = JSON.parse(fs.readFileSync(contractPath, 'utf-8')) as Contract;
const props = contract.props ?? [];

if (props.length === 0) {
  console.error(`❌ ${name}.json has no props yet. Fill in the contract's "props" array before generating types.`);
  process.exit(1);
}

// ── Native HTML passthrough ─────────────────────────────────────────────────
// A contract prop in this set is expected to come from `extends React.XHTMLAttributes<...>`,
// not from an explicit interface field — matches the pattern in Button/IconButton, where
// `disabled` and `className` are in the contract but not redeclared in .types.ts.
// Keep in sync with scripts/verify-types.ts's copy of this set.
const NATIVE_PASSTHROUGH = new Set([
  'disabled', 'className', 'id', 'name', 'value', 'defaultValue', 'checked', 'defaultChecked',
  'placeholder', 'required', 'readOnly', 'type', 'maxLength', 'minLength', 'min', 'max', 'step',
  'multiple', 'autoFocus', 'autoComplete', 'tabIndex', 'style', 'onChange', 'onBlur', 'onFocus',
]);

// Root native element -> React attributes interface + DOM element type.
// Derived from contract.anatomy's root part (first non-slot entry) when possible.
const NATIVE_ELEMENT_MAP: Record<string, { attrs: string; el: string }> = {
  button:   { attrs: 'ButtonHTMLAttributes',   el: 'HTMLButtonElement' },
  input:    { attrs: 'InputHTMLAttributes',    el: 'HTMLInputElement' },
  select:   { attrs: 'SelectHTMLAttributes',   el: 'HTMLSelectElement' },
  textarea: { attrs: 'TextareaHTMLAttributes', el: 'HTMLTextAreaElement' },
  a:        { attrs: 'AnchorHTMLAttributes',   el: 'HTMLAnchorElement' },
  form:     { attrs: 'FormHTMLAttributes',     el: 'HTMLFormElement' },
  img:      { attrs: 'ImgHTMLAttributes',      el: 'HTMLImageElement' },
  label:    { attrs: 'LabelHTMLAttributes',    el: 'HTMLLabelElement' },
};

const rootAnatomy = (contract.anatomy ?? []).find(a => a.element !== 'slot');
const nativeTag = rootAnatomy?.element && NATIVE_ELEMENT_MAP[rootAnatomy.element] ? rootAnatomy.element : null;
const native = nativeTag ? NATIVE_ELEMENT_MAP[nativeTag]! : null;

// The action handler is React's own onClick (ADR-022), so the native attributes are extended as they are.
const extendsClause = native ? `extends React.${native.attrs}<${native.el}>` : null;

// ── Build type aliases + interface fields ───────────────────────────────────
const pascal = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const isUnion = (t: string) => /^'[^']*'(\s*\|\s*'[^']*')*$/.test(t.trim());

const typeAliases: string[] = [];
const fields: string[] = [];
let usesTablerIcon = false;

for (const prop of props) {
  if (native && NATIVE_PASSTHROUGH.has(prop.name)) continue; // covered by the extends clause

  const required = prop.required === true;
  const optionalMark = required ? '' : '?';

  // Strip a trailing "| undefined" from the contract type — optionality is already
  // expressed by the `?`, matching how onClick/icon/iconEnd are typed in Button.types.ts.
  let tsType = prop.type.replace(/\s*\|\s*undefined\s*$/, '').trim();

  if (tsType.includes('TablerIcon')) usesTablerIcon = true;

  if (isUnion(tsType)) {
    const aliasName = `${contract.name}${pascal(prop.name)}`;
    typeAliases.push(`export type ${aliasName} = ${tsType};`);
    tsType = aliasName;
  }

  // JSDoc: contract description as the starting point, plus "Default: 'x'" only for a
  // non-boolean default on an optional prop — matches Button.types.ts (variant/size get a
  // stated default, loading/fullWidth's boolean `false` default doesn't).
  let jsdoc = prop.description;
  if (!required && prop.default !== undefined && prop.default !== null && typeof prop.default !== 'boolean') {
    const defaultLiteral = typeof prop.default === 'string' ? `'${prop.default}'` : String(prop.default);
    jsdoc = `${jsdoc} Default: ${defaultLiteral}`;
  }

  fields.push(`  /** ${jsdoc} */\n  ${prop.name}${optionalMark}: ${tsType};`);
}

const importLines = [`import type * as React from 'react';`];
if (usesTablerIcon) importLines.push(`import type { TablerIcon } from '@tabler/icons-react';`);

const interfaceHeader = extendsClause
  ? `export interface ${contract.name}Props ${extendsClause} {`
  : `export interface ${contract.name}Props {`;

const fileContent = [
  ...importLines,
  '',
  ...(typeAliases.length ? [...typeAliases, ''] : []),
  interfaceHeader,
  ...fields,
  '}',
  '',
].join('\n');

// ── Output ───────────────────────────────────────────────────────────────────
const outDir = path.join(root, 'packages/core/src/components', contract.name);
const outPath = path.join(outDir, `${contract.name}.types.ts`);

if (dryRun) {
  console.log(`--- ${path.relative(root, outPath)} (dry run, not written) ---\n`);
  console.log(fileContent);
  process.exit(0);
}

if (fs.existsSync(outPath)) {
  console.error(`❌ ${path.relative(root, outPath)} already exists. Refusing to overwrite — edit it directly, or run \`pnpm verify:types\` to check it against the contract.`);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, fileContent);
console.log(`✅ Generated ${path.relative(root, outPath)}`);
if (!native) {
  console.log(`⚠️  No native element extends clause — contract.anatomy's root part wasn't a recognized native element (got '${rootAnatomy?.element}'). Add \`extends React.HTMLAttributes<HTMLDivElement>\` (or the right one) by hand if this component wraps a native element.`);
}
console.log('Next: review the JSDoc (copied from the contract description, likely too long — trim it), confirm the extends/Omit clause is right, and check against packages/core/src/components/Button/Button.types.ts for the house style.');
