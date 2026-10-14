// Tests the Claude Code owner-gate hook (scripts/claude-owner-gate-hook.mjs) the way Claude Code calls it: a
// PreToolUse payload on stdin, a decision on stdout. Run: pnpm test:owner-gate-hook
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const hook = path.join(root, 'scripts/claude-owner-gate-hook.mjs');

function runHook(tool_name, tool_input) {
  const out = execFileSync('node', [hook], { input: JSON.stringify({ tool_name, tool_input }) }).toString().trim();
  return out ? JSON.parse(out).hookSpecificOutput : null;
}
const asks = (tool, input) => runHook(tool, input)?.permissionDecision === 'ask';

describe('claude-owner-gate-hook', () => {
  it('asks the owner before an edit to tokens.json, naming rule 13', () => {
    const result = runHook('Edit', { file_path: `${root}/packages/tokens/src/tokens.json`, old_string: 'a', new_string: 'b' });
    assert.equal(result.permissionDecision, 'ask');
    assert.match(result.permissionDecisionReason, /owner approval/);
    assert.match(result.permissionDecisionReason, /rule 13/);
  });

  it('asks before a contract or the prop map changes, by any editing tool', () => {
    assert.ok(asks('Write', { file_path: `${root}/contracts/components/Button.json`, content: '{}' }));
    assert.ok(asks('MultiEdit', { file_path: 'contracts/components/Modal.json', edits: [] }));
    assert.ok(asks('Edit', { file_path: `${root}/.ai/maps/prop-map.md` }));
  });

  it('lets everything else through — components, generated maps, other JSON', () => {
    assert.equal(runHook('Edit', { file_path: `${root}/packages/core/src/components/Button/Button.tsx` }), null);
    assert.equal(runHook('Write', { file_path: `${root}/contracts/manifest.json` }), null);
    assert.equal(runHook('Write', { file_path: `${root}/.ai/maps/figma-map.md` }), null);
    assert.equal(runHook('Write', { file_path: `${root}/packages/tokens/dist/tokens.json` }), null);
    assert.equal(runHook('Read', { file_path: `${root}/packages/tokens/src/tokens.json` }), null);
  });

  it('asks before the repo CLIs that write a gated file', () => {
    assert.ok(asks('Bash', { command: 'pnpm token:add semantic.color.text.neutral-lightest "{primitive.color.gray.500}" --type color' }));
    assert.ok(asks('Bash', { command: 'pnpm contract Spinner' }));
  });

  it('asks before a shell command that writes a gated file', () => {
    assert.ok(asks('Bash', { command: "sed -i 's/600/700/' packages/tokens/src/tokens.json" }));
    assert.ok(asks('Bash', { command: 'jq . x.json > contracts/components/Button.json' }));
    assert.ok(asks('Bash', { command: 'git checkout -- .ai/maps/prop-map.md' }));
    assert.ok(asks('Bash', { command: "python3 - <<'EOF'\nopen('packages/tokens/src/tokens.json','w').write('{}')\nEOF" }));
  });

  it('never asks to read one, or to commit a message that names one', () => {
    assert.equal(runHook('Bash', { command: 'cat packages/tokens/src/tokens.json | jq .semantic' }), null);
    assert.equal(runHook('Bash', { command: 'grep -n "x => y" .ai/maps/prop-map.md 2>&1 | head' }), null);
    assert.equal(runHook('Bash', { command: 'git diff contracts/components/Button.json' }), null);
    assert.equal(runHook('Bash', { command: 'git commit -m "Button: tokens.json -> new hover token"' }), null);
    assert.equal(runHook('Bash', { command: 'pnpm verify:contract' }), null);
  });

  it('in an app, asks before Helix itself is patched in place', () => {
    const result = runHook('Edit', { file_path: '/work/my-app/node_modules/@helixds/react/dist/index.js' });
    assert.equal(result.permissionDecision, 'ask');
    assert.match(result.permissionDecisionReason, /forks the design system/);
    assert.ok(asks('Write', { file_path: '/work/my-app/patches/@helixds__react@0.1.0.patch' }));
    assert.ok(asks('Bash', { command: 'pnpm patch @helixds/react' }));
    assert.ok(asks('Bash', { command: "sed -i 's/4px/6px/' node_modules/@helixds/react/dist/globals.css" }));
    assert.equal(runHook('Bash', { command: 'cat node_modules/@helixds/react/dist/contracts/Button.json' }), null);
    assert.equal(runHook('Edit', { file_path: '/work/my-app/src/App.tsx' }), null);
  });

  it('fails open on a payload it cannot read', () => {
    const out = execFileSync('node', [hook], { input: 'not json' }).toString().trim();
    assert.equal(out, '');
  });
});
