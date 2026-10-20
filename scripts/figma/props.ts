/**
 * `pnpm figma:props` — every code prop must have a Figma conversion the owner approved (root CLAUDE.md rule 16).
 * The conversion comes from the standard, contracts/figma-conversion.json (approved once, owner-gated); a
 * component's own contract only holds EXCEPTIONS to it (figma.propertyMap).
 *
 *   pnpm figma:props                    check: lists every prop no rule of the standard covers (the standard has
 *                                       to learn it) and every exception whose prop type changed since it was
 *                                       approved; exits 1 if any. Runs in pre-commit.
 *   pnpm figma:props --staged           the same check, only for the contracts staged in the commit (pre-commit).
 *   pnpm figma:props --approve <Name>   re-approves <Name>'s stale exceptions for the prop's new type.
 *   pnpm figma:props --prune            drops every propertyMap entry that just repeats what the standard says.
 *
 * The result is what Figma must have: .ai/maps/figma-map.md compares it with the Figma file.
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { expectedFor, setComponent, UNMATCHED, type Prop, type Expected } from './prop-rule.ts';

const root = path.resolve(import.meta.dirname, '../..');
const dir = path.join(root, 'contracts/components');
const arg = process.argv.indexOf('--approve');
const approve = arg > -1 ? (process.argv[arg + 1] ?? '').split(',') : null;
const today = new Date().toISOString().slice(0, 10);
const prune = process.argv.includes('--prune');
const STANDARD_VERSION = JSON.parse(fs.readFileSync(path.join(root, 'contracts/figma-conversion.json'), 'utf8')).version;
const strip = (l: Expected[]) => l.map(({ why, rule, ...e }) => e);
const fmt = (f: Omit<Expected, 'why'>[]) => f.length ? f.map(e => `${e.type} \`${e.name}\`${e.values ? ' = ' + e.values.join(' / ') : ''}`).join(' + ') : '(no Figma property)';

const staged = process.argv.includes('--staged')
  ? new Set(execSync('git diff --cached --name-only', { cwd: root, encoding: 'utf8' }).split('\n').filter(f => f.startsWith('contracts/components/')).map(f => path.basename(f)))
  : null;
/** Rewrites only the contract's top-level "figma" block (or appends one), keeping the rest of the file's
 * hand formatting — a JSON.stringify of the whole contract would reflow every compact line. */
function withFigmaBlock(text: string, figma: unknown): string {
  // the contracts' own style: anything that fits on a line stays on one line
  const fmt = (v: unknown, ind: string): string => {
    const flat = JSON.stringify(v).replace(/":/g, '": ').replace(/,(?=["{\[\d tf-])/g, ', ').replace(/^\{(?=")/, '{ ').replace(/\}$/, v && typeof v === 'object' && !Array.isArray(v) ? ' }' : '}');
    if (!v || typeof v !== 'object' || ind.length + flat.length <= 140) return flat;
    const inner = ind + '  ';
    return Array.isArray(v)
      ? `[\n${v.map(x => inner + fmt(x, inner)).join(',\n')}\n${ind}]`
      : `{\n${Object.entries(v).map(([k, x]) => `${inner}${JSON.stringify(k)}: ${fmt(x, inner)}`).join(',\n')}\n${ind}}`;
  };
  const block = fmt(figma, '  ');
  const key = /\n  "figma"\s*:\s*\{/.exec(text);
  if (!key) return text.replace(/\s*\}\s*$/, `,\n  "figma": ${block}\n}\n`);
  let i = key.index + key[0].length - 1, depth = 0, inStr = false;
  for (; i < text.length; i++) {
    const ch = text[i];
    if (inStr) { if (ch === '\\') i++; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) break;
  }
  const start = key.index + key[0].length - 1;
  return text.slice(0, start) + block + text.slice(i + 1);
}

let pending = 0;
for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
  if (staged && !staged.has(file)) continue;
  if (approve && !approve.includes('all') && !approve.includes(file.replace(/\.json$/, ''))) continue;
  const p = path.join(dir, file);
  const text = fs.readFileSync(p, 'utf8');
  const c = JSON.parse(text);
  setComponent(c.name);
  const map = c.figma?.propertyMap ?? {};
  const parts = [...(c.anatomy ?? []).map((a: { part: string }) => a.part)];
  const unmatched: Prop[] = [], stale: Prop[] = [];
  let pruned = 0;
  for (const prop of (c.props ?? []) as Prop[]) {
    const std = expectedFor(prop, parts);
    if (std.some(e => e.rule === UNMATCHED)) { unmatched.push(prop); continue; }
    const entry = map[prop.name];
    if (!entry) continue; // the standard covers it — nothing to approve per component
    if (prune && JSON.stringify(entry.figma) === JSON.stringify(strip(std))) { delete map[prop.name]; pruned++; continue; }
    if (entry.codeType !== (prop.type ?? '')) stale.push(prop);
  }
  if (prune) {
    if (pruned) {
      if (Object.keys(map).length) c.figma.propertyMap = map; else delete c.figma.propertyMap;
      fs.writeFileSync(p, withFigmaBlock(text, c.figma));
      console.log(`✂️  ${c.name}: ${pruned} entr${pruned === 1 ? 'y' : 'ies'} the standard already says, removed`);
    }
    continue;
  }
  if (approve && stale.length) {
    for (const prop of stale) { map[prop.name].codeType = prop.type ?? ''; map[prop.name].approved = today; }
    fs.writeFileSync(p, withFigmaBlock(text, c.figma));
    console.log(`✅ ${c.name}: ${stale.length} exception(s) re-approved`);
    continue;
  }
  if (!unmatched.length && !stale.length) continue;
  pending += unmatched.length + stale.length;
  console.log(`\n${c.name}:`);
  for (const prop of unmatched) console.log(`  ${prop.name}: ${prop.type}  →  no rule in contracts/figma-conversion.json covers it — extend the standard (owner's decision)`);
  for (const prop of stale) console.log(`  ${prop.name}: ${prop.type}  →  exception ${fmt(map[prop.name].figma)} was approved for \`${map[prop.name].codeType}\` — re-check it, then pnpm figma:props --approve ${c.name}`);
}
if (pending) {
  console.log(`\n❌ ${pending} prop(s) need the owner: the standard doesn't cover them, or their exception is stale (see above).`);
  process.exit(1);
}
if (!approve && !prune) console.log(`✅ figma:props — every code prop converts by the standard (contracts/figma-conversion.json v${STANDARD_VERSION}) or an approved exception`);
