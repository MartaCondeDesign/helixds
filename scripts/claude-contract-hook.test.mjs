// Tests the Claude Code contract hook (scripts/claude-contract-hook.mjs) the way Claude Code calls it: a
// PreToolUse payload with a transcript path on stdin, a decision on stdout. Run: pnpm test:contract-hook
import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// The hooks record a trace of what they catch (scripts/hook-trace.mjs) — not from tests.
process.env.HELIX_TRACES = 'off';

const root = path.resolve(import.meta.dirname, '..');
const hook = path.join(root, 'scripts/claude-contract-hook.mjs');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-contract-hook-'));
const target = path.join(dir, 'Page.tsx');
const transcript = path.join(dir, 'transcript.jsonl');

const page = `import { Button, Modal, Table, TableRow, toast, type ButtonProps } from '@helixds/react';
export const Page = () => (
  <>
    <Table label="People"><TableRow /></Table>
    <Modal
      label="Delete"
      expanded={open}
      onDismiss={() => setOpen(x => !x)}
    >
      <Button variant="danger" onClick={() => toast.success('Deleted')}>Delete</Button>
    </Modal>
  </>
);
`;
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
  it('denies a new file until every component in it has had its contract read', () => {
    fs.rmSync(target, { force: true });
    const result = runHook([], { content: page });
    assert.equal(result.permissionDecision, 'deny');
    // TableRow and toast have no contract; ButtonProps is a type import.
    assert.match(result.permissionDecisionReason, /: Table, Modal, Button\./);
  });

  it('accepts the MCP, a contract file, a type file or the CLI as having read it', () => {
    fs.rmSync(target, { force: true });
    const lines = [
      toolUse('mcp__helix__helix_get_contract', { name: 'button' }),
      toolUse('Read', { file_path: '/app/node_modules/@helixds/react/dist/contracts/Modal.json' }),
      toolUse('Bash', { command: 'pnpm helix component Table --json' }),
    ];
    assert.equal(runHook(lines, { content: page }), null);
    assert.equal(runHook([toolUse('Read', { file_path: '/x/Button.types.d.ts' })], { content: "import { Button } from '@helixds/react';\n<Button>Go</Button>;" }), null);
    assert.equal(runHook([toolUse('mcp__helix__helix_get_contracts', { names: ['Table', 'modal', 'Button'] })], { content: page }), null);
  });

  it('asks only for the component an edit touches, not every component in the file', () => {
    fs.writeFileSync(target, page);
    const result = runHook([], { old_string: 'variant="danger"', new_string: 'variant="secondary"' }, 'Edit');
    assert.match(result.permissionDecisionReason, /component whose contract you haven't read in this session: Button\./);
  });

  it('finds the component around a prop line of a multi-line tag', () => {
    fs.writeFileSync(target, page);
    const result = runHook([], { old_string: '      expanded={open}', new_string: '      expanded={isOpen}' }, 'Edit');
    assert.match(result.permissionDecisionReason, /: Modal\./);
  });

  it('lets an edit outside any Helix element through', () => {
    fs.writeFileSync(target, page);
    assert.equal(runHook([], { old_string: 'export const Page', new_string: 'export const DeletePage' }, 'Edit'), null);
  });

  it('on a rewrite of an existing file, asks only for components on changed lines; follows aliases', () => {
    fs.writeFileSync(target, page);
    const result = runHook([], { content: page.replace('label="People"', 'label="Members"') });
    assert.match(result.permissionDecisionReason, /: Table\./);
    fs.rmSync(target, { force: true });
    const aliased = runHook([], { content: "import { Button as Btn } from '@helixds/react';\n<Btn>Go</Btn>;" });
    assert.match(aliased.permissionDecisionReason, /: Button\./);
  });

  it('ignores files that do not use Helix, and fails open without a transcript', () => {
    fs.rmSync(target, { force: true });
    assert.equal(runHook([], { content: "import React from 'react';\n<div />;" }), null);
    const out = execFileSync('node', [hook], {
      input: JSON.stringify({ tool_name: 'Write', tool_input: { file_path: target, content: page } }),
      env: { ...process.env, CLAUDE_PROJECT_DIR: root },
    }).toString().trim();
    assert.equal(out, '');
  });
});
