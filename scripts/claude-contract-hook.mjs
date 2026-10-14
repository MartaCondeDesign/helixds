#!/usr/bin/env node
/**
 * PreToolUse hook (Claude Code and Cursor: .claude/settings.json · Codex: .codex/hooks.json · Gemini CLI:
 * .gemini/settings.json BeforeTool — scripts/hook-io.mjs translates each agent): before an agent writes a file
 * that imports from @helixds/react, every Helix component the file will use must have had its contract
 * read in this session. Otherwise the write is denied with the list of components to look up — so an agent
 * can't guess props (the open-design-system-bench run in evals/bench/ shows what guessing produces).
 *
 * "Read the contract" means any of, per component, anywhere earlier in the session transcript:
 *   - MCP:   helix_get_contract { name: "<Name>" } or helix_get_contracts { names: ["<Name>", …] }
 *   - Read:  contracts/components/<Name>.json, node_modules/@helixds/react/dist/contracts/<Name>.json,
 *            or <Name>.types.ts / <Name>.types.d.ts
 *   - Bash:  pnpm helix component <Name>
 * Read from Claude Code's transcript format; other agents' transcripts (Codex, Gemini, Cursor) are searched as
 * text for the same evidence — the contract file's path, `helix component <Name>`, or a helix_get_contract(s)
 * call naming it.
 *
 * Only the components the change touches are required: every `<Name` in the changed text, plus the
 * component whose opening tag the change lands inside (an edit to `variant="primary"` on its own line
 * of a multi-line <Button …> touches Button). A new file touches everything in it; an edit to one Button
 * in a 15-component story asks for Button only. Only names imported from @helixds/react that have a
 * contract count (subcomponents like TableRow and helpers like toast have none). Fails open: no
 * transcript, an unreadable file or no contracts found → the write goes ahead. Pairs with
 * claude-lint-hook.mjs, which checks the written result.
 */
import fs from 'node:fs';
import path from 'node:path';
import { deny, projectDir, readPayload, toolCall } from './hook-io.mjs';
import { recordHookTrace } from './hook-trace.mjs';

const payload = await readPayload();
if (!payload) process.exit(0);
const root = projectDir(payload);
const call = toolCall(payload);
const changes = call.kind === 'files' ? call.files.filter(f => /\.(jsx?|tsx?)$/.test(f.path) && !f.deleted) : [];
if (!changes.length) process.exit(0);

// ── Which Helix components the change touches ──────────────────────────────
// Positions [start, end) in `text` where `replacement` landed after replacing `find` (all or first).
function replaceWithRanges(text, find, replacement, all) {
  const ranges = [];
  let out = '';
  let from = 0;
  for (let i = text.indexOf(find); i !== -1; i = all ? text.indexOf(find, i + find.length) : -1) {
    out += text.slice(from, i);
    ranges.push([out.length, out.length + replacement.length]);
    out += replacement;
    from = i + find.length;
  }
  return { text: out + text.slice(from), ranges };
}

// The JSX element whose opening tag contains `pos`, e.g. a prop line inside a multi-line <Button …>.
// Walks back to each `<Name` and forward to the `>` that closes its opening tag, skipping `{…}` so an
// arrow function's `=>` inside a prop doesn't end the tag early.
function enclosingTag(text, pos) {
  for (const m of [...text.slice(0, pos).matchAll(/<([A-Z][\w.]*)/g)].reverse()) {
    let depth = 0;
    let end = text.length;
    for (let i = m.index + m[0].length; i < text.length; i++) {
      const ch = text[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      else if (ch === '>' && depth === 0) { end = i; break; }
    }
    if (pos <= end) return m[1];
    if (pos - m.index > 4000) return undefined; // far past any opening tag
  }
  return undefined;
}

function touchedIn(text, ranges) {
  const names = new Set();
  for (const [start, end] of ranges) {
    for (const m of text.slice(start, end).matchAll(/<([A-Z][\w.]*)/g)) names.add(m[1]);
    const around = enclosingTag(text, start);
    if (around) names.add(around);
  }
  return names;
}

// Components that have a contract: the repo's own, or the ones shipped in the npm package.
const contractDirs = [path.join(root, 'contracts/components'), path.join(root, 'node_modules/@helixds/react/dist/contracts')];
const withContract = new Set(contractDirs.flatMap(dir => {
  try { return fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'manifest.json').map(f => f.slice(0, -5)); } catch { return []; }
}));

// The Helix components (with a contract) one file's change touches.
function requiredFor(change) {
  let current = '';
  try { current = fs.readFileSync(path.resolve(root, change.path), 'utf8'); } catch { /* new file */ }
  const touched = new Set();
  let next = current;
  if (change.content !== undefined || change.added !== undefined) {
    // A whole new file — or, for a patch to an existing file, the file with the patch's added lines after it
    // (enough to see their imports and tags; a patch doesn't carry the merged result).
    next = change.content ?? `${current}\n${change.added}`;
    // Changed lines: lines of the new content that the current file doesn't have (all of them for a new file).
    const before = new Map();
    for (const line of current.split('\n')) before.set(line, (before.get(line) ?? 0) + 1);
    let offset = 0;
    const ranges = [];
    for (const line of next.split('\n')) {
      if (before.get(line)) before.set(line, before.get(line) - 1);
      else ranges.push([offset, offset + line.length]);
      offset += line.length + 1;
    }
    for (const name of touchedIn(next, ranges)) touched.add(name);
  }
  for (const e of change.edits ?? []) {
    if (!e.old_string) continue;
    const result = replaceWithRanges(next, e.old_string, e.new_string ?? '', e.replace_all);
    next = result.text;
    for (const name of touchedIn(next, result.ranges)) touched.add(name);
  }

  // Local JSX name → Helix export (`import { Button as Btn }` renders <Btn>).
  const imported = new Map();
  for (const m of next.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]@helixds\/react['"]/g)) {
    for (const spec of m[1].split(',').map(s => s.trim())) {
      if (!spec || spec.startsWith('type ')) continue; // a type import renders nothing
      const [exported, local = exported] = spec.split(/\s+as\s+/);
      imported.set(local, exported);
    }
  }
  return [...touched].map(local => imported.get(local)).filter(name => name && withContract.has(name));
}

const required = [...new Set(changes.flatMap(requiredFor))];
if (!required.length) process.exit(0);

// ── What this session already looked up ────────────────────────────────────
let transcript;
try { transcript = fs.readFileSync(payload.transcript_path, 'utf8'); } catch { process.exit(0); }
const read = new Set();
let sawToolUse = false;
for (const line of transcript.split('\n')) {
  if (!line.includes('"tool_use"')) continue;
  sawToolUse = true;
  let entry;
  try { entry = JSON.parse(line); } catch { continue; }
  for (const block of entry.message?.content ?? []) {
    if (block?.type !== 'tool_use') continue;
    const { name, input: use = {} } = block;
    if (/helix_get_contracts?$/.test(name)) {
      // helix_get_contract { name } or helix_get_contracts { names: [...] }
      const asked = [use.name, ...(Array.isArray(use.names) ? use.names : [])].filter(n => typeof n === 'string');
      for (const n of asked) {
        const match = required.find(c => c.toLowerCase() === n.toLowerCase());
        if (match) read.add(match);
      }
    } else if (name === 'Read' && typeof use.file_path === 'string') {
      const m = use.file_path.match(/(?:contracts\/(?:components\/)?([A-Za-z]+)\.json|([A-Za-z]+)\.types\.(?:d\.)?ts)$/);
      if (m) read.add(m[1] ?? m[2]);
    } else if (name === 'Bash' && typeof use.command === 'string') {
      for (const m of use.command.matchAll(/helix\s+component\s+([A-Za-z]+)/g)) read.add(m[1]);
    }
  }
}

// Another agent's transcript (Codex, Gemini, Cursor): no Claude tool_use lines, so look for the same evidence
// as text. JSON in those transcripts may be escaped (\"name\"), hence the optional backslashes.
if (!sawToolUse) {
  for (const c of required) {
    const evidence = [
      new RegExp(`contracts/(?:components/)?${c}\\.json`),
      new RegExp(`\\b${c}\\.types\\.(?:d\\.)?ts`),
      new RegExp(`helix\\s+component\\s+${c}\\b`, 'i'),
      new RegExp(`helix_get_contracts?[\\s\\S]{0,600}?\\\\?"names?\\\\?"\\s*:\\s*\\[?[^\\]}]{0,600}?\\\\?"${c}\\\\?"`, 'i'),
    ];
    if (evidence.some(re => re.test(transcript))) read.add(c);
  }
}

const missing = required.filter(c => !read.has(c));
if (!missing.length) process.exit(0);

const files = changes.map(f => path.relative(root, path.resolve(root, f.path))).join(', ');
recordHookTrace({ hook: 'contract', decision: 'deny', payload, file: changes[0].path, findings: missing.map(component => ({ component })) });
console.log(JSON.stringify(deny(payload,
  `This change to ${files} touches Helix ${missing.length === 1 ? 'component' : 'components'} whose contract you haven't read in this session: ${missing.join(', ')}. ` +
  `Read each one first — helix_get_contract (MCP), or contracts/components/<Name>.json ` +
  `(node_modules/@helixds/react/dist/contracts/<Name>.json in an app) — then write the file again ` +
  `using only the props it lists.`,
)));
