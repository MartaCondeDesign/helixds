/**
 * `pnpm figma:props` — every code prop must have an approved Figma conversion (root CLAUDE.md rule 16).
 *
 *   pnpm figma:props                    check: lists every prop with no approved conversion (new prop, or its
 *                                       type changed since it was approved) and the conversion the rule
 *                                       proposes; exits 1 if any. Runs in pre-commit, so a new prop can't land
 *                                       until the design-system owner has seen how it becomes a Figma property.
 *   pnpm figma:props --staged           the same check, only for the contracts staged in the commit (pre-commit):
 *                                       adding or changing a prop is what asks for approval.
 *   pnpm figma:props --approve <Name>   records the proposed conversion of <Name>'s pending props in its
 *                                       contract (figma.propertyMap) — the owner's approval. `--approve all`
 *                                       approves every pending prop. Writing a contract asks the owner first
 *                                       (scripts/claude-owner-gate-hook.mjs).
 *
 * The approved map is what Figma must have: .ai/maps/figma-map.md compares it with the Figma file.
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { expectedFor, setComponent, type Prop, type Expected } from './prop-rule.ts';

const root = path.resolve(import.meta.dirname, '../..');
const dir = path.join(root, 'contracts/components');
const arg = process.argv.indexOf('--approve');
const approve = arg > -1 ? (process.argv[arg + 1] ?? '').split(',') : null;
const today = new Date().toISOString().slice(0, 10);
const fmt = (f: Omit<Expected, 'why'>[]) => f.length ? f.map(e => `${e.type} \`${e.name}\`${e.values ? ' = ' + e.values.join(' / ') : ''}`).join(' + ') : '(no Figma property)';

const staged = process.argv.includes('--staged')
  ? new Set(execSync('git diff --cached --name-only', { cwd: root, encoding: 'utf8' }).split('\n').filter(f => f.startsWith('contracts/components/')).map(f => path.basename(f)))
  : null;
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
  const todo: [Prop, Omit<Expected, 'why'>[]][] = [];
  for (const prop of (c.props ?? []) as Prop[]) {
    const entry = map[prop.name];
    if (entry && entry.codeType === (prop.type ?? '')) continue;
    todo.push([prop, expectedFor(prop, parts).map(({ why, ...e }) => e)]);
  }
  if (!todo.length) continue;
  if (approve && (approve.includes('all') || approve.includes(c.name))) {
    c.figma ??= {};
    c.figma.propertyMap ??= {};
    for (const [prop, figma] of todo) c.figma.propertyMap[prop.name] = { codeType: prop.type ?? '', figma, approved: today };
    fs.writeFileSync(p, JSON.stringify(c, null, 2) + '\n');
    console.log(`✅ ${c.name}: ${todo.length} prop(s) approved`);
    continue;
  }
  pending += todo.length;
  console.log(`\n${c.name} — ${todo.length} prop(s) waiting for the owner's approval:`);
  for (const [prop, figma] of todo) console.log(`  ${prop.name}: ${prop.type}  →  ${fmt(figma)}${map[prop.name] ? '   (type changed since it was approved)' : ''}`);
}
if (pending) {
  console.log(`\n❌ ${pending} prop(s) have no approved Figma conversion. Check each one above, then: pnpm figma:props --approve <Name>`);
  process.exit(1);
}
if (!approve) console.log('✅ figma:props — every code prop has an approved Figma conversion');
