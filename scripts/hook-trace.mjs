/**
 * Records what the Claude Code hooks catch — every lint block, contract denial and owner-gate ask — as one JSON
 * line in evals/traces/hooks/<YYYY-MM>.jsonl of this Helix clone. The hooks run from this clone in Helix and in
 * every app `pnpm setup:ai` set up, so this is the real-world record of the mistakes agents make with Helix:
 * the data `pnpm eval:traces` summarizes for evals/error-analysis.md, with no infrastructure.
 *
 * A trace holds what was caught and where — hook, decision, project, file, rule or component, session —
 * never the code. Git-ignored: it stays on this machine. HELIX_TRACES=off turns it off. Never throws: a hook
 * must not fail because its trace couldn't be written.
 */
import fs from 'node:fs';
import path from 'node:path';
import { agentOf, projectDir } from './hook-io.mjs';

const helixRepo = path.resolve(import.meta.dirname, '..');
export const tracesDir = () => process.env.HELIX_TRACES_DIR || path.join(helixRepo, 'evals/traces/hooks');

/**
 * @param {object} trace
 * @param {'lint'|'contract'|'owner-gate'} trace.hook
 * @param {'block'|'deny'|'ask'|'resolved'} trace.decision
 * @param {object} trace.payload   the hook's stdin payload (tool_name, tool_input, session_id…)
 * @param {string} [trace.file]
 * @param {Array<{rule?: string, component?: string, gate?: string, message?: string, line?: number}>} trace.findings
 */
export function recordHookTrace({ hook, decision, payload = {}, file, findings = [] }) {
  if (/^(off|0|false)$/i.test(process.env.HELIX_TRACES ?? '')) return;
  try {
    const project = projectDir(payload);
    const now = new Date();
    const line = {
      timestamp: now.toISOString(),
      source: 'agent-hook',
      agent: agentOf(payload),
      hook,
      decision,
      project: path.basename(project),
      file: file ? path.relative(project, path.resolve(project, file)) : undefined,
      tool: payload.tool_name,
      session: payload.session_id,
      findings,
    };
    const dir = tracesDir();
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, `${now.toISOString().slice(0, 7)}.jsonl`), JSON.stringify(line) + '\n');
  } catch { /* a trace is never worth failing the hook */ }
}

/** Every trace recorded, oldest first (all months). */
export function readHookTraces() {
  const dir = tracesDir();
  let files = [];
  try { files = fs.readdirSync(dir).filter(f => f.endsWith('.jsonl')).sort(); } catch { return []; }
  return files.flatMap(f => fs.readFileSync(path.join(dir, f), 'utf8').split('\n').filter(Boolean).flatMap(l => {
    try { return [JSON.parse(l)]; } catch { return []; }
  }));
}

/** Whether this session's latest trace for `file` (this month) is an unresolved lint block. */
export function hasOpenLintBlock(payload = {}, file) {
  if (!payload.session_id || !file) return false;
  try {
    const project = projectDir(payload);
    const relative = path.relative(project, path.resolve(project, file));
    const month = path.join(tracesDir(), `${new Date().toISOString().slice(0, 7)}.jsonl`);
    const mine = fs.readFileSync(month, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l))
      .filter(t => t.hook === 'lint' && t.session === payload.session_id && t.file === relative);
    return mine.at(-1)?.decision === 'block';
  } catch { return false; }
}
