/**
 * Validates Helix's tokens against the official DTCG 2025.10 JSON Schemas (packages/tokens/schemas/dtcg-2025.10/,
 * vendored from design-tokens/community-group) — the standard's own definition of a valid file, not Helix's
 * reading of it:
 *   - packages/tokens/src/tokens.json and tokens.dark.json against the Format schema (a color as a hex string,
 *     "16px", a unit the standard doesn't allow, a typography without letterSpacing… all fail)
 *   - packages/tokens/src/helix.resolver.json against the Resolver schema
 *   - then each theme the resolver produces is resolved, and every alias must reach a token of the same $type
 *
 * Run: pnpm verify:dtcg [tokens-file]   (one file: just the Format check on it)
 * Values are written and read through packages/tokens/src/dtcg.mjs — see packages/tokens/CLAUDE.md.
 */
import fs from 'node:fs';
import path from 'node:path';
import Ajv, { type ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { isAlias } from '../packages/tokens/src/dtcg.mjs';
import { loadResolver } from '../packages/tokens/src/resolver.mjs';

const root = path.resolve(import.meta.dirname, '..');
const src = path.join(root, 'packages/tokens/src');
const schemaDir = path.join(root, 'packages/tokens/schemas/dtcg-2025.10');
const FORMAT = 'https://www.designtokens.org/schemas/2025.10/format.json';
const RESOLVER = 'https://www.designtokens.org/schemas/2025.10/resolver.json';

const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);
const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap(e => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
for (const f of walk(schemaDir).filter(f => f.endsWith('.json'))) ajv.addSchema(JSON.parse(fs.readFileSync(f, 'utf8')));

type Token = { $value: unknown; $type?: string };
const leaves = (node: unknown, at: string[] = []): Array<[string, Token]> =>
  !node || typeof node !== 'object' ? []
    : '$value' in node ? [[at.join('.'), node as Token]]
      : Object.entries(node).flatMap(([k, v]) => (k.startsWith('$') ? [] : leaves(v, [...at, k])));

let failed = false;
const rel = (f: string) => path.relative(root, f);

/** Schema-validates one file; prints one line per failing token (ajv reports a cascade per failure). */
function check(file: string, schemaId: string): unknown {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const validate = ajv.getSchema(schemaId)!;
  if (validate(data)) return data;
  failed = true;
  const tokenOf = (pointer: string) => pointer.replace(/\/\$(value|type|extensions|description)(\/.*)?$/, '').split('/').slice(1).join('.') || '(root)';
  const byToken = new Map<string, ErrorObject>();
  for (const e of validate.errors ?? []) {
    const key = tokenOf(e.instancePath);
    const prev = byToken.get(key);
    if (!prev || e.instancePath.length > prev.instancePath.length) byToken.set(key, e);
  }
  console.error(`❌ ${rel(file)} breaks DTCG 2025.10 in ${byToken.size} place(s):`);
  for (const [token, e] of [...byToken].slice(0, 40)) {
    const extra = e.params && 'additionalProperty' in e.params ? ` (${(e.params as { additionalProperty: string }).additionalProperty})` : '';
    console.error(`   ${token}: ${e.instancePath.replace(/^.*?\/(\$\w+)/, '$1') || '/'} ${e.message}${extra}`);
  }
  if (byToken.size > 40) console.error(`   … and ${byToken.size - 40} more`);
  return undefined;
}

// A single file given on the command line: Format check only.
if (process.argv[2]) {
  const file = path.resolve(process.argv[2]);
  const data = check(file, FORMAT);
  if (data) console.log(`✅ verify:dtcg — ${rel(file)} is valid DTCG 2025.10 (${leaves(data).length} tokens, official schema)`);
  process.exit(failed ? 1 : 0);
}

const counts: string[] = [];
for (const name of ['tokens.json', 'tokens.dark.json']) {
  const data = check(path.join(src, name), FORMAT);
  if (data) counts.push(`${name} ${leaves(data).length}`);
}
const resolverFile = path.join(src, 'helix.resolver.json');
check(resolverFile, RESOLVER);

// Every context of every modifier resolves, and each alias lands on a token of the same type.
const resolver = loadResolver(resolverFile);
const themes: string[] = [];
for (const [modifier, contexts] of Object.entries(resolver.modifiers)) {
  for (const context of contexts) {
    const tree = resolver.resolve({ [modifier]: context });
    const byPath = new Map(leaves(tree));
    const problems: string[] = [];
    for (const [at, token] of byPath) {
      const refs = isAlias(token.$value) ? [token.$value]
        : token.$value && typeof token.$value === 'object' ? Object.values(token.$value).filter(isAlias) : [];
      for (const ref of refs) {
        const target = ref.slice(1, -1);
        const hit = byPath.get(target) ?? byPath.get(target.split('.').slice(0, -1).join('.')); // a typography sub-property
        if (!hit) problems.push(`${at} → ${ref} doesn't exist`);
        else if (refs.length === 1 && token.$type && hit.$type && hit.$type !== token.$type && hit.$type !== 'typography') {
          problems.push(`${at} ($type ${token.$type}) → ${ref} is a ${hit.$type}`);
        }
      }
    }
    if (problems.length) {
      failed = true;
      console.error(`❌ ${modifier}=${context}: ${problems.length} alias problem(s)`);
      for (const p of problems.slice(0, 20)) console.error(`   ${p}`);
    } else themes.push(`${modifier}=${context} (${byPath.size})`);
  }
}

if (failed) {
  console.error('\nWrite values in their DTCG shape — `pnpm token:add` does it from CSS (packages/tokens/src/dtcg.mjs).');
  process.exit(1);
}
console.log(`✅ verify:dtcg — valid DTCG 2025.10 (official schemas): ${counts.join(', ')} tokens · helix.resolver.json · resolved ${themes.join(', ')}, every alias reaches a token of its type`);
