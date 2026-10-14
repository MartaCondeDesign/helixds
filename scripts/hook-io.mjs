/**
 * One hook, every agent. The Helix hooks (contract, lint, owner gate) are written once and run in each coding
 * agent that has hooks; this module translates each one's payload in and its decision out:
 *
 *   Claude Code  .claude/settings.json   PreToolUse/PostToolUse  Write/Edit/MultiEdit/Bash, hookSpecificOutput
 *   Cursor       .claude/settings.json   same (Cursor runs Claude Code's hooks: "third-party hooks" setting on)
 *   Codex        .codex/hooks.json       PreToolUse/PostToolUse  Bash/apply_patch (one patch, many files);
 *                                        "deny" only — Codex has no "ask"
 *   Gemini CLI   .gemini/settings.json   BeforeTool/AfterTool    write_file/replace/run_shell_command;
 *                                        {"decision":"deny"} out, feedback as additionalContext
 *
 * A tool is recognised by name first and by the shape of its input second (file_path + content is a write,
 * old_string an edit, a command string a shell call), so a renamed or new tool still gets checked.
 */
import path from 'node:path';

const helixRepo = path.resolve(import.meta.dirname, '..');

export async function readPayload() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  try { return JSON.parse(input || '{}'); } catch { return null; }
}

/** 'gemini' | 'codex' | 'claude' (Claude Code, and Cursor running Claude Code's hooks). */
export function agentOf(payload = {}) {
  if (/^(Before|After)Tool$/.test(payload.hook_event_name ?? '')) return 'gemini';
  if ('turn_id' in payload || payload.tool_name === 'apply_patch') return 'codex';
  return 'claude';
}

/** The project the agent works in. Codex sets no env var for it: its payload's cwd is the project. */
export function projectDir(payload = {}) {
  return process.env.CLAUDE_PROJECT_DIR || process.env.GEMINI_PROJECT_DIR || process.env.CURSOR_PROJECT_DIR
    || payload.cwd || helixRepo;
}

export { helixRepo };

const SHELL = /^(Bash|Shell|run_shell_command|shell|exec_command|local_shell)$/;
const WRITE = /^(Write|write_file|create_file)$/;
const EDIT = /^(Edit|MultiEdit|replace|StrReplace|search_replace|edit_file|NotebookEdit)$/;

/**
 * What the tool call does, the same for every agent:
 *   { kind: 'shell', command }
 *   { kind: 'files', files: [{ path, content? , edits?: [{ old_string, new_string, replace_all }], added?, deleted? }] }
 *   { kind: 'other' }
 * `content` is a whole new file; `edits` are replacements in the current one; `added` is the lines a patch adds
 * to an existing file (Codex apply_patch), without the file around them.
 */
export function toolCall(payload = {}) {
  const name = String(payload.tool_name ?? '');
  const input = payload.tool_input ?? {};
  const command = Array.isArray(input.command) ? input.command.join(' ') : input.command;

  if (name === 'apply_patch' || (typeof command === 'string' && command.trimStart().startsWith('*** Begin Patch'))) {
    return { kind: 'files', files: parsePatch(String(command ?? input.input ?? '')) };
  }
  if (SHELL.test(name) || (!input.file_path && typeof command === 'string')) {
    return typeof command === 'string' ? { kind: 'shell', command } : { kind: 'other' };
  }
  const file = input.file_path ?? input.notebook_path ?? input.path ?? input.filePath ?? payload.tool_response?.filePath;
  if (!file) return { kind: 'other' };
  if (WRITE.test(name) || (typeof input.content === 'string' && input.old_string === undefined)) {
    return { kind: 'files', files: [{ path: file, content: input.content ?? '' }] };
  }
  if (EDIT.test(name) || input.old_string !== undefined || Array.isArray(input.edits)) {
    const edits = Array.isArray(input.edits) ? input.edits : [{
      old_string: input.old_string ?? '',
      new_string: input.new_string ?? '',
      replace_all: input.replace_all ?? input.allow_multiple ?? false,
    }];
    return { kind: 'files', files: [{ path: file, edits }] };
  }
  return { kind: 'other' }; // reads, searches… — nothing written
}

// Codex's apply_patch format: *** Add File / *** Update File (+ *** Move to) / *** Delete File, then +/- lines.
function parsePatch(patch) {
  const files = [];
  let current;
  for (const line of patch.split('\n')) {
    const header = line.match(/^\*\*\* (Add|Update|Delete) File: (.+)$/);
    if (header) {
      current = { path: header[2].trim(), op: header[1] };
      if (header[1] === 'Add') current.content = '';
      if (header[1] === 'Update') current.added = '';
      if (header[1] === 'Delete') current.deleted = true;
      files.push(current);
      continue;
    }
    const move = line.match(/^\*\*\* Move to: (.+)$/);
    if (move && current) { current.path = move[1].trim(); continue; }
    if (!current || !line.startsWith('+')) continue;
    if (current.op === 'Add') current.content += `${line.slice(1)}\n`;
    else if (current.op === 'Update') current.added += `${line.slice(1)}\n`;
  }
  return files.map(({ op, ...file }) => file);
}

/** Stop a tool call before it runs, with the reason the agent gets back. */
export function deny(payload, reason) {
  if (agentOf(payload) === 'gemini') return { decision: 'deny', reason };
  return { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } };
}

/**
 * Ask the person before the tool call runs. Claude Code and Cursor show an approval prompt; Codex and Gemini
 * have no "ask" from a hook, so the call is stopped and the agent is told to get the owner's go-ahead.
 */
export function ask(payload, reason) {
  if (agentOf(payload) === 'claude') {
    return { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'ask', permissionDecisionReason: reason } };
  }
  return deny(payload, `${reason}\nThis agent can't pause for the owner's approval, so the change was stopped: show the owner the change and the options, and let them make it (or approve it from Claude Code or Cursor).`);
}

/** After a tool ran: hand problems back to the agent to fix in the same turn. */
export function feedback(payload, reason) {
  if (agentOf(payload) === 'gemini') return { hookSpecificOutput: { hookEventName: 'AfterTool', additionalContext: reason } };
  return { decision: 'block', reason };
}
