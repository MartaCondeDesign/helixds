/**
 * `pnpm verify:field-sizes` — form fields share one size set (owner's decision 2026-10-21).
 * Every component in contracts/figma-conversion.json's `form-field` pattern (Input, Textarea, Select, MultiSelect)
 * must offer the same sizes: today one size, m, so none has a `size` prop. If one of them gets more sizes, all of
 * them get the same ones — in the contract's `size` prop and in its {Name}.types.ts. Runs in pre-commit.
 */
import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const conversion = JSON.parse(fs.readFileSync(path.join(root, 'contracts/figma-conversion.json'), 'utf8'));
const fields: string[] = conversion.patterns.find((p: { id: string }) => p.id === 'form-field').components;

const sizesOf = (name: string) => {
  const contract = JSON.parse(fs.readFileSync(path.join(root, `contracts/components/${name}.json`), 'utf8'));
  const prop = (Array.isArray(contract.props) ? contract.props : []).find((p: { name: string }) => p.name === 'size');
  const fromContract = prop ? [...String(prop.type).matchAll(/'([^']+)'/g)].map(m => m[1]).sort().join(' | ') : 'm (no size prop)';
  const types = fs.readFileSync(path.join(root, `packages/core/src/components/${name}/${name}.types.ts`), 'utf8');
  const hasProp = /^\s*size\?\s*:/m.test(types);
  return { name, sizes: fromContract, mismatch: hasProp !== !!prop };
};

const rows = fields.map(sizesOf);
const sets = new Set(rows.map(r => r.sizes));
const bad = rows.filter(r => r.mismatch);
if (sets.size > 1 || bad.length) {
  console.error('❌ verify:field-sizes — form fields must share one size set (owner\'s decision 2026-10-21):');
  for (const r of rows) console.error(`   ${r.name.padEnd(12)} ${r.sizes}${r.mismatch ? '  ← contract and .types.ts disagree on the size prop' : ''}`);
  console.error('   If one field gets a size, every field in the form-field pattern gets the same sizes (code and Figma).');
  process.exit(1);
}
console.log(`✅ verify:field-sizes — ${fields.join(', ')} share one size set: ${[...sets][0]}`);
