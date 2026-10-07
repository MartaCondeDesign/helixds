/**
 * Cross-checks every contract's props (contracts/components/*.json) against the
 * corresponding {Name}.types.ts implementation. `verify:contract` only validates a
 * contract against its own schema — it never looks at the implementation — so a
 * contract prop silently missing from the real interface previously went undetected.
 * Reports violations — does NOT gate yet. Run: pnpm verify:types
 *
 * To promote to gate: change REPORT_ONLY to false.
 */
import fs from 'fs';
import path from 'path';

const REPORT_ONLY = true;

const root          = path.resolve(import.meta.dirname, '..');
const contractsDir  = path.join(root, 'contracts/components');
const componentsDir = path.join(root, 'packages/core/src/components');
const layoutDir     = path.join(root, 'packages/core/src/layout');

// Same allowlist as generate-types.ts — keep the two in sync. Native DOM event handlers
// (onChange/onBlur/onFocus) are included here — like onClick (ADR-022), these are NOT
// renamed by Helix (onChange is itself the canonical name per prop-map.md) and come
// straight from the extends clause on form-element components (Input, Textarea, Select).
const NATIVE_PASSTHROUGH = new Set([
  'disabled', 'className', 'id', 'name', 'value', 'defaultValue', 'checked', 'defaultChecked',
  'placeholder', 'required', 'readOnly', 'type', 'maxLength', 'minLength', 'min', 'max', 'step',
  'multiple', 'autoFocus', 'autoComplete', 'tabIndex', 'style', 'onChange', 'onBlur', 'onFocus',
]);

type ContractProp = { name: string; type: string; required?: boolean; description: string };
type Contract = { name: string; props?: ContractProp[] };

type Issue = { component: string; message: string; severity: 'error' | 'warn' };
const issues: Issue[] = [];

const files = fs.readdirSync(contractsDir).filter(f => f.endsWith('.json'));
let checked = 0;

for (const file of files) {
  const contract = JSON.parse(fs.readFileSync(path.join(contractsDir, file), 'utf-8')) as Contract;
  const props = contract.props ?? [];
  if (props.length === 0) continue; // draft contract, nothing to check yet

  const isLayout = fs.existsSync(path.join(layoutDir, contract.name));
  const implDir  = isLayout ? path.join(layoutDir, contract.name) : path.join(componentsDir, contract.name);
  const typesPath = path.join(implDir, `${contract.name}.types.ts`);

  if (!fs.existsSync(typesPath)) {
    // No implementation yet at all — contracts/manifest.json already tracks this via
    // its own drift array; don't duplicate that check here.
    continue;
  }
  checked++;

  const src = fs.readFileSync(typesPath, 'utf-8');

  // Scope to the {Name}Props interface specifically — a file can export several
  // interfaces (e.g. Table.types.ts has TableProps/TableRowProps/TableCellProps/...,
  // each with its own `children` field of different optionality). Checking the whole
  // file conflates them; find this interface's header, then its matching closing brace.
  const headerRe = new RegExp(`export interface ${contract.name}Props\\b[^{]*\\{`);
  const headerMatch = headerRe.exec(src);
  if (!headerMatch) {
    issues.push({
      component: contract.name,
      message: `Could not find "export interface ${contract.name}Props" in ${contract.name}.types.ts — skipping.`,
      severity: 'warn',
    });
    continue;
  }
  const bodyStart = headerMatch.index + headerMatch[0].length;
  let depth = 1;
  let bodyEnd = bodyStart;
  while (depth > 0 && bodyEnd < src.length) {
    if (src[bodyEnd] === '{') depth++;
    else if (src[bodyEnd] === '}') depth--;
    bodyEnd++;
  }
  const interfaceBody = src.slice(bodyStart, bodyEnd - 1);
  const interfaceHeader = headerMatch[0];

  // Does THIS interface extend some native *HTMLAttributes<...>? Matches both
  // `React.InputHTMLAttributes<...>` (namespace import) and a bare `TextareaHTMLAttributes<...>`
  // (named import, as in Textarea.types.ts) — both real styles in this codebase.
  const hasNativeExtends = /extends\s+(Omit<)?(React\.)?\w+HTMLAttributes</.test(interfaceHeader);

  // Explicitly declared fields within this interface only: "name?: Type;" or "name: Type;".
  const declared = new Map<string, { optional: boolean }>();
  const fieldRe = /^\s*([a-zA-Z_$][\w$]*)(\??):\s*[^;]+;/gm;
  let m: RegExpExecArray | null;
  while ((m = fieldRe.exec(interfaceBody))) {
    declared.set(m[1]!, { optional: m[2] === '?' });
  }

  for (const prop of props) {
    const isRequired = prop.required === true;
    const field = declared.get(prop.name);

    if (field) {
      if (field.optional === isRequired) {
        // declared optional but contract says required, or vice versa
        issues.push({
          component: contract.name,
          message: `Prop '${prop.name}' is ${isRequired ? 'required' : 'optional'} in the contract but declared ${field.optional ? 'optional (?)' : 'required'} in ${contract.name}.types.ts.`,
          severity: 'warn',
        });
      }
      continue;
    }

    if (NATIVE_PASSTHROUGH.has(prop.name) && hasNativeExtends) {
      continue; // expected to come from the native HTMLAttributes extends clause
    }

    issues.push({
      component: contract.name,
      message: `Prop '${prop.name}' is in the contract but not found in ${contract.name}.types.ts (and isn't a recognized native-HTML passthrough).`,
      severity: 'error',
    });
  }
}

// ── Report ────────────────────────────────────────────────────────────────────

const errors = issues.filter(i => i.severity === 'error');
const warns  = issues.filter(i => i.severity === 'warn');

if (issues.length === 0) {
  console.log(`✅ verify:types — ${checked} components checked against their contracts, 0 issues`);
  process.exit(0);
}

console.log(`\n📋 Contract <-> .types.ts verification — ${checked} components checked\n`);

for (const issue of issues) {
  const icon = issue.severity === 'error' ? '❌' : '⚠️';
  console.log(`${icon} ${issue.component}`);
  console.log(`   ${issue.message}\n`);
}

console.log(`Summary: ${errors.length} errors, ${warns.length} warnings`);

if (REPORT_ONLY) {
  console.log('\n(report-only mode — not blocking CI)');
  process.exit(0);
} else {
  process.exit(errors.length > 0 ? 1 : 0);
}
