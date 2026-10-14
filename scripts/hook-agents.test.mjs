// Tests the Helix hooks with each agent's own payloads and answer formats (scripts/hook-io.mjs): Codex
// (PreToolUse/PostToolUse with Bash and apply_patch — codex-rs/hooks/schema), Gemini CLI (BeforeTool/AfterTool
// with write_file, replace, run_shell_command) and Cursor's tool names. Claude Code's own are covered by each
// hook's test. Run: pnpm test:hook-agents
import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const app = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-agents-'));
fs.mkdirSync(path.join(app, 'src'));
const contracts = path.join(app, 'node_modules/@helixds/react/dist/contracts');
fs.mkdirSync(contracts, { recursive: true });
fs.copyFileSync(path.join(root, 'contracts/components/Button.json'), path.join(contracts, 'Button.json'));
const transcript = path.join(app, 'transcript.json');
fs.writeFileSync(transcript, '{"messages":[]}');

const bad = "import { Button } from '@helixds/react';\nexport const App = () => <Button onPress={save}>Save</Button>;\n";
const patchAdd = `*** Begin Patch\n*** Add File: src/App.tsx\n${bad.trimEnd().split('\n').map(l => `+${l}`).join('\n')}\n*** End Patch`;

// No project env var, like Codex: the hooks must find the app from the payload's cwd.
function run(script, payload) {
  const env = { ...process.env, HELIX_TRACES: 'off' };
  delete env.CLAUDE_PROJECT_DIR; delete env.GEMINI_PROJECT_DIR;
  const out = execFileSync('node', [path.join(root, 'scripts', script)], { input: JSON.stringify({ cwd: app, ...payload }), env }).toString().trim();
  return out ? JSON.parse(out) : null;
}
const codex = (event, tool_name, tool_input) => ({ hook_event_name: event, turn_id: 't1', session_id: 's1', model: 'gpt', permission_mode: 'default', tool_use_id: 'u1', transcript_path: transcript, tool_name, tool_input });
const gemini = (event, tool_name, tool_input) => ({ hook_event_name: event, session_id: 's1', transcript_path: transcript, timestamp: '2026-10-14T00:00:00Z', tool_name, tool_input });

after(() => fs.rmSync(app, { recursive: true, force: true }));

describe('Codex', () => {
  it('contract hook denies an apply_patch that adds a Button before its contract was read', () => {
    const out = run('claude-contract-hook.mjs', codex('PreToolUse', 'apply_patch', { command: patchAdd }));
    assert.equal(out.hookSpecificOutput.permissionDecision, 'deny');
    assert.match(out.hookSpecificOutput.permissionDecisionReason, /src\/App\.tsx.*Button/);
  });

  it('…and lets it through once the transcript shows the contract was looked up', () => {
    const read = path.join(app, 'codex-rollout.jsonl');
    fs.writeFileSync(read, JSON.stringify({ type: 'response_item', payload: { type: 'function_call', name: 'mcp__helix__helix_get_contracts', arguments: JSON.stringify({ names: ['Button'] }) } }) + '\n');
    assert.equal(run('claude-contract-hook.mjs', { ...codex('PreToolUse', 'apply_patch', { command: patchAdd }), transcript_path: read }), null);
  });

  it('lint hook hands the patched file\'s Helix problems back (PostToolUse)', () => {
    fs.writeFileSync(path.join(app, 'src/App.tsx'), bad);
    const out = run('claude-lint-hook.mjs', codex('PostToolUse', 'apply_patch', { command: patchAdd }));
    assert.equal(out.decision, 'block');
    assert.match(out.reason, /helix\/prop-vocabulary/);
  });

  it('owner gate stops a patch to Helix itself — "deny", since Codex has no "ask"', () => {
    const patch = '*** Begin Patch\n*** Update File: node_modules/@helixds/react/dist/contracts/Button.json\n@@\n-a\n+b\n*** End Patch';
    const out = run('claude-owner-gate-hook.mjs', codex('PreToolUse', 'apply_patch', { command: patch }));
    assert.equal(out.hookSpecificOutput.permissionDecision, 'deny');
    assert.match(out.hookSpecificOutput.permissionDecisionReason, /can't pause for the owner's approval/);
    assert.ok(run('claude-owner-gate-hook.mjs', codex('PreToolUse', 'Bash', { command: 'pnpm patch @helixds/react' })));
  });
});

describe('Gemini CLI', () => {
  it('contract hook denies write_file in Gemini\'s format', () => {
    const out = run('claude-contract-hook.mjs', gemini('BeforeTool', 'write_file', { file_path: path.join(app, 'src/New.tsx'), content: bad }));
    assert.equal(out.decision, 'deny');
    assert.match(out.reason, /Button/);
  });

  it('contract hook reads a replace edit, and Gemini\'s transcript as evidence', () => {
    fs.writeFileSync(path.join(app, 'src/App.tsx'), bad);
    const edit = { file_path: path.join(app, 'src/App.tsx'), instruction: 'fix', old_string: 'onPress={save}', new_string: 'onClick={save}' };
    assert.equal(run('claude-contract-hook.mjs', gemini('BeforeTool', 'replace', edit)).decision, 'deny');
    const read = path.join(app, 'gemini-session.json');
    fs.writeFileSync(read, JSON.stringify({ messages: [{ toolCalls: [{ name: 'helix_get_contract', args: { name: 'Button' } }] }] }));
    assert.equal(run('claude-contract-hook.mjs', { ...gemini('BeforeTool', 'replace', edit), transcript_path: read }), null);
  });

  it('lint hook adds the problems to the tool result (AfterTool additionalContext)', () => {
    fs.writeFileSync(path.join(app, 'src/App.tsx'), bad);
    const out = run('claude-lint-hook.mjs', gemini('AfterTool', 'write_file', { file_path: path.join(app, 'src/App.tsx'), content: bad }));
    assert.equal(out.hookSpecificOutput.hookEventName, 'AfterTool');
    assert.match(out.hookSpecificOutput.additionalContext, /helix\/prop-vocabulary/);
  });

  it('owner gate denies run_shell_command patching Helix', () => {
    const out = run('claude-owner-gate-hook.mjs', gemini('BeforeTool', 'run_shell_command', { command: "sed -i 's/a/b/' node_modules/@helixds/react/dist/globals.css" }));
    assert.equal(out.decision, 'deny');
    assert.match(out.reason, /forks the design system/);
  });
});

describe('Cursor tool names and unknown tools', () => {
  it('a Shell tool (Cursor\'s name) is checked like Bash; a read is never gated', () => {
    const out = run('claude-owner-gate-hook.mjs', { tool_name: 'Shell', tool_input: { command: 'pnpm patch @helixds/react' } });
    assert.equal(out.hookSpecificOutput.permissionDecision, 'ask');
    assert.equal(run('claude-owner-gate-hook.mjs', { tool_name: 'Read', tool_input: { file_path: path.join(contracts, 'Button.json') } }), null);
  });

  it('a write tool with an unknown name is still recognised by its input', () => {
    const out = run('claude-contract-hook.mjs', { tool_name: 'create_or_overwrite', tool_input: { file_path: path.join(app, 'src/Other.tsx'), content: bad }, transcript_path: transcript });
    assert.equal(out.hookSpecificOutput.permissionDecision, 'deny');
  });
});
