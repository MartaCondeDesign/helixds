/**
 * Validates packages/tokens/src/tokens.json against the official DTCG 2025.10 JSON Schema
 * (packages/tokens/schemas/dtcg-2025.10/, vendored from design-tokens/community-group) — the standard's own
 * definition of a valid token file, not Helix's reading of it. Fails on any token whose shape breaks it:
 * a color as a hex string instead of { colorSpace, components }, "16px" instead of { value, unit }, a unit the
 * standard doesn't allow (em, vw), a typography missing letterSpacing, a property a token or group can't have.
 *
 * Run: pnpm verify:dtcg [file]   (default: packages/tokens/src/tokens.json)
 * Values are written and read through packages/tokens/src/dtcg.mjs — see packages/tokens/CLAUDE.md.
 */
import fs from 'node:fs';
import path from 'node:path';
import Ajv, { type ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';

const root = path.resolve(import.meta.dirname, '..');
const schemaDir = path.join(root, 'packages/tokens/schemas/dtcg-2025.10');
const file = path.resolve(process.argv[2] ?? path.join(root, 'packages/tokens/src/tokens.json'));

const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);
const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap(e => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
for (const f of walk(schemaDir).filter(f => f.endsWith('.json'))) ajv.addSchema(JSON.parse(fs.readFileSync(f, 'utf8')));

const validate = ajv.getSchema('https://www.designtokens.org/schemas/2025.10/format.json')!;
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const relative = path.relative(root, file);

if (validate(data)) {
  let count = 0;
  (function countTokens(node: unknown) {
    if (!node || typeof node !== 'object') return;
    if ('$value' in node) { count++; return; }
    for (const [k, v] of Object.entries(node)) if (!k.startsWith('$')) countTokens(v);
  })(data);
  console.log(`✅ verify:dtcg — ${relative} is valid DTCG 2025.10 (${count} tokens, official schema)`);
  process.exit(0);
}

// A failing token makes the schema try every alternative (oneOf alias / value / $ref…), so ajv reports a
// cascade. Show one line per token: the deepest error under it, in token-path form.
const tokenOf = (pointer: string) => pointer.replace(/\/\$(value|type|extensions|description)(\/.*)?$/, '').split('/').slice(1).join('.') || '(root)';
const byToken = new Map<string, ErrorObject>();
for (const e of validate.errors ?? []) {
  const key = tokenOf(e.instancePath);
  const prev = byToken.get(key);
  if (!prev || e.instancePath.length > prev.instancePath.length) byToken.set(key, e);
}
console.error(`❌ verify:dtcg — ${relative} breaks DTCG 2025.10 in ${byToken.size} place(s):`);
for (const [token, e] of [...byToken].slice(0, 40)) {
  const extra = e.params && 'additionalProperty' in e.params ? ` (${(e.params as { additionalProperty: string }).additionalProperty})` : '';
  console.error(`   ${token}: ${e.instancePath.replace(/^.*?\/(\$\w+)/, '$1') || '/'} ${e.message}${extra}`);
}
if (byToken.size > 40) console.error(`   … and ${byToken.size - 40} more`);
console.error('\nWrite values in their DTCG shape — `pnpm token:add` does it from CSS (packages/tokens/src/dtcg.mjs).');
process.exit(1);
