// Tests the Claude Code contract hook (scripts/claude-contract-hook.mjs) the way Claude Code calls it: a
// PreToolUse payload with a transcript path on stdin, a decision on stdout. Run: pnpm test:contract-hook
import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const hook = path.join(root, 'scripts/claude-contract-hook.mjs');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-contract-hook-'));
const target = path.join(dir, 'Page.tsx');
const transcript = path.join(dir, 'transcript.jsonl');

const page = "import { Button, Modal, Table, TableRow, toast, type ButtonProps } from '@helixds/react';\n";
const toolUse = (name, input) => JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', id: 'x', name, input }] } });

function runHook(lines, toolInput, tool = 'Write') {
  fs.writeFileSync(transcript, lines.join('\n') + '\n');
  const out = execFileSync('node', [hook], {
    input: JSON.stringify({ tool_name: tool, tool_input: { file_path: target, ...toolInput }, transcript_path: transcript }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: root },
  }).toString().trim();
  return out ? JSON.parse(out).hookSpecificOutput : null;
}

after(() => fs.rmSync(dir, { recursive: true, force: true }));

describe('claude-contract-hook', () => {
  it('denies a write that uses components whose contract was never read', () => {
    const result = runHook([], { content: page });
    assert.equal(result.permissionDecision, 'deny');
    // TableRow and toast have no contract; ButtonProps is a type import.
    assert.match(result.permissionDecisionReason, /: Button, Modal, Table\./);
  });

  it('accepts the MCP, a contract file, a type file or the CLI as having read it', () => {
    const lines = [
      toolUse('mcp__helix__helix_get_contract', { name: 'button' }),
      toolUse('Read', { file_path: '/app/node_modules/@helixds/react/dist/contracts/Modal.json' }),
      toolUse('Bash', { command: 'pnpm helix component Table --json' }),
    ];
    assert.equal(runHook(lines, { content: page }), null);
    assert.equal(runHook([toolUse('Read', { file_path: '/x/Button.types.d.ts' })], { content: "import { Button } from '@helixds/react';" }), null);
  });

  it('checks every component in the file after an edit, not only the ones the edit adds', () => {
    fs.writeFileSync(target, page);
    const result = runHook([toolUse('mcp__helix__helix_get_contract', { name: 'Button' })], { old_string: 'Button', new_string: 'Button' }, 'Edit');
    assert.match(result.permissionDecisionReason, /: Modal, Table\./);
  });

  it('ignores files that do not use Helix, and fails open without a transcript', () => {
    assert.equal(runHook([], { content: "import React from 'react';" }), null);
    const out = execFileSync('node', [hook], {
      input: JSON.stringify({ tool_name: 'Write', tool_input: { file_path: target, content: page } }),
      env: { ...process.env, CLAUDE_PROJECT_DIR: root },
    }).toString().trim();
    assert.equal(out, '');
  });
});
