#!/usr/bin/env node
/**
 * Claude Code PreToolUse hook (.claude/settings.json, on Edit|Write|MultiEdit): before Claude writes a file
 * that imports from @helixds/react, every Helix component the file will use must have had its contract
 * read in this session. Otherwise the write is denied with the list of components to look up — so an agent
 * can't guess props (the open-design-system-bench run in evals/bench/ shows what guessing produces).
 *
 * "Read the contract" means any of, per component, anywhere earlier in the session transcript:
 *   - MCP:   helix_get_contract { name: "<Name>" }
 *   - Read:  contracts/components/<Name>.json, node_modules/@helixds/react/dist/contracts/<Name>.json,
 *            or <Name>.types.ts / <Name>.types.d.ts
 *   - Bash:  pnpm helix component <Name>
 *
 * Counts every component in the file after the edit, not only the ones the edit adds: an edit can
 * change how an existing component is used just as easily. Only names that have a contract are checked
 * (subcomponents like TableRow and helpers like toast have none). Fails open: no transcript, an
 * unreadable file or no contracts found → the write goes ahead. Pairs with claude-lint-hook.mjs, which
 * checks the written result.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.env.CLAUDE_PROJECT_DIR || path.resolve(import.meta.dirname, '..');

let input = '';
for await (const chunk of process.stdin) input += chunk;
const payload = JSON.parse(input || '{}');
const tool = payload.tool_name;
const args = payload.tool_input ?? {};
const file = args.file_path;
if (!file || !/\.(jsx?|tsx?)$/.test(file)) process.exit(0);

// ── The file as it will be after this tool call ─────────────────────────────
let current = '';
try { current = fs.readFileSync(path.resolve(root, file), 'utf8'); } catch { /* new file */ }
let next = current;
if (tool === 'Write') next = args.content ?? '';
else if (tool === 'Edit') next = args.replace_all ? current.split(args.old_string).join(args.new_string) : current.replace(args.old_string, args.new_string);
else if (tool === 'MultiEdit') for (const e of args.edits ?? []) next = e.replace_all ? next.split(e.old_string).join(e.new_string) : next.replace(e.old_string, e.new_string);

// ── Helix components it imports ─────────────────────────────────────────────
const imported = new Set();
for (const m of next.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]@helixds\/react['"]/g)) {
  for (const spec of m[1].split(',').map(s => s.trim())) {
    if (!spec || spec.startsWith('type ')) continue; // a type import renders nothing
    imported.add(spec.split(/\s+as\s+/)[0]);
  }
}
if (!imported.size) process.exit(0);

// Components that have a contract: the repo's own, or the ones shipped in the npm package.
const contractDirs = [path.join(root, 'contracts/components'), path.join(root, 'node_modules/@helixds/react/dist/contracts')];
const withContract = new Set(contractDirs.flatMap(dir => {
  try { return fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'manifest.json').map(f => f.slice(0, -5)); } catch { return []; }
}));
const required = [...imported].filter(name => withContract.has(name));
if (!required.length) process.exit(0);

// ── What this session already looked up ────────────────────────────────────
let transcript;
try { transcript = fs.readFileSync(payload.transcript_path, 'utf8'); } catch { process.exit(0); }
const read = new Set();
for (const line of transcript.split('\n')) {
  if (!line.includes('"tool_use"')) continue;
  let entry;
  try { entry = JSON.parse(line); } catch { continue; }
  for (const block of entry.message?.content ?? []) {
    if (block?.type !== 'tool_use') continue;
    const { name, input: use = {} } = block;
    if (/helix_get_contract$/.test(name) && typeof use.name === 'string') {
      const match = required.find(c => c.toLowerCase() === use.name.toLowerCase());
      if (match) read.add(match);
    } else if (name === 'Read' && typeof use.file_path === 'string') {
      const m = use.file_path.match(/(?:contracts\/(?:components\/)?([A-Za-z]+)\.json|([A-Za-z]+)\.types\.(?:d\.)?ts)$/);
      if (m) read.add(m[1] ?? m[2]);
    } else if (name === 'Bash' && typeof use.command === 'string') {
      for (const m of use.command.matchAll(/helix\s+component\s+([A-Za-z]+)/g)) read.add(m[1]);
    }
  }
}

const missing = required.filter(c => !read.has(c));
if (!missing.length) process.exit(0);

const relative = path.relative(root, path.resolve(root, file));
console.log(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    permissionDecision: 'deny',
    permissionDecisionReason:
      `${relative} uses Helix ${missing.length === 1 ? 'component' : 'components'} whose contract you haven't read in this session: ${missing.join(', ')}. ` +
      `Read each one first — helix_get_contract (MCP), or contracts/components/<Name>.json ` +
      `(node_modules/@helixds/react/dist/contracts/<Name>.json in an app) — then write the file again ` +
      `using only the props it lists.`,
  },
}));
