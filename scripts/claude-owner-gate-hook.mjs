#!/usr/bin/env node
/**
 * Claude Code PreToolUse hook (.claude/settings.json, on Edit|Write|MultiEdit|Bash): the files that define
 * what Helix IS stop the agent and ask the design-system owner before they change. CLAUDE.md rule 13 says
 * the token is the owner's choice and a new token is never created without asking — this makes that a
 * gate instead of a sentence. Claude Code shows the owner the reason below and the change only goes ahead
 * if they approve it (permissionDecision "ask"); a denial goes back to the agent as the answer.
 *
 * Gated files:
 *   packages/tokens/src/tokens.json   every token — rule 13: the owner picks it, the agent proposes 2–3
 *   contracts/components/*.json       what each component IS — rule 7: the contract wins over everything
 *   .ai/maps/prop-map.md              the canonical prop vocabulary — rule 5: every prop name follows it
 *   node_modules/@helixds/**, patches/@helixds*
 *                                     in an app (installed by `pnpm setup:ai`): Helix itself, patched in place —
 *                                     a local fork of the design system, which every contract's governance says
 *                                     to escalate to the Helix team instead
 *
 * Edit/Write/MultiEdit: any write to a gated file asks. Bash: a command asks when it runs a CLI that writes
 * one (`pnpm token:add`, `pnpm contract <Name>`), or names a gated file next to something that writes
 * (sed -i, >, tee, mv, cp, rm, git checkout/restore, a node/python/tsx one-liner). Reading one (cat, grep,
 * jq) never asks. This is a checkpoint for an agent working in good faith, not a sandbox: a script that
 * writes the file from elsewhere isn't seen, and the pre-commit hook's own generators (sync-contract-imports)
 * run outside Claude Code, so they never hit it. Fails open: a payload it can't read lets the call through.
 */

import { recordHookTrace } from './hook-trace.mjs';

const GATED = [
  {
    match: p => /(^|\/)packages\/tokens\/src\/tokens\.json$/.test(p),
    what: 'packages/tokens/src/tokens.json',
    why: 'Tokens are the design-system owner\'s choice (CLAUDE.md rule 13): the agent proposes 2–3 existing tokens with what each does and which it recommends, and never creates or edits one without the owner\'s approval.',
  },
  {
    match: p => /(^|\/)contracts\/components\/[^/]+\.json$/.test(p),
    what: 'contracts/components/<Name>.json',
    why: 'A contract defines what the component IS (CLAUDE.md rules 6–7): its props, accessibility and governance. Changing one changes the component for every app and agent that reads it.',
  },
  {
    match: p => /(^|\/)\.ai\/maps\/prop-map\.md$/.test(p),
    what: '.ai/maps/prop-map.md',
    why: 'The prop map is the canonical prop vocabulary (CLAUDE.md rule 5): every contract, the linter and the evals follow it.',
  },
  {
    match: p => /(^|\/)(?:node_modules\/@helixds\/|patches\/@helixds)/.test(p),
    what: 'Helix itself (node_modules/@helixds or a patch of it)',
    why: 'Patching Helix inside an app forks the design system: the next update overwrites it and no other app gets it. Each contract\'s governance.mustEscalateToDS lists what goes to the Helix team instead — or build a local [CUSTOM] component (pnpm helix scaffold:custom).',
  },
];

// Repo CLIs that write a gated file.
const WRITING_CLIS = [
  { pattern: /\bpnpm\s+(?:run\s+)?token:add\b|scripts\/token-cli\.ts/, gate: GATED[0] },
  { pattern: /\bpnpm\s+(?:run\s+)?contract\s+[A-Za-z]|scripts\/contract-cli\.ts/, gate: GATED[1] },
  { pattern: /\b(?:pnpm|yarn)\s+patch(?:-commit)?\s+[^\n]*@helixds|\bpatch-package\s+[^\n]*@helixds/, gate: GATED[3] },
];
const GATED_IN_COMMAND = [
  { pattern: /packages\/tokens\/src\/tokens\.json/, gate: GATED[0] },
  { pattern: /contracts\/components\/[\w*{},-]*\.json|contracts\/components\/?(?:\s|$|['"])/, gate: GATED[1] },
  { pattern: /\.ai\/maps\/prop-map\.md/, gate: GATED[2] },
  { pattern: /node_modules\/@helixds\/|patches\/@helixds/, gate: GATED[3] },
];
// Anything in a shell command that can change a file.
// (`=>`/`->` aren't redirects; `2>&1` isn't a file.)
const WRITES = /\bsed\s+(?:-\w+\s+)*-i|(?:^|[^<>&\d=-])>>?\s*[^&>=\s]|\btee\b|\b(?:mv|cp|rm|truncate|patch)\s|\bgit\s+(?:checkout|restore|apply|mv|rm)\b|\b(?:node|python3?|tsx|deno|bun|perl|ruby)\s+(?:-\w+\s+)*(?:-e|-c|-)(?=\s|$)/;
// Commands that only record or show history: a commit message naming tokens.json doesn't change it.
const HISTORY_ONLY = /^\s*git\s+(?:commit|log|show|diff|tag|status|blame)\b/;

let input = '';
for await (const chunk of process.stdin) input += chunk;
let payload;
try { payload = JSON.parse(input || '{}'); } catch { process.exit(0); }
const tool = payload.tool_name;
const args = payload.tool_input ?? {};

let hits = [];
let action = '';
if (['Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(tool)) {
  const file = String(args.file_path ?? args.notebook_path ?? '').replaceAll('\\', '/');
  hits = GATED.filter(g => g.match(file));
  action = `${tool} ${file.replace(/^.*?(packages\/tokens|contracts\/components|\.ai\/maps|node_modules\/@helixds|patches\/)/, '$1')}`;
} else if (tool === 'Bash' && typeof args.command === 'string') {
  const command = args.command;
  const viaCli = WRITING_CLIS.filter(c => c.pattern.test(command)).map(c => c.gate);
  const viaShell = !HISTORY_ONLY.test(command) && WRITES.test(command) ? GATED_IN_COMMAND.filter(c => c.pattern.test(command)).map(c => c.gate) : [];
  hits = [...new Set([...viaCli, ...viaShell])];
  action = `run: ${command.length > 160 ? `${command.slice(0, 157)}…` : command}`;
}
if (!hits.length) process.exit(0);

// The approval the owner then gives or refuses isn't visible to a PreToolUse hook — the trace records the ask.
recordHookTrace({
  hook: 'owner-gate', decision: 'ask', payload,
  file: args.file_path ?? args.notebook_path,
  findings: hits.map(g => ({ gate: g.what, message: action })),
});

console.log(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    permissionDecision: 'ask',
    permissionDecisionReason:
      `Helix owner approval needed — ${action}\n` +
      hits.map(g => `• ${g.what}: ${g.why}`).join('\n') +
      '\nApprove only if this is the change you chose. If the agent hasn\'t shown you the options and why, deny and ask it to.',
  },
}));
